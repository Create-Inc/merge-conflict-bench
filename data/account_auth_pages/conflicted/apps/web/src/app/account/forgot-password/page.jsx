"use client";

import { useState } from "react";
<<<<<<< ours
import { Mail, Home } from "lucide-react";
=======
import { ArrowLeft, Mail, Check } from "lucide-react";
import { useTranslation } from "@/utils/useTranslation.jsx";
>>>>>>> theirs

function MainComponent() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
<<<<<<< ours
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
              <div className="mb-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-white/50">
                  <Mail className="h-8 w-8 text-slate-700" />
                </div>
              </div>
=======
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>
>>>>>>> theirs

<<<<<<< ours
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Check your email
              </h1>
=======
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Check Your Email
          </h1>
>>>>>>> theirs

<<<<<<< ours
              <p className="text-slate-600 mb-6">
                We&apos;ve sent a password reset link to{" "}
                <strong>{email}</strong>. Please check your inbox and click the
                link to reset your password.
              </p>
=======
          <p className="text-gray-600 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. Please
            check your inbox and click the link to reset your password.
          </p>

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try again in a
              few minutes.
            </p>
>>>>>>> theirs

<<<<<<< ours
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                  }}
                  className="w-full rounded-xl border border-white/70 bg-white/50 px-4 py-3 text-base font-semibold text-slate-800 transition-colors hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/20 focus:ring-offset-2 focus:ring-offset-transparent"
                >
                  Try a different email
                </button>
                <a
                  href="/account/signin"
                  className="block w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/30 focus:ring-offset-2 focus:ring-offset-transparent text-center"
                >
                  Back to Sign In
                </a>
              </div>
            </div>
=======
            <button
              onClick={() => {
                setSuccess(false);
                setEmail("");
              }}
              className="w-full rounded-lg bg-gray-100 px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Try Different Email
            </button>

            <a
              href="/account/signin"
              className="block w-full rounded-lg bg-[#1F7DFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF] focus:ring-offset-2 text-center"
            >
              Back to Sign In
            </a>
>>>>>>> theirs
          </div>
        </div>
      </div>
    );
  }

  return (
<<<<<<< ours
    <div className="relative min-h-screen w-full overflow-hidden">
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
        <div className="mb-8">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
>>>>>>> theirs

<<<<<<< ours
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
                  Forgot password?
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your email and we&apos;ll send you a reset link.
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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>
=======
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Forgot Password?
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>
        </div>
>>>>>>> theirs

<<<<<<< ours
                {error && (
                  <div className="rounded-xl border border-red-200/60 bg-white/60 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>

                <p className="text-center text-sm text-slate-700">
                  Remember your password?{" "}
                  <a
                    href="/account/signin"
                    className="font-semibold text-[#1F7DFF]"
                  >
                    Sign In
                  </a>
                </p>
              </div>
=======
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF]">
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Enter your email address"
                className="w-full bg-transparent text-lg outline-none"
                disabled={loading}
              />
>>>>>>> theirs
            </div>
<<<<<<< ours
          </form>
        </div>
      </div>
=======
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full rounded-lg bg-[#1F7DFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Remember your password?{" "}
            <a
              href="/account/signin"
              className="text-[#1F7DFF] hover:text-[#1A6DE0]"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
>>>>>>> theirs
    </div>
  );
}

export default MainComponent;
