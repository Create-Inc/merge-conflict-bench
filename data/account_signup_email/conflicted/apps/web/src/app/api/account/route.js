import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { sendEmail } from "@/app/api/utils/email";
import crypto from "crypto";

function getRequestOrigin(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return (
      process.env.APP_URL ||
      process.env.AUTH_URL ||
      "https://www.mojjo.se"
    ).replace(/\/$/, "");
  }
}

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // 5m

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = (searchParams.get("endpoint") || "").trim();

    if (endpoint === "email-verify") {
      const token = searchParams.get("token");
      if (!token) {
        return Response.redirect(
          new URL("/account/after-signup?verified=missing", request.url),
          302,
        );
      }

      const rows = await sql`
        SELECT identifier, expires, token
        FROM auth_verification_token
        WHERE token = ${token}
        LIMIT 1
      `;

      const rec = rows?.[0];
      if (!rec) {
        return Response.redirect(
          new URL("/account/after-signup?verified=invalid", request.url),
          302,
        );
      }

      const expires = new Date(rec.expires);
      if (Number.isNaN(expires.getTime()) || expires.getTime() <= Date.now()) {
        try {
          await sql`DELETE FROM auth_verification_token WHERE token = ${token}`;
        } catch {
          // ignore
        }
        return Response.redirect(
          new URL("/account/after-signup?verified=expired", request.url),
          302,
        );
      }

      const email = rec.identifier;

      // Avoid sql.transaction() to prevent environment-specific transaction errors.
      await sql`
        UPDATE auth_users
        SET "emailVerified" = NOW()
        WHERE LOWER(email) = LOWER(${email})
      `;
      await sql`DELETE FROM auth_verification_token WHERE token = ${token}`;

      return Response.redirect(
        new URL("/account/after-signup?verified=1", request.url),
        302,
      );
    }

    return Response.json(
      {
        error:
          "Invalid endpoint. Try GET /api/account?endpoint=email-verify&token=...",
      },
      { status: 400 },
    );
  } catch (e) {
    console.error("/api/account GET error", e);
    return Response.redirect(
      new URL("/account/after-signup?verified=error", request.url),
      302,
    );
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = (searchParams.get("endpoint") || "").trim();

    if (endpoint === "create-or-invite") {
      const body = await request.json().catch(() => ({}));
      const rawEmail = body?.email;
      const companyName = body?.companyName || body?.partnerName || null;
      const expiresInHours = Number(body?.expiresInHours);

      if (!rawEmail || typeof rawEmail !== "string") {
        return Response.json({ error: "Email is required" }, { status: 400 });
      }

      const email = rawEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: "Invalid email" }, { status: 400 });
      }

      const existing = await sql(
        `SELECT id, email FROM auth_users WHERE LOWER(email) = $1 LIMIT 1`,
        [email],
      );

      let userId = existing[0]?.id || null;

      if (!userId) {
        const created = await sql(
          `INSERT INTO auth_users (email) VALUES ($1) RETURNING id`,
          [email],
        );
        userId = created[0]?.id || null;
        if (!userId) {
          return Response.json(
            { error: "Failed to create user" },
            { status: 500 },
          );
        }
      }

      // Invalidate any previous unused tokens to avoid multiple active links
      try {
        await sql(
          `UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false`,
          [userId],
        );
      } catch (e) {
        console.warn("Failed to invalidate older tokens", e);
      }

      const token = crypto.randomBytes(32).toString("hex");
      const defaultInviteMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const ttlMs =
        Number.isFinite(expiresInHours) && expiresInHours > 0
          ? expiresInHours * 60 * 60 * 1000
          : defaultInviteMs;
      const expiresAt = new Date(Date.now() + ttlMs);
      const expiresAtIso = expiresAt.toISOString();

      await sql(
        `INSERT INTO password_reset_tokens (token, user_id, expires_at, used)
         VALUES ($1, $2, $3, false)`,
        [token, userId, expiresAtIso],
      );

      const baseUrl =
        process.env.APP_URL || process.env.AUTH_URL || "https://www.mojjo.se";
      const resetUrl = `${baseUrl}/account/reset-password?token=${token}`;

      try {
        const introPieces = ["Welcome to Magic Match!"];
        if (
          companyName &&
          typeof companyName === "string" &&
          companyName.trim()
        ) {
          introPieces.push(`${companyName.trim()} invited you to join.`);
        }

        const validityDays = Math.ceil(ttlMs / (24 * 60 * 60 * 1000));

        await sendEmail({
          to: email,
          subject: "You're invited to Mojjo Magic Match",
          template: "reset_password",
          templateData: {
            intro: introPieces.join(" "),
            body: `You’ve been invited as a consultant. Set your password to activate your account. This link will be valid for ${validityDays} day${validityDays > 1 ? "s" : ""}.`,
            ctaLabel: "Set your password",
            ctaUrl: resetUrl,
          },
        });
      } catch (emailErr) {
        console.error("Failed to send invitation email", emailErr);
      }

      return Response.json({
        ok: true,
        user_id: userId,
        resetUrl,
        expires_at: expiresAtIso,
      });
    }

    if (endpoint === "email-send-verification") {
      const session = await auth();
      const userId = session?.user?.id;
      if (!userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const rows = await sql`
        SELECT id, email, "emailVerified", verification_email_last_sent_at
        FROM auth_users
        WHERE id = ${userId}
        LIMIT 1
      `;
      const user = rows?.[0];
      if (!user?.email) {
        return Response.json({ error: "Missing email" }, { status: 400 });
      }

      if (user.emailVerified) {
        return Response.json({ ok: true, alreadyVerified: true });
      }

      // throttle repeated sends (prevents accidental resend loops)
      const throttleWindowMs = 5 * 60 * 1000; // 5 min
      const lastSentAt = user.verification_email_last_sent_at
        ? new Date(user.verification_email_last_sent_at)
        : null;

      if (
        lastSentAt &&
        !Number.isNaN(lastSentAt.getTime()) &&
        Date.now() - lastSentAt.getTime() < throttleWindowMs
      ) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(
            (throttleWindowMs - (Date.now() - lastSentAt.getTime())) / 1000,
          ),
        );
        return Response.json({
          ok: true,
          throttled: true,
          retryAfterSeconds,
        });
      }

      const identifier = String(user.email).trim();

      // Reuse an existing token when possible (prevents spamming)
      const existing = await sql`
        SELECT token, expires
        FROM auth_verification_token
        WHERE identifier = ${identifier} AND expires > NOW()
        ORDER BY expires DESC
        LIMIT 1
      `;

      let token = existing?.[0]?.token || null;
      let expiresAt = existing?.[0]?.expires
        ? new Date(existing[0].expires)
        : null;

      if (token && expiresAt && !Number.isNaN(expiresAt.getTime())) {
        const createdAtMs = expiresAt.getTime() - VERIFICATION_TTL_MS;
        const ageMs = Date.now() - createdAtMs;

<<<<<<< ours
      // record last-sent timestamp before sending
      await sql`
        UPDATE auth_users
        SET verification_email_last_sent_at = NOW()
        WHERE id = ${userId}
      `;

      // never allow empty baseUrl
      const baseUrl =
        process.env.APP_URL || process.env.AUTH_URL || "https://www.mojjo.se";
      const root = String(baseUrl).replace(/\/$/, "");
      const verifyUrl = `${root}/api/account?endpoint=email-verify&token=${encodeURIComponent(
=======
        if (ageMs >= 0 && ageMs < RESEND_COOLDOWN_MS) {
          return Response.json({ ok: true, throttled: true });
        }
      } else {
        await sql`DELETE FROM auth_verification_token WHERE identifier = ${identifier}`;

        token = crypto.randomBytes(32).toString("hex");
        expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

        await sql`
          INSERT INTO auth_verification_token(identifier, expires, token)
          VALUES (${identifier}, ${expiresAt.toISOString()}, ${token})
        `;
      }

      const origin = getRequestOrigin(request);
      const verifyUrl = `${origin}/api/account?endpoint=email-verify&token=${encodeURIComponent(
>>>>>>> theirs
        token,
      )}`;

      const subject = "Verify your email";
      const intro =
        "Please confirm your email to finish setting up your account.";

      await sendEmail({
        to: identifier,
        subject,
        template: "verify_email",
        templateData: {
          title: subject,
          intro,
          ctaLabel: "Verify email",
          ctaUrl: verifyUrl,
        },
      });

      return Response.json({ ok: true });
    }

    return Response.json(
      {
        error:
          "Invalid endpoint. Try POST /api/account?endpoint=create-or-invite or endpoint=email-send-verification",
      },
      { status: 400 },
    );
  } catch (err) {
    console.error("/api/account POST error", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
