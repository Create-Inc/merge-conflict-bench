"use client";

import { useState, useEffect } from "react";
import useAuth from "@/utils/useAuth";
<<<<<<< ours
import { Eye, EyeOff, Home } from "lucide-react";
=======

>>>>>>> theirs
import { useTranslation } from "@/utils/useTranslation.jsx";

function MainComponent() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  useEffect(() => {
    // Check for success message from URL params
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get("message");
      if (message) {
        setSuccessMessage(message);
      }
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!normalizedEmail || !normalizedPassword) {
      setError(t("fillAllFields"));
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email: normalizedEmail,
        password: normalizedPassword,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      console.error("Sign in error:", err);
      setError(t("incorrectCredentials"));
      setLoading(false);
    }
  };

  return (
<<<<<<< ours
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <img
        src={BG_URL}
        alt="City skyline"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-black/25" />
      <div className="absolute inset-0 bg-black/10" />
=======
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            {t("welcomeBack")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{t("subtitle")}</p>
        </div>
>>>>>>> theirs

<<<<<<< ours
      <div className="relative flex min-h-screen w-full items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <form
            noValidate
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/35 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7"
          >
            {/* Subtle watermark icon (matches screenshot vibe) */}
            <div className="pointer-events-none absolute -right-8 -top-10 opacity-[0.08]">
              <Home size={180} color="#0f172a" />
            </div>

            <div className="rounded-[22px] border border-white/70 bg-white/30 p-5 md:p-6">
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#1F7DFF]/25 bg-[#1F7DFF]/10">
                  <Home size={22} className="text-[#1F7DFF]" />
                </div>

                <div className="text-[13px] font-semibold tracking-wide text-slate-900">
                  HOOY SOLUTIONS
                </div>
                <div className="mt-0.5 text-[11px] font-medium text-slate-600">
                  SAFE &amp; SECURE HOMES
                </div>

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                  Welcome back
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in to access and manage your rental home
                </p>
              </div>

              <div className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <div className="overflow-hidden rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-within:border-[#1F7DFF]/40 focus-within:ring-2 focus-within:ring-[#1F7DFF]/20">
                    <input
                      required
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-within:border-[#1F7DFF]/40 focus-within:ring-2 focus-within:ring-[#1F7DFF]/20">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none pr-10"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Remember / forgot */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#1F7DFF] focus:ring-[#1F7DFF]/30"
                    />
                    Remember me
                  </label>

                  <a
                    href="/account/forgot-password"
                    className="text-sm font-medium text-[#1F7DFF] hover:opacity-90"
                  >
                    Forgot password?
                  </a>
                </div>

                {successMessage && (
                  <div className="rounded-xl border border-emerald-200/60 bg-white/60 p-3 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                {error && (
                  <div className="rounded-xl border border-red-200/60 bg-white/60 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50"
                >
                  {loading ? t("signingIn") : "Sign In"}
                </button>

                <p className="text-center text-sm text-slate-700">
                  Don&apos;t have an account?{" "}
                  <a href={signUpHref} className="font-semibold text-[#1F7DFF]">
                    Sign up
                  </a>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
=======
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("email")}
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF]">
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("enterEmail")}
                className="w-full bg-transparent text-lg outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                {t("password")}
              </label>
              <a
                href="/account/forgot-password"
                className="text-sm text-[#1F7DFF] hover:text-[#1A6DE0]"
              >
                Forgot password?
              </a>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF]">
              <input
                required
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-transparent text-lg outline-none"
                placeholder={t("enterPassword")}
              />
            </div>
          </div>

          {successMessage && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#1F7DFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
          <p className="text-center text-sm text-gray-600">
            {t("dontHaveAccount")}{" "}
            <a
              href={`/account/signup${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-[#1F7DFF] hover:text-[#1A6DE0]"
            >
              {t("signUp")}
            </a>
          </p>
        </div>
      </form>
>>>>>>> theirs
    </div>
  );
}

export default MainComponent;
