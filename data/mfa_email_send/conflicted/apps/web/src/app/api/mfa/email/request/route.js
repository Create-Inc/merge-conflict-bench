import crypto from "crypto";
import { getAuthUser } from "@/app/api/utils/getAuthUser";
import { sendEmail } from "@/app/api/utils/sendEmail";
import sql from "@/app/api/utils/sql";

function safeEmail(email) {
  const trimmed = String(email || "").trim();
  return trimmed || null;
}

function hashCode({ userId, code }) {
  const secret = String(process.env.AUTH_SECRET || "");
  return crypto
    .createHash("sha256")
    .update(`${userId}:${code}:${secret}`)
    .digest("hex");
}

export async function POST(request) {
  try {
    const { user } = await getAuthUser(request);
    if (!user?.id || !user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const toEmail = safeEmail(user.email);
    if (!toEmail) {
      return Response.json({ error: "Missing email" }, { status: 400 });
    }

    // DEBUG: Log email sending attempt
    console.log("📧 Attempting to send OTP to:", toEmail);
    console.log("📧 API Key configured:", !!process.env.RESEND_API_KEY);

    // Generate a 6-digit code
    const code = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const expiresAtIso = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const codeHash = hashCode({ userId: Number(user.id), code });

    await sql(
      "INSERT INTO public.mfa_email_otps (user_id, code_hash, expires_at) VALUES ($1, $2, $3)",
      [Number(user.id), codeHash, expiresAtIso],
    );

    // Mark user as not verified until they enter the code.
    await sql(
      `INSERT INTO public.mfa_user_verifications (user_id, verified_until, last_verified_at)
       VALUES ($1, NULL, now())
       ON CONFLICT (user_id)
       DO UPDATE SET verified_until = NULL, last_verified_at = now()`,
      [Number(user.id)],
    );

    const subject = "Your WHCC sign-in code";
    const text = `Your WHCC sign-in code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #0F172A; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">WHCC sign-in code</h2>
        <p style="margin: 0 0 12px;">Use this code to finish signing in. It expires in <b>10 minutes</b>.</p>
        <div style="display:inline-block; background:#F1F5F9; border:1px solid #E2E8F0; padding:14px 16px; border-radius:12px; font-size:28px; letter-spacing:6px; font-weight:800; color:#0F172A;">
          ${code}
        </div>
        <p style="margin: 16px 0 0; font-size: 12px; color:#64748B;">If you didn't request this, you can ignore this email.</p>
      </div>
    `;

<<<<<<< ours
    // Use Resend's dev sender by default to avoid domain-verification issues.
    const sendResult = await sendEmail({
      to: toEmail,
      subject,
      text,
      html,
      from: "WHCC <onboarding@resend.dev>",
    });
=======
    const emailResult = await sendEmail({ to: toEmail, subject, text, html });
>>>>>>> theirs

<<<<<<< ours
    // Resend typically returns { id: "..." }
    const messageId = sendResult?.id || null;

    return Response.json({ ok: true, messageId });
=======
    // Check if email was skipped due to missing API key
    if (emailResult?.skipped) {
      console.error("❌ EMAIL SKIPPED - RESEND_API_KEY NOT CONFIGURED");
      return Response.json(
        { error: "Email service is not configured. Please contact support." },
        { status: 500 },
      );
    }

    console.log("✅ Email sent successfully to:", toEmail);
    return Response.json({ ok: true });
>>>>>>> theirs
  } catch (error) {
<<<<<<< ours
    console.error("POST /api/mfa/email/request error", error);

    const msg = String(error?.message || "");
    if (msg.toLowerCase().includes("email service is not configured")) {
      return Response.json(
        {
          error:
            "Email is not configured for this environment. Please contact an admin to set RESEND_API_KEY.",
        },
        { status: 500 },
      );
    }

=======
    console.error("❌ POST /api/mfa/email/request error", error);
>>>>>>> theirs
    return Response.json(
      { error: "Could not send sign-in code. Please try again." },
      { status: 500 },
    );
  }
}
