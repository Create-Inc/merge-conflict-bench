import { auth } from "@/auth";

/**
 * Minimal Resend sender for server routes.
 *
 * Note: We intentionally do not log or return sensitive env values.
 */
export async function sendEmail({ to, subject, text, html, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
<<<<<<< ours
    // This used to silently skip, which can look like "it worked" while sending nothing.
    // For OTP and password-reset flows we *must* fail loudly.
    const err = new Error("Email service is not configured");
    err.status = 500;
    throw err;
=======
    console.warn("⚠️ RESEND_API_KEY is not set; skipping email send");
    return { skipped: true };
>>>>>>> theirs
  }

  // Resend will reject unverified domains in the `from` address.
  // We try a friendly default first, and fall back to Resend's dev domain.
  const primaryFrom = String(from || "WHCC <onboarding@resend.dev>");
  const fallbackFrom = "WHCC <onboarding@resend.dev>";

  const payloadBase = {
    to: Array.isArray(to) ? to : [to],
    subject: String(subject || ""),
    text: text ? String(text) : undefined,
    html: html ? String(html) : undefined,
  };

  const attemptSend = async (fromValue) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payloadBase,
        from: fromValue,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        body,
      };
    }

    const data = await response.json().catch(() => ({}));
    return { ok: true, data };
  };

  const first = await attemptSend(primaryFrom);
  if (first.ok) {
    console.log("✅ Email sent via Resend");
    return first.data;
  }

  console.error(
    "❌ Resend email failed (primary from):",
    first.status,
    first.statusText,
    first.body,
  );

  // If primaryFrom is already using the fallback, don't try twice.
  if (primaryFrom === fallbackFrom) {
    throw new Error(
      `Resend email failed: [${first.status}] ${first.statusText} ${first.body}`,
    );
  }

  console.log("🔄 Retrying with fallback domain...");
  const second = await attemptSend(fallbackFrom);
  if (second.ok) {
    console.log("✅ Email sent via Resend (fallback domain)");
    return second.data;
  }

  console.error(
    "❌ Resend email failed (fallback from):",
    second.status,
    second.statusText,
    second.body,
  );

  throw new Error(
    `Resend email failed: [${second.status}] ${second.statusText} ${second.body}`,
  );
}

/**
 * Helper to build a deep-link back into the app.
 */
export function buildAppUrl(pathname) {
  const base = process.env.APP_URL || "";
  const p = String(pathname || "");
  if (!base) {
    return p;
  }
  return `${base.replace(/\/$/, "")}${p.startsWith("/") ? "" : "/"}${p}`;
}

/**
 * Helper for routes that want the current actor user.
 */
export async function getActorUserIdOrThrow() {
  const session = await auth();
  if (!session || !session.user?.id) {
    const err = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
  return session.user.id;
}
