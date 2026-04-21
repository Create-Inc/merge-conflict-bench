"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import BrandLogo from "@/components/Brand/BrandLogo";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

function normalizeEmail(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";

  let email = input;
  // Handle common paste mistakes (mailto / URL)
  email = email.replace(/^mailto:/i, "");
  email = email.replace(/^https?:\/\//i, "");
  email = email.replace(/\/.+$/, "");

  return email.trim().toLowerCase();
}

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
<<<<<<< ours
  const [sendHint, setSendHint] = useState(null);
  const [devResetUrl, setDevResetUrl] = useState(null);
  const [devEmailError, setDevEmailError] = useState(null);
=======

>>>>>>> theirs

  // Replace dev-only state with a single generic fallback link state
  const [fallbackResetUrl, setFallbackResetUrl] = useState(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const fromQuery = new URLSearchParams(window.location.search).get(
      "callbackUrl",
    );
    return fromQuery || "/dashboard";
  }, []);

  const signInHref = useMemo(() => {
    const encoded = encodeURIComponent(callbackUrl || "/dashboard");
    return `/account/signin?callbackUrl=${encoded}`;
  }, [callbackUrl]);

  const signUpHref = useMemo(() => {
    const encoded = encodeURIComponent(callbackUrl || "/dashboard");
    return `/account/signup?callbackUrl=${encoded}`;
  }, [callbackUrl]);

  const requestResetMutation = useMutation({
    mutationFn: async ({ email: emailValue }) => {
      const r = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          data?.error ||
            `When fetching /api/password-reset/request, the response was [${r.status}] ${r.statusText}`,
        );
      }
      return data;
    },
    onSuccess: (data) => {
<<<<<<< ours
      setSendHint(null);

      // If email isn't configured in this environment (common on published site if secrets weren't set)
=======
      // If email isn't configured in this environment (common when prod secrets
      // weren't set), show a clear message, but still allow a reset via fallback link.
>>>>>>> theirs
      if (data?.emailConfigured === false) {
        setSuccess(null);
        setError(
<<<<<<< ours
          "Email sending isn’t set up on the published site yet. Please add RESEND_API_KEY to your Production secrets, publish updates, then try again.",
=======
          "Email sending isn’t set up on this site yet. Use the reset link below, or add RESEND_API_KEY to your secrets to enable emails.",
>>>>>>> theirs
        );
        setFallbackResetUrl(data?.fallbackResetUrl || null);
        return;
      }

      // Generic message (no user enumeration)
      setSuccess(
        "If an account exists for that email, you’ll receive a reset link shortly.",
      );
<<<<<<< ours
      setError(null);

      // If sending failed (but key exists), show a prod-safe hint so you know it's not Gmail spam.
      if (data?.sent === false && data?.hint === "email_send_failed") {
        setSendHint(
          "The site tried to send the email but the provider rejected it. This is usually a Resend domain/from-address issue on the published domain.",
        );
      }

      setDevResetUrl(data?.devResetUrl || null);
      setDevEmailError(data?.devEmailError || null);
=======
      setFallbackResetUrl(data?.fallbackResetUrl || null);
      setError(null);
>>>>>>> theirs
    },
    onError: (e) => {
      console.error(e);
      setError("Could not start the reset process. Please try again.");
    },
  });

  const isSubmitting =
    requestResetMutation.isPending ?? requestResetMutation.isLoading;

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
<<<<<<< ours
      setSendHint(null);
      setDevResetUrl(null);
      setDevEmailError(null);
=======
      setFallbackResetUrl(null);
>>>>>>> theirs

      const cleaned = normalizeEmail(email);
      if (!cleaned) {
        setError("Please enter your email.");
        return;
      }

      requestResetMutation.mutate({ email: cleaned });
    },
    [email, requestResetMutation],
  );

  const buttonLabel = isSubmitting ? "Sending…" : "Send reset link";

  return (
    <div
      className={`min-h-screen ${colors.bg.primary} ${colors.text.primary} font-inter transition-colors duration-200 flex items-center justify-center p-6`}
    >
      <div
        className={`${colors.bg.card} border ${colors.border.primary} ${colors.shadow} w-full max-w-md rounded-2xl p-8`}
      >
        <div className="flex justify-center mb-6">
          <BrandLogo mode="auth" href="/" size="auth" className="shrink-0" />
        </div>

        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className={`mt-1 text-sm ${colors.text.secondary}`}>
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label
              className={`block text-sm font-medium ${colors.text.secondary}`}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 w-full px-4 py-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} focus:outline-none focus:border-[#6B6CF6]`}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              {success}
              <div className="mt-2 text-emerald-200/90">
                If it doesn’t show up, check spam/promotions. Also, make sure
                you requested the reset from the same environment you’re trying
                to sign in on (preview vs published).
              </div>
            </div>
          ) : null}

<<<<<<< ours
          {sendHint ? (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              <div className="font-semibold">Email delivery issue</div>
              <div className="mt-1">{sendHint}</div>
            </div>
          ) : null}

          {devEmailError ? (
=======
          {fallbackResetUrl ? (
>>>>>>> theirs
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              <div className="font-semibold">
                Reset link (email delivery issue)
              </div>
              <div className="mt-1">
                We couldn’t send the email from the server. Use this link to
                reset your password:
              </div>
              <a
                href={fallbackResetUrl}
                className="mt-2 inline-block text-[#6B6CF6] hover:underline break-all"
              >
                {fallbackResetUrl}
              </a>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white px-4 py-3 font-semibold transition-colors"
          >
            {buttonLabel}
          </button>
        </form>

        <div className={`mt-6 text-sm ${colors.text.secondary} space-y-2`}>
          <div>
            Remembered your password?{" "}
            <a href={signInHref} className="text-[#6B6CF6] hover:underline">
              Sign in
            </a>
          </div>
          <div>
            Don’t have an account yet?{" "}
            <a href={signUpHref} className="text-[#6B6CF6] hover:underline">
              Create one
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
