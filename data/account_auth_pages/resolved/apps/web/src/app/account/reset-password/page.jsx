"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Check, Home, AlertCircle } from "lucide-react";

export default function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [tokenValid, setTokenValid] = useState(null);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const invalidMessage =
    error ||
    "This reset link has expired or is invalid. Please request a new one.";

  const BG_URL =
    "https://raw.createusercontent.com/9d90c077-01ae-4023-b2c7-b423f08baa76/";

  const signInHref = useMemo(() => {
    if (typeof window === "undefined") {
      return "/account/signin";
    }
    return `/account/signin${window.location.search || ""}`;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token") || "";
    const emailParam = urlParams.get("email") || "";

    if (!tokenParam || !emailParam) {
      setTokenValid(false);
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setToken(tokenParam);
    setEmail(emailParam);

    const validateToken = async () => {
      try {
        const response = await fetch("/api/auth/reset-password/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: tokenParam, email: emailParam }),
        });

        if (response.ok) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setError(
            "This reset link has expired or is invalid. Please request a new one.",
          );
        }
      } catch (err) {
        console.error(err);
        setTokenValid(false);
        setError("Unable to validate reset link. Please try again.");
      }
    };

    validateToken();
  }, []);

  const validateForm = () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return false;
    }

    if (!normalizedEmail) {
      setError("Please enter your email address");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!password) {
      setError("Please enter a new password");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href =
            "/account/signin?message=Password reset successfully. Please sign in with your new password.";
        }
      }, 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <img
          src={BG_URL}
          alt="City skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-black/25" />
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative flex min-h-screen w-full items-center justify-center p-4">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/60 bg-white/35 p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
            <div className="rounded-[22px] border border-white/70 bg-white/30 p-6">
              <div className="mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/50 bg-emerald-500/10">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Password reset
              </h1>
              <p className="text-slate-600">
                Your password has been updated. Redirecting you to sign in...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <img
          src={BG_URL}
          alt="City skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-black/25" />
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative flex min-h-screen w-full items-center justify-center p-4">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/60 bg-white/35 p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
            <div className="rounded-[22px] border border-white/70 bg-white/30 p-6">
              <div className="mb-4">
                <div className="mx-auto h-8 w-8 rounded-full border-2 border-[#1F7DFF] border-t-transparent animate-spin" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900">
                Validating reset link…
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Please wait a moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <img
          src={BG_URL}
          alt="City skyline"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-black/25" />
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative flex min-h-screen w-full items-center justify-center p-4">
          <div className="w-full max-w-[420px] rounded-[28px] border border-white/60 bg-white/35 p-5 text-center shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7">
            <div className="rounded-[22px] border border-white/70 bg-white/30 p-6">
              <div className="mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200/60 bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Invalid reset link
              </h1>
              <p className="text-slate-600 mb-6">{invalidMessage}</p>
              <div className="space-y-3">
                <a
                  href="/account/forgot-password"
                  className="block w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] text-center"
                >
                  Request new reset link
                </a>
                <a
                  href={signInHref}
                  className="block w-full rounded-xl border border-white/70 bg-white/50 px-4 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-white/60 text-center"
                >
                  Back to Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const disableSubmit = loading || !email.trim() || !password || !token;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src={BG_URL}
        alt="City skyline"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/5 to-black/25" />
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative flex min-h-screen w-full items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          <form
            noValidate
            onSubmit={onSubmit}
            className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/35 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl md:p-7"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 opacity-[0.08]">
              <Home size={180} color="#0f172a" />
            </div>

            <div className="rounded-[22px] border border-white/70 bg-white/30 p-5 md:p-6">
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
                  Reset password
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your email and a new password
                </p>
              </div>

              <div className="space-y-4">
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
                      onChange={(e2) => {
                        setEmail(e2.target.value);
                        setError(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    New Password
                  </label>
                  <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-within:border-[#1F7DFF]/40 focus-within:ring-2 focus-within:ring-[#1F7DFF]/20">
                    <input
                      required
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e2) => {
                        setPassword(e2.target.value);
                        setError(null);
                      }}
                      placeholder="Enter your new password"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none pr-10"
                      autoComplete="new-password"
                      disabled={loading}
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

                {error && (
                  <div className="rounded-xl border border-red-200/60 bg-white/60 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={disableSubmit}
                  className="w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <div className="text-center text-sm text-slate-700">
                  <a href={signInHref} className="font-semibold text-[#1F7DFF]">
                    Back to Sign In
                  </a>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
