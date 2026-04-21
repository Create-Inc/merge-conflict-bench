<<<<<<< ours
import sql from "@/app/api/utils/sql";
import crypto from "crypto";
import { sendEmail } from "@/app/api/utils/send-email";

function safeEmailString(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = safeEmailString(body?.email);

    // Always return a success shape to avoid leaking whether an email exists.
    if (!email) {
      return Response.json({ ok: true });
    }

    const users = await sql(
      "SELECT id, email FROM auth_users WHERE LOWER(email) = $1 LIMIT 1",
      [email],
    );

    const user = users?.[0] || null;
    if (!user?.id) {
      return Response.json({ ok: true });
    }

    const token = crypto.randomBytes(32).toString("hex");

    await sql(
      `
        INSERT INTO password_reset_tokens (token, user_id, used, expires_at, created_at)
        VALUES ($1, $2, false, now() + interval '1 hour', now())
      `,
      [token, Number(user.id)],
    );

    const baseUrl = String(process.env.APP_URL || "").replace(/\/$/, "");
    const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Reset your Tradeshow 360 password</h2>
        <p style="margin: 0 0 12px;">We received a request to reset the password for this email.</p>
        <p style="margin: 0 0 18px;">
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 14px; border-radius: 10px; background: #6B6CF6; color: white; text-decoration: none; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="margin: 0; color: #6b7280; font-size: 13px;">This link expires in 1 hour. If you didn’t request this, you can ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Reset your Tradeshow 360 password",
      html,
      text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("POST /api/password-reset/request error", e);
    // Still return ok to avoid account enumeration.
    return Response.json({ ok: true });
  }
}
=======
import sql from "@/app/api/utils/sql";
import { sendEmail } from "@/app/api/utils/send-email";

function safeNormalizeEmail(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function getAppBaseUrl(request) {
  // Prefer configured app URL. Fall back to request origin.
  const envUrl = process.env.APP_URL;
  if (envUrl && String(envUrl).trim().length > 0) {
    return String(envUrl).replace(/\/$/, "");
  }

  try {
    const url = new URL(request.url);
    return url.origin;
  } catch (e) {
    return "";
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = safeNormalizeEmail(body?.email);

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // IMPORTANT: Don't reveal whether a user exists.
    const rows =
      await sql`SELECT id, email FROM auth_users WHERE email = ${email} LIMIT 1`;
    const user = rows?.[0] || null;

    if (user) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

      await sql`INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES (${token}, ${user.id}, ${expiresAt})`;

      const baseUrl = getAppBaseUrl(request);
      const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;

      // Best-effort email send. If Resend isn't configured yet, we still return ok.
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Tradeshow 360 password",
          text: `Use this link to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height: 1.5">
              <h2 style="margin: 0 0 12px">Reset your password</h2>
              <p style="margin: 0 0 16px">Click the link below to set a new password. This link is valid for 1 hour.</p>
              <p style="margin: 0 0 16px"><a href="${resetUrl}">${resetUrl}</a></p>
              <p style="margin: 0; color: #6b7280; font-size: 14px">If you didn’t request this, you can ignore this email.</p>
            </div>
          `,
        });
      } catch (e) {
        console.error("Password reset email send failed", e);
      }
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/password-reset/request error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
>>>>>>> theirs
