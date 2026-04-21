"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import BrandLogo from "@/components/Brand/BrandLogo";
import useAuth from "@/utils/useAuth";
import { useTheme, getThemeClasses } from "@/utils/useTheme";

// Add a small helper so pasted links like "https://you@company.com/" don’t break sign-in.
function normalizeEmail(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";

  let email = input;
  email = email.replace(/^mailto:/i, "");
  email = email.replace(/^https?:\/\//i, "");
  email = email.replace(/\/.+$/, "");

  return email.trim().toLowerCase();
}

export default function SignInPage() {
  const { theme } = useTheme();
  const colors = getThemeClasses(theme);

  const { signInWithCredentials } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const url = new URL(window.location.href);
      const errorCode = url.searchParams.get("error");
      if (!errorCode) return;

      const errorMessages = {
        CredentialsSignin:
          "Incorrect email or password. If you don't have an account yet, create one first.",
        AccessDenied: "You don’t have permission to sign in.",
        Configuration:
          "Sign-in isn’t working right now. Please try again in a bit.",
        Verification: "Your sign-in link has expired. Please try again.",
      };

      const message =
        errorMessages[errorCode] ||
        "Could not sign in. Please double-check your details.";
      setError(message);

      // Clean up the URL so refresh doesn't keep showing the same error.
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    } catch (err) {
      console.error("Failed to parse auth error from URL", err);
    }
  }, []);

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/dashboard";
    const fromQuery = new URLSearchParams(window.location.search).get(
      "callbackUrl",
    );
    return fromQuery || "/dashboard";
  }, []);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);

      const trimmedEmail = normalizeEmail(email);
      if (!trimmedEmail || !password) {
        setError("Please enter your email and password.");
        return;
      }

      setLoading(true);
      try {
        await signInWithCredentials({
          email: trimmedEmail,
          password,
          callbackUrl,
          redirect: true,
        });
      } catch (err) {
        console.error(err);
        setError("Could not sign in. Please double-check your details.");
        setLoading(false);
      }
    },
    [callbackUrl, email, password, signInWithCredentials],
  );

  const linkToSignup = useMemo(() => {
    if (typeof window === "undefined") return "/account/signup";
    const qs = window.location.search || "";
    return `/account/signup${qs}`;
  }, []);

  const linkToForgotPassword = useMemo(() => {
    if (typeof window === "undefined") return "/account/forgot-password";
    const qs = window.location.search || "";
    return `/account/forgot-password${qs}`;
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

        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className={`mt-1 text-sm ${colors.text.secondary}`}>
          Use your work email. (It should match your Employee email in the app.)
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

          <div>
            <label
              className={`block text-sm font-medium ${colors.text.secondary}`}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 w-full px-4 py-3 rounded-lg ${colors.bg.input} border ${colors.border.primary} ${colors.text.primary} focus:outline-none focus:border-[#6B6CF6]`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

<<<<<<< ours
          <div className="flex items-center justify-between">
            <div className={`text-xs ${colors.text.secondary}`}>
              <a
                href={linkToForgotPassword}
                className="text-[#6B6CF6] hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </div>

=======
          <div className="flex items-center justify-end">
            <a
              href={linkToForgotPassword}
              className={`text-sm ${colors.text.secondary} hover:underline`}
            >
              Forgot password?
            </a>
          </div>

>>>>>>> theirs
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#6B6CF6] hover:bg-[#5C5DF0] disabled:opacity-60 text-white px-4 py-3 font-semibold transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="flex items-center justify-between mt-3">
          <a
            href={linkToForgotPassword}
            className="text-sm text-[#6B6CF6] hover:underline"
          >
            Forgot password?
          </a>
        </div>

        <div className={`mt-6 text-sm ${colors.text.secondary}`}>
          New here?{" "}
          <a href={linkToSignup} className="text-[#6B6CF6] hover:underline">
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
