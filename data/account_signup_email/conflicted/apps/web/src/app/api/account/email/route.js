import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { sendEmail } from "@/app/api/utils/email";
import crypto from "crypto";

// Consolidated email verification endpoints to reduce backend route count
// - POST /api/account/email?endpoint=send-verification
// - GET  /api/account/email?token=...   (verify)

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

// throttle repeated sends so a buggy client can’t spam users
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // 5m

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = (searchParams.get("endpoint") || "").trim();

    if (endpoint !== "send-verification") {
      return Response.json(
        { error: "Invalid endpoint. Use endpoint=send-verification" },
        { status: 400 },
      );
    }

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

    // NEW: throttle repeated sends
    const throttleWindowMs = 5 * 60 * 1000;
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
      return Response.json({ ok: true, throttled: true, retryAfterSeconds });
    }

    const identifier = String(user.email).trim();

    // Try to re-use an existing, unexpired token (prevents spamming + keeps old emails valid)
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

    // If we have an existing token, compute when it was created assuming our 24h TTL.
    // createdAt = expiresAt - 24h
    if (token && expiresAt && !Number.isNaN(expiresAt.getTime())) {
      const createdAtMs = expiresAt.getTime() - VERIFICATION_TTL_MS;
      const ageMs = Date.now() - createdAtMs;

<<<<<<< ours
    // NEW: record last-sent timestamp
    await sql`
      UPDATE auth_users
      SET verification_email_last_sent_at = NOW()
      WHERE id = ${userId}
    `;
=======
      if (ageMs >= 0 && ageMs < RESEND_COOLDOWN_MS) {
        // Too soon — don’t send another email.
        return Response.json({ ok: true, throttled: true });
      }
>>>>>>> theirs

<<<<<<< ours
    const baseUrl =
      process.env.APP_URL || process.env.AUTH_URL || "https://www.mojjo.se";

    // Keep the verification URL on THIS route (no extra /verify route)
    const verifyUrl = `${String(baseUrl).replace(/\/$/, "")}/api/account/email?token=${encodeURIComponent(
      token,
    )}`;
=======
      // Otherwise: resend the same token (still valid)
    } else {
      // Clean any old records for this identifier, then create a fresh token
      await sql`DELETE FROM auth_verification_token WHERE identifier = ${identifier}`;
>>>>>>> theirs

      token = crypto.randomBytes(32).toString("hex");
      expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS);

      await sql`
        INSERT INTO auth_verification_token(identifier, expires, token)
        VALUES (${identifier}, ${expiresAt.toISOString()}, ${token})
      `;
    }

    const origin = getRequestOrigin(request);
    const verifyUrl = `${origin}/api/account/email?token=${encodeURIComponent(token)}`;

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
  } catch (e) {
    console.error("/api/account/email POST error", e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");

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
      } catch {}
      return Response.redirect(
        new URL("/account/after-signup?verified=expired", request.url),
        302,
      );
    }

    const email = rec.identifier;

    // Avoid sql.transaction() here to prevent env-specific transaction issues.
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
  } catch (e) {
    console.error("/api/account/email GET error", e);
    return Response.redirect(
      new URL("/account/after-signup?verified=error", request.url),
      302,
    );
  }
}
