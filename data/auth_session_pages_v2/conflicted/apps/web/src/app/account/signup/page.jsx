<<<<<<< ours
import React from "react";
import useAuth from "@/utils/useAuth";

export default function SignUpPage() {
  const { signUpWithCredentials } = useAuth();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const safeEmail = String(email || "").trim();
    const safePassword = String(password || "");
    const safeName = String(fullName || "").trim();

    if (!safeEmail || !safePassword) {
      setError("Please enter your email and a password.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithCredentials({
        email: safeEmail,
        password: safePassword,
        name: safeName || undefined,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      console.error(err);

      const errorMessages = {
        CredentialsSignin:
          "That email may already be registered. Try signing in instead.",
        AccessDenied: "You don’t have permission to create an account.",
        Configuration: "Sign-up isn’t working right now. Please try again.",
      };

      const message =
        errorMessages?.[err?.message] ||
        "Could not create the account. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  const linkSuffix =
    typeof window !== "undefined" ? window.location.search : "";

  return (
    <div className="min-h-screen bg-white font-inter flex items-center justify-center p-6">
      <form
        onSubmit={onSubmit}
        noValidate
        className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
      >
        <div className="mb-6">
          <div className="text-xs tracking-widest text-gray-500">FIRE OPS</div>
          <h1 className="mt-2 text-2xl font-semibold text-gray-800">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Use any Microsoft email (Outlook/Hotmail/Microsoft 365) and choose a
            password.
          </p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <div className="text-sm font-medium text-gray-700">Name</div>
            <input
              name="name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name (optional)"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-gray-700">Email</div>
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-gray-700">Password</div>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-300"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {loading ? "Creating…" : "Create account"}
          </button>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href={`/account/signin${linkSuffix}`}
              className="text-gray-900 underline"
            >
              Sign in
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
=======
import { useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signUpWithCredentials } = useAuth();

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
      await signUpWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        OAuthSignin:
          "Couldn’t start sign-up. Please try again or use a different method.",
        OAuthCallback: "Sign-up failed after redirecting. Please try again.",
        OAuthCreateAccount:
          "Couldn’t create an account with this sign-up option. Try another one.",
        EmailCreateAccount:
          "This email can’t be used. It may already be registered.",
        Callback: "Something went wrong during sign-up. Please try again.",
        OAuthAccountNotLinked:
          "This account is linked to a different sign-in method. Try using that instead.",
        CredentialsSignin:
          "Invalid email or password. If you already have an account, try signing in instead.",
        AccessDenied: "You don’t have permission to sign up.",
        Configuration:
          "Sign-up isn’t working right now. Please try again later.",
        Verification: "Your sign-up link has expired. Request a new one.",
      };

      setError(
        errorMessages[err.message] || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Create Account
        </h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#357AFF] focus-within:ring-1 focus-within:ring-[#357AFF]">
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent text-lg outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white px-4 py-3 focus-within:border-[#357AFF] focus-within:ring-1 focus-within:ring-[#357AFF]">
              <input
                required
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-transparent text-lg outline-none"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#357AFF] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[#2E69DE] focus:outline-none focus:ring-2 focus:ring-[#357AFF] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign Up"}
          </button>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href={`/account/signin${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-[#357AFF] hover:text-[#2E69DE]"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default MainComponent;
>>>>>>> theirs
