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
            Use a Microsoft email (Outlook/Hotmail/Microsoft 365) and choose a
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
