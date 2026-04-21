"use client";

<<<<<<< ours
import { useMemo, useState } from "react";
import { Eye, EyeOff, Check, Home } from "lucide-react";
=======
import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
>>>>>>> theirs
import { useTranslation } from "@/utils/useTranslation.jsx";

function MainComponent() {
  const { t } = useTranslation();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email address");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.password) {
      setError("Please enter a password");
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

    if (!agreedToTerms) {
      setError("Please accept the terms and conditions");
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess(true);
      // Show verification message instead of immediate redirect
      setTimeout(() => {
        window.location.href =
          "/account/signin?message=Please check your email and click the verification link to complete your account setup.";
      }, 5000);
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
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
              <div className="mb-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/50 bg-emerald-500/10">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                Check your email
              </h1>
              <p className="text-slate-600 mb-4">
                We sent a verification link to <strong>{formData.email}</strong>
                . Please click it to activate your account.
              </p>
              <p className="text-sm text-slate-500">
                Redirecting you to sign in...
              </p>
=======
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <div className="mb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
>>>>>>> theirs
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Check Your Email!
          </h1>
          <p className="text-gray-600 mb-4">
            We've sent a verification link to <strong>{formData.email}</strong>.
            Please check your inbox and click the link to activate your account.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Didn't receive the email? Check your spam folder or we'll redirect
            you to sign in where you can request a new link.
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
          <h1 className="text-3xl font-bold text-gray-800">
            {t("createAccount")}
          </h1>
          <p className="mt-2 text-sm text-gray-600">Join our platform today</p>
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
                </div>

                <h1 className="mt-4 text-2xl font-bold text-slate-900">
                  Create account
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Create an account to access and manage your rental home
                </p>
              </div>

              <div className="space-y-4">
                {/* Name (optional) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Name (optional)
                  </label>
                  <div className="overflow-hidden rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-within:border-[#1F7DFF]/40 focus-within:ring-2 focus-within:ring-[#1F7DFF]/20">
                    <input
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Your name"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="name"
                    />
                  </div>
                </div>
=======
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("fullName")}
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF]">
              <input
                required
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("enterFullName")}
                className="w-full bg-transparent text-lg outline-none"
              />
            </div>
          </div>
>>>>>>> theirs

<<<<<<< ours
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
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="you@example.com"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none"
                      autoComplete="email"
                    />
                  </div>
                </div>
=======
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("email")}
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF]">
              <input
                required
                name="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("enterEmail")}
                className="w-full bg-transparent text-lg outline-none"
              />
            </div>
          </div>
>>>>>>> theirs

<<<<<<< ours
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
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Create a password"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none pr-10"
                      autoComplete="new-password"
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
          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t("password")}
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#1F7DFF] focus-within:ring-1 focus-within:ring-[#1F7DFF] relative">
              <input
                required
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t("createPassword")}
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
>>>>>>> theirs

<<<<<<< ours
                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Confirm Password
                  </label>
                  <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] focus-within:border-[#1F7DFF]/40 focus-within:ring-2 focus-within:ring-[#1F7DFF]/20">
                    <input
                      required
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm your password"
                      className="w-full bg-transparent text-base text-slate-900 placeholder:text-slate-400 outline-none pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-[#1F7DFF] focus:ring-[#1F7DFF]/30"
                  />
                  <label htmlFor="terms" className="text-sm text-slate-600">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="font-semibold text-[#1F7DFF] hover:opacity-90"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Terms and Conditions
                    </a>
                  </label>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200/60 bg-white/60 p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="w-full rounded-xl bg-[#1F7DFF] px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF]/30 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t("creatingAccount") : "Sign Up"}
                </button>
=======
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
                </div>
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
              </div>
            )}
          </div>
>>>>>>> theirs

<<<<<<< ours
                <p className="text-center text-sm text-slate-700">
                  Already have an account?{" "}
                  <a href={signInHref} className="font-semibold text-[#1F7DFF]">
                    Sign In
                  </a>
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
=======
          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
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
                placeholder="Confirm your password"
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

          {/* Terms Agreement */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1F7DFF] focus:ring-[#1F7DFF]"
            />
            <label
              htmlFor="terms"
              className="text-sm text-gray-600 leading-tight"
            >
              I agree to the{" "}
              <a
                href="/terms"
                className="text-[#1F7DFF] hover:underline"
                target="_blank"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                className="text-[#1F7DFF] hover:underline"
                target="_blank"
              >
                Privacy Policy
              </a>
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
            className="w-full rounded-lg bg-[#1F7DFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#1A6DE0] focus:outline-none focus:ring-2 focus:ring-[#1F7DFF] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t("creatingAccount") : t("signUp")}
          </button>

          <p className="text-center text-sm text-gray-600">
            {t("alreadyHaveAccount")}{" "}
            <a
              href={`/account/signin${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-[#1F7DFF] hover:text-[#1A6DE0]"
            >
              {t("signIn")}
            </a>
          </p>
        </div>
      </form>
>>>>>>> theirs
    </div>
  );
}

export default MainComponent;
