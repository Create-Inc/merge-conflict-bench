<<<<<<< ours
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import BrandLogo from "@/components/Brand/BrandLogo";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [token, setToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const t = url.searchParams.get("token");
    setToken(t);
  }, []);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const fromQuery = new URLSearchParams(window.location.search).get(
      "callbackUrl",
    );
    return fromQuery || "/dashboard";
  }, []);

  const resetMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const msg = data?.error || response.statusText;
        throw new Error(msg);
      }
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
    },
    onError: (err) => {
      console.error(err);
      const msg = err?.message || "Could not reset password";
      setError(msg);
    },
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);

      if (!token) {
        setError("Missing reset token. Please request a new reset link.");
        return;
      }

      if (!password || password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      resetMutation.mutate({ token, password });
    },
    [confirm, password, resetMutation, token],
  );

  const signinHref = useMemo(() => {
    const encoded = encodeURIComponent(callbackUrl);
    return `/account/signin?callbackUrl=${encoded}`;
  }, [callbackUrl]);

  const showForm = !success;

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

        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <p className={`mt-1 text-sm ${colors.text.secondary}`}>
          This link expires after 1 hour.
        </p>

        {showForm ? (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} focus:outline-none focus:border-[#6B6CF6]`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} focus:outline-none focus:border-[#6B6CF6]`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white px-4 py-3 font-semibold transition-colors"
            >
              {resetMutation.isPending ? "Saving…" : "Set new password"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Password updated. You can sign in now.
            </div>
            <a href={signinHref} className="block">
              <button className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] text-white px-4 py-3 font-semibold transition-colors">
                Go to sign in
              </button>
            </a>
          </div>
        )}

        <div className={`mt-6 text-sm ${colors.text.secondary}`}>
          <a
            href="/account/forgot-password"
            className="text-[#6B6CF6] hover:underline"
          >
            Need a new reset link?
          </a>
        </div>
      </div>
    </div>
  );
}
=======
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import BrandLogo from "@/components/Brand/BrandLogo";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

function readTokenFromUrl() {
  if (typeof window === "undefined") return "";
  const token = new URLSearchParams(window.location.search).get("token");
  return String(token || "").trim();
}

export default function ResetPasswordPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const fromQuery = new URLSearchParams(window.location.search).get(
      "callbackUrl",
    );
    return fromQuery || "/dashboard";
  }, []);

  useEffect(() => {
    setToken(readTokenFromUrl());
  }, []);

  const signInHref = useMemo(() => {
    const encoded = encodeURIComponent(callbackUrl || "/dashboard");
    return `/account/signin?callbackUrl=${encoded}`;
  }, [callbackUrl]);

  const resetMutation = useMutation({
    mutationFn: async ({ token: t, password: p }) => {
      const r = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t, password: p }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          data?.error ||
            `When fetching /api/password-reset/confirm, the response was [${r.status}] ${r.statusText}`,
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
      setError(e?.message || "Could not reset password.");
    },
  });

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setError(null);

      const t = String(token || "").trim();
      if (!t) {
        setError("Missing reset token. Please use the link from your email.");
        return;
      }

      if (password.trim().length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      resetMutation.mutate({ token: t, password });
    },
    [confirm, password, resetMutation, token],
  );

  const buttonLabel = resetMutation.isPending ? "Saving…" : "Set new password";

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

        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <p className={`mt-1 text-sm ${colors.text.secondary}`}>
          Choose a new password for your account.
        </p>

        {success ? (
          <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Password updated. You can now{" "}
            <a href={signInHref} className="text-[#6B6CF6] hover:underline">
              sign in
            </a>
            .
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} focus:outline-none focus:border-[#6B6CF6]`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${colors.text.secondary}`}
              >
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`mt-1 w-full px-4 py-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} focus:outline-none focus:border-[#6B6CF6]`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white px-4 py-3 font-semibold transition-colors"
            >
              {buttonLabel}
            </button>

            <div className={`text-sm ${colors.text.secondary}`}>
              <a href={signInHref} className="text-[#6B6CF6] hover:underline">
                Back to sign in
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
>>>>>>> theirs
