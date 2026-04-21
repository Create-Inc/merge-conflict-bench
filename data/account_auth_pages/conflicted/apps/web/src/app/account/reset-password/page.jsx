"use client";

<<<<<<< ours
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Check, Home } from "lucide-react";
=======
import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, X, AlertCircle } from "lucide-react";
import { useTranslation } from "@/utils/useTranslation.jsx";
>>>>>>> theirs

function MainComponent() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");

  // Password strength validation
  const getPasswordStrength = (password) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    Object.values(checks).forEach((check) => check && score++);

    return {
      score,
      checks,
      strength: score <= 2 ? "weak" : score <= 3 ? "medium" : "strong",
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  useEffect(() => {
    // Extract token and email from URL parameters
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenParam = urlParams.get("token");
      const emailParam = urlParams.get("email");

      if (!tokenParam || !emailParam) {
        setError("Invalid reset link. Please request a new password reset.");
        setTokenValid(false);
        return;
      }

      setToken(tokenParam);
      setEmail(emailParam);

      // Validate token with backend
      validateToken(tokenParam, emailParam);
    }
  }, []);

  const validateToken = async (token, email) => {
    try {
      const response = await fetch("/api/auth/reset-password/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email }),
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
      setTokenValid(false);
      setError("Unable to validate reset link. Please try again.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.password) {
      setError("Please enter a new password");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

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
          email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      // Redirect to signin page with success message after 3 seconds
      setTimeout(() => {
        window.location.href =
          "/account/signin?message=Password reset successfully. Please sign in with your new password.";
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show success state
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
=======
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Password Reset!
          </h1>
          <p className="text-gray-600 mb-4">
            Your password has been reset successfully. Redirecting you to sign
            in...
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }
>>>>>>> theirs

<<<<<<< ours
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
=======
  // Show error state for invalid token
  if (tokenValid === false) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
>>>>>>> theirs
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Invalid Reset Link
          </h1>
          <p className="text-gray-600 mb-6">
            This password reset link has expired or is invalid. Please request a
            new one.
          </p>
          <div className="space-y-3">
            <a
              href="/account/forgot-password"
              className="block w-full rounded-lg bg-[#1F7DFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF] focus:ring-offset-2 text-center"
            >
              Request New Reset Link
            </a>
            <a
              href="/account/signin"
              className="block w-full rounded-lg bg-gray-100 px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 text-center"
            >
              Back to Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while validating token
  if (tokenValid === null) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mb-4">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
          <h1 className="text-xl font-medium text-gray-800">
            Validating reset link...
          </h1>
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
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
=======
        <div className="space-y-4">
          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF] relative">
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Enter your new password"
                className="w-full bg-transparent text-lg outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="space-y-2">
                <div className="flex space-x-1">
                  <div
                    className={`h-1 flex-1 rounded ${passwordStrength.score >= 1 ? "bg-red-500" : "bg-gray-200"}`}
                  ></div>
                  <div
                    className={`h-1 flex-1 rounded ${passwordStrength.score >= 3 ? "bg-yellow-500" : "bg-gray-200"}`}
                  ></div>
                  <div
                    className={`h-1 flex-1 rounded ${passwordStrength.score >= 4 ? "bg-green-500" : "bg-gray-200"}`}
                  ></div>
>>>>>>> theirs
                </div>
<<<<<<< ours

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                  Reset password
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Enter your email and a new password
                </p>
=======
                <div className="text-xs text-gray-600 space-y-1">
                  <div
                    className={`flex items-center space-x-2 ${passwordStrength.checks.length ? "text-green-600" : "text-gray-400"}`}
                  >
                    {passwordStrength.checks.length ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    <span>At least 8 characters</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${passwordStrength.checks.uppercase && passwordStrength.checks.lowercase ? "text-green-600" : "text-gray-400"}`}
                  >
                    {passwordStrength.checks.uppercase &&
                    passwordStrength.checks.lowercase ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    <span>Upper & lowercase letters</span>
                  </div>
                  <div
                    className={`flex items-center space-x-2 ${passwordStrength.checks.number ? "text-green-600" : "text-gray-400"}`}
                  >
                    {passwordStrength.checks.number ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
                    <span>At least one number</span>
                  </div>
                </div>
>>>>>>> theirs
              </div>
<<<<<<< ours

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
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                </div>
=======
            )}
          </div>
>>>>>>> theirs

<<<<<<< ours
                {/* New Password */}
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
                      onChange={(e) => {
                        setPassword(e.target.value);
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
=======
          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF] relative">
              <input
                required
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="Confirm your new password"
                className="w-full bg-transparent text-lg outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword &&
              formData.password !== formData.confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
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
                  disabled={disableSubmit}
                  className="w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
=======
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}
>>>>>>> theirs

<<<<<<< ours
                <div className="text-center text-sm text-slate-700">
                  <a href={signInHref} className="font-semibold text-[#1F7DFF]">
                    Back to Sign In
                  </a>
                </div>

                {!token && (
                  <div className="text-center text-sm text-slate-600">
                    <a
                      href="/account/forgot-password"
                      className="font-medium text-[#1F7DFF] hover:opacity-90"
                    >
                      Request a new reset link
                    </a>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
=======
          <button
            type="submit"
            disabled={
              loading || !formData.password || !formData.confirmPassword
            }
            className="w-full rounded-lg bg-[#1F7DFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Resetting Password..." : "Reset Password"}
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
