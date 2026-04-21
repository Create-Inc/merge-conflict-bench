import sql from "@/app/api/utils/sql";
import crypto from "crypto";
import { sendEmail } from "@/app/api/utils/send-email";

function normalizeEmail(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";

  let email = input;
  email = email.replace(/^mailto:/i, "");
  email = email.replace(/^https?:\/\//i, "");
  email = email.replace(/\/.+$/, "");

  return email.trim().toLowerCase();
}

function getAppBaseUrl(request) {
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
    const email = normalizeEmail(body?.email);

    // Always respond success to avoid leaking which emails exist.
    if (!email) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const users = await sql(
      "SELECT id, email FROM auth_users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    );

    const user = users?.[0] || null;
    if (!user?.id) {
      return Response.json({ ok: true }, { status: 200 });
    }

    const token = crypto.randomBytes(32).toString("hex");

    // Invalidate any previous unused tokens for this user, then create a fresh one.
    await sql.transaction([
      sql`UPDATE password_reset_tokens SET used = true WHERE user_id = ${user.id} AND used = false`,
      sql`INSERT INTO password_reset_tokens (token, user_id, used, expires_at)
          VALUES (${token}, ${user.id}, false, NOW() + INTERVAL '1 hour')`,
    ]);

    const baseUrl = getAppBaseUrl(request);
    const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;

    // Best-effort email send. (We still return ok to avoid account enumeration.)
    try {
      const subject = "Reset your TradeShow 360 password";
      const text = `You requested a password reset.\n\nReset your password here: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
      const html = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.4;">
          <h2 style="margin: 0 0 12px;">Reset your password</h2>
          <p style="margin: 0 0 12px;">We received a request to reset your TradeShow 360 password.</p>
          <p style="margin: 0 0 16px;">
            <a href="${resetUrl}" style="display:inline-block;background:#6B6CF6;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600;">Reset password</a>
          </p>
          <p style="margin: 0 0 8px; color: #555;">Or copy and paste this link:</p>
          <p style="margin: 0; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="border:0;border-top:1px solid #eee;margin:20px 0;" />
          <p style="margin:0;color:#777;font-size:12px;">If you didn’t request this, you can safely ignore this email.</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        html,
        text,
      });
    } catch (e) {
      console.error("Password reset email send failed", e);
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("POST /api/password-reset/request error", err);
    // Still do not leak details.
    return Response.json({ ok: true }, { status: 200 });
  }
}
