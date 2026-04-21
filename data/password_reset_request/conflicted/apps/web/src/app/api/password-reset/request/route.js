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

// Prefer the current request's host (published vs preview) so reset links always
// match the environment where the reset was requested.
function getAppBaseUrl(request) {
  // Prefer platform-provided base URL if present.
  const platformUrl =
    process.env.NEXT_PUBLIC_CREATE_APP_URL || process.env.APP_URL;
  const tryNormalize = (u) => {
    if (!u) return "";
    try {
      return String(new URL(String(u)).origin).replace(/\/$/, "");
    } catch {
      return "";
    }
  };

  const normalizedPlatform = tryNormalize(platformUrl);

  // Use forwarded headers when available (common behind proxies/CDNs)
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  // Fall back to request.url origin, then platform URL.
  try {
    const url = new URL(request.url);
    return url.origin.replace(/\/$/, "");
  } catch {
    return normalizedPlatform;
  }
}

export async function POST(request) {
  // IMPORTANT: Always respond success to avoid leaking which emails exist.
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    const emailConfigured = Boolean(process.env.RESEND_API_KEY);

    // Environment detection (Anything dev vs published)
    const envFlag = String(
      process.env.EXPO_PUBLIC_CREATE_ENV || process.env.ENV || "",
    ).toLowerCase();
    const isProd =
      process.env.NODE_ENV === "production" || envFlag.includes("prod");

    if (!email) {
      return Response.json(
        { ok: true, emailConfigured, sent: false },
        { status: 200 },
      );
    }

    const users = await sql(
      "SELECT id, email FROM auth_users WHERE lower(email) = lower($1) LIMIT 1",
      [email],
    );

    const user = users?.[0] || null;
    if (!user?.id) {
      // Still return ok to avoid enumeration.
      return Response.json(
        { ok: true, emailConfigured, sent: false },
        { status: 200 },
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    await sql.transaction([
      sql`UPDATE password_reset_tokens SET used = true WHERE user_id = ${user.id} AND used = false`,
      sql`INSERT INTO password_reset_tokens (token, user_id, used, expires_at)
          VALUES (${token}, ${user.id}, false, NOW() + INTERVAL '1 hour')`,
    ]);

    const baseUrl = getAppBaseUrl(request);
    const resetUrl = `${baseUrl}/account/reset-password?token=${encodeURIComponent(token)}`;

    let sent = false;
    let emailSendError = null;

    if (!emailConfigured) {
      emailSendError = "RESEND_API_KEY is not set for this environment.";
    } else {
      try {
        const subject = "Reset your TradeShow 360 password";
        const text = `You requested a password reset.\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`;
        const html = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.4; color: #111827;">
          <h2 style="margin: 0 0 12px;">Reset your password</h2>
          <p style="margin: 0 0 12px;">We received a request to reset your TradeShow 360 password.</p>
          <p style="margin: 0 0 16px;">
            <a href="${resetUrl}" style="display:inline-block;background:#6B6CF6;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:600;">Reset password</a>
          </p>
          <p style="margin: 0 0 8px; color: #4B5563;">Or copy and paste this link:</p>
          <p style="margin: 0; word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
          <hr style="border:0;border-top:1px solid #E5E7EB;margin:20px 0;" />
          <p style="margin:0;color:#6B7280;font-size:12px;">If you didn’t request this, you can safely ignore this email.</p>
        </div>
      `;

        await sendEmail({
          to: user.email,
          subject,
          html,
          text,
        });
        sent = true;
      } catch (e) {
        console.error("Password reset email send failed", e);
        emailSendError = e?.message
          ? String(e.message)
          : "Unknown email send error";
      }
    }

    const payload = { ok: true, sent, emailConfigured };

<<<<<<< ours
    // Only include debug information outside production.
=======
    // If email delivery failed, return a fallback reset link even in prod.
    // This avoids blocking the user when email deliverability is flaky.
    if (!sent) {
      payload.fallbackResetUrl = resetUrl;
    }

    // Dev convenience: return the link + error so you can debug quickly.
>>>>>>> theirs
    if (!isProd) {
      payload.devResetUrl = resetUrl;
      payload.devEmailError = emailSendError;
    }

    // In production, include a generic hint if sending failed.
    if (isProd && emailConfigured && !sent) {
      payload.hint = "email_send_failed";
    }

    return Response.json(payload, { status: 200 });
  } catch (err) {
    console.error("POST /api/password-reset/request error", err);
    return Response.json(
      {
        ok: true,
        emailConfigured: Boolean(process.env.RESEND_API_KEY),
        sent: false,
      },
      { status: 200 },
    );
  }
}
