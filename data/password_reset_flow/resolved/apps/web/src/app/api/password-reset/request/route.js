import sql from "@/app/api/utils/sql";
import crypto from "crypto";
import { sendEmail } from "@/app/api/utils/send-email";

function safeNormalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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
    const email = safeNormalizeEmail(body?.email);

    // Don't reveal whether a user exists.
    if (!email) {
      return Response.json({ ok: true });
    }

    const rows = await sql(
      "SELECT id, email FROM auth_users WHERE LOWER(email) = $1 LIMIT 1",
      [email],
    );
    const user = rows?.[0] || null;

    if (user?.id) {
      const token = crypto.randomBytes(32).toString("hex");

      await sql(
        `
          INSERT INTO password_reset_tokens (token, user_id, used, expires_at, created_at)
          VALUES ($1, $2, false, now() + interval '1 hour', now())
        `,
        [token, Number(user.id)],
      );

      const baseUrl = getAppBaseUrl(request);
      const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;

      // Best-effort email send (still return ok even if email fails).
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Tradeshow 360 password",
          text: `Use this link to reset your password (valid for 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, you can ignore this email.`,
          html: `
            <div style="font-family: ui-sans-serif, system-ui, -apple-system; line-height: 1.5">
              <h2 style="margin: 0 0 12px">Reset your Tradeshow 360 password</h2>
              <p style="margin: 0 0 16px">Click the button below to set a new password. This link is valid for 1 hour.</p>
              <p style="margin: 0 0 16px">
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 14px; border-radius: 10px; background: #6B6CF6; color: white; text-decoration: none; font-weight: 600;">
                  Reset password
                </a>
              </p>
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
    // Still return ok to avoid account enumeration.
    return Response.json({ ok: true });
  }
}
