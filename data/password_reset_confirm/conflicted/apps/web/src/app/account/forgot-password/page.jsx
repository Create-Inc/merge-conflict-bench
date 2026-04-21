<<<<<<< ours
"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import BrandLogo from "@/components/Brand/BrandLogo";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

function normalizeEmail(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";

  let email = input;
  email = email.replace(/^mailto:/i, "");
  email = email.replace(/^https?:\/\//i, "");
  email = email.replace(/\/.+$/, "");
  return email.trim().toLowerCase();
}

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const requestResetMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(
          `When fetching /api/password-reset/request, the response was [${response.status}] ${response.statusText}`,
        );
      }
      return response.json();
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      console.error(err);
      setError("Could not send the reset email. Please try again.");
    },
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      const cleaned = normalizeEmail(email);
      if (!cleaned) {
        setError("Please enter your email.");
        return;
      }

      requestResetMutation.mutate({ email: cleaned });
    },
    [email, requestResetMutation],
  );

  const linkToSignin = useMemo(() => {
    if (typeof window === "undefined") return "/account/signin";
    const qs = window.location.search || "";
    return `/account/signin${qs}`;
  }, []);

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

        <h1 className="text-2xl font-semibold">Reset your password</h1>
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
              If that email exists, we sent a reset link. Please check your
              inbox.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={requestResetMutation.isPending}
            className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white px-4 py-3 font-semibold transition-colors"
          >
            {requestResetMutation.isPending ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <div className={`mt-6 text-sm ${colors.text.secondary}`}>
          <a href={linkToSignin} className="text-[#6B6CF6] hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
=======
"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import BrandLogo from "@/components/Brand/BrandLogo";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

export default function ForgotPasswordPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [email, setEmail] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

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
    onSuccess: () => {
      setSuccess(true);
      setError(null);
    },
    onError: (e) => {
      console.error(e);
      setError("Could not send the reset email. Please try again.");
    },
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);

      const trimmedEmail = String(email || "")
        .trim()
        .toLowerCase();
      if (!trimmedEmail) {
        setError("Please enter your email.");
        return;
      }

      requestResetMutation.mutate({ email: trimmedEmail });
    },
    [email, requestResetMutation],
  );

  const buttonLabel = requestResetMutation.isPending
    ? "Sending…"
    : "Send reset link";

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
              If an account exists for that email, you’ll receive a reset link
              shortly.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={requestResetMutation.isPending}
            className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white px-4 py-3 font-semibold transition-colors"
          >
            {buttonLabel}
          </button>
        </form>

        <div className={`mt-6 text-sm ${colors.text.secondary}`}>
          Remembered your password?{" "}
          <a href={signInHref} className="text-[#6B6CF6] hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
>>>>>>> theirs
