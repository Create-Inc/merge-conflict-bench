import { auth } from "@/auth";

/**
 * Minimal Resend sender for server routes.
 *
 * NOTE:
 * - This must NOT silently succeed when RESEND_API_KEY is missing.
 * - If email is not configured, we throw so OTP / password reset flows show a real error.
 */
export async function sendEmail({ to, subject, text, html, from }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("Email service is not configured");
    err.status = 500;
    throw err;
  }

  // Resend rejects unverified domains. Use Resend's dev sender as a safe default.
  const fallbackFrom = "WHCC <onboarding@resend.dev>";
  const primaryFrom = String(from || fallbackFrom);

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
    return first.data;
  }

  console.error(
    "Resend email failed (primary from)",
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

  const second = await attemptSend(fallbackFrom);
  if (second.ok) {
    return second.data;
  }

  console.error(
    "Resend email failed (fallback from)",
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
