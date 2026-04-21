"use client";

import { useEffect, useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/");

  const { signInWithCredentials } = useAuth();

<<<<<<< ours
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const cb = params.get("callbackUrl");
    if (cb && cb.startsWith("/")) {
      setCallbackUrl(cb);
    }
  }, []);

  const isStaffFlow = useMemo(() => {
    return String(callbackUrl || "").startsWith("/staff");
  }, [callbackUrl]);

  const inviteOnlyNote =
    "Staff accounts are invite-only. If you need access, please contact Our Vision administrator.";

=======
  useEffect(() => {
    // Only read window in the browser
    try {
      const params = new URLSearchParams(window.location.search);
      const cb = params.get("callbackUrl");
      if (cb && cb.trim()) {
        setCallbackUrl(cb);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const isStaffSignin = useMemo(() => {
    return typeof callbackUrl === "string" && callbackUrl.startsWith("/staff");
  }, [callbackUrl]);

  const subtitle = isStaffSignin
    ? "Staff access is invite-only"
    : "Sign in to your account";

>>>>>>> theirs
  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: callbackUrl || "/",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        OAuthSignin:
          "Couldn't start sign-in. Please try again or use a different method.",
        OAuthCallback: "Sign-in failed after redirecting. Please try again.",
        OAuthCreateAccount:
          "Couldn't create an account with this sign-in method. Try another option.",
        EmailCreateAccount:
          "This email can't be used to create an account. It may already exist.",
        Callback: "Something went wrong during sign-in. Please try again.",
        OAuthAccountNotLinked:
          "This account is linked to a different sign-in method. Try using that instead.",
        CredentialsSignin:
          "Incorrect email or password. Try again or reset your password.",
        AccessDenied: "You don't have permission to sign in.",
        Configuration:
          "Sign-in isn't working right now. Please try again later.",
        Verification: "Your sign-in link has expired. Request a new one.",
      };

      setError(
        errorMessages[err.message] || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  const backgroundClass =
    "min-h-screen bg-gradient-to-br from-[#cc0000] via-[#b30000] to-black";

  const headingTitle = isStaffFlow ? "Staff Portal" : "Our Vision Portal";
  const headingSubtitle = isStaffFlow
    ? "Sign in to access staff tools"
    : "Sign in to your account";

  const signUpHref = `/account/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
<<<<<<< ours
    <div
      className={`${backgroundClass} flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}
    >
=======
    <div className="min-h-screen bg-gradient-to-br from-[#cc0000] via-[#b30000] to-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
>>>>>>> theirs
      <div className="max-w-md w-full space-y-6">
        {/* Brand header */}
        <div className="flex flex-col items-center">
          <a href="/" className="mb-3">
            <img
              src="https://ucarecdn.com/5380eb8a-7d96-4358-bfa9-da4ad22eeb9e/-/format/auto/"
              alt="Our Vision"
              className="h-16"
            />
          </a>
          <h1 className="text-center text-2xl font-semibold text-white">
            {headingTitle}
          </h1>
<<<<<<< ours
          <p className="text-center text-white/90">{headingSubtitle}</p>

          {isStaffFlow && (
            <p className="text-center text-white/80 text-sm mt-2 max-w-sm">
              {inviteOnlyNote}
            </p>
          )}
=======
          <p className="text-center text-white/85">{subtitle}</p>
>>>>>>> theirs
        </div>

        {/* Card */}
        <form
          className="mt-2 space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
          onSubmit={onSubmit}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-[#cc0000] focus:z-10"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#cc0000] focus:border-[#cc0000] focus:z-10"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#cc0000] hover:bg-[#b30000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#cc0000] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

<<<<<<< ours
          {!isStaffFlow && (
            <div className="text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <a
                href={signUpHref}
                className="text-[#cc0000] hover:text-[#b30000] font-medium"
              >
                Sign up
              </a>
            </div>
          )}

          {isStaffFlow && (
            <div className="text-center">
              <a href="/" className="text-sm text-gray-600 hover:text-black">
                Back to portal
              </a>
            </div>
          )}
=======
          {/* Staff is invite-only: hide self-service signup CTA */}
          {!isStaffSignin && (
            <div className="text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <a
                href="/account/signup"
                className="text-[#cc0000] hover:text-[#b30000] font-medium"
              >
                Sign up
              </a>
            </div>
          )}

          {isStaffSignin && (
            <div className="text-center text-sm text-gray-600">
              Staff accounts are invite-only. If you need access, please contact
              DeAndre or Andre.
            </div>
          )}
>>>>>>> theirs
        </form>

        {/* Decorative brand glow */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div
            className="absolute -top-24 -right-24 w-[360px] h-[360px] rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at center, #cc0000, transparent 60%)",
            }}
          />
          <div
            className="absolute -bottom-24 -left-24 w-[300px] h-[300px] rounded-full opacity-20 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at center, #b30000, transparent 60%)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
