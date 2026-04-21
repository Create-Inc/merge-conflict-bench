<<<<<<< ours
import { useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";
import designSystem from "@/design-system";

export default function SignInPage() {
  const { signInWithCredentials } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const ds = designSystem;

  const callbackSearch = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return window.location.search || "";
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      console.error(err);
      const msg = err?.message;

      const errorMessages = {
        OAuthSignin:
          "Couldn’t start sign-in. Please try again or use a different method.",
        OAuthCallback: "Sign-in failed after redirecting. Please try again.",
        OAuthCreateAccount:
          "Couldn’t create an account with this sign-in method. Try another option.",
        EmailCreateAccount:
          "This email can’t be used to create an account. It may already exist.",
        Callback: "Something went wrong during sign-in. Please try again.",
        OAuthAccountNotLinked:
          "This account is linked to a different sign-in method. Try using that instead.",
        CredentialsSignin: "Incorrect email or password. Try again.",
        AccessDenied: "You don’t have permission to sign in.",
        Configuration:
          "Sign-in isn’t working right now. Please try again later.",
        Verification: "Your sign-in link has expired. Request a new one.",
      };

      setError(errorMessages[msg] || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full font-inter flex items-center justify-center px-4 py-10"
      style={{ background: ds.colors.white, color: ds.colors.black }}
    >
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white border-2 rounded-lg p-8"
        style={{
          borderColor: ds.colors.black,
          boxShadow: ds.shadows.offsetLarge,
        }}
      >
        <div className="mb-6">
          <div className="flex items-baseline gap-3">
            <span
              className="text-5xl font-space-grotesk font-bold"
              style={{
                color: ds.colors.yellow,
                WebkitTextStroke: `2px ${ds.colors.black}`,
              }}
            >
              02
            </span>
            <div>
              <div
                className="text-xs uppercase tracking-[0.25em]"
                style={{ color: ds.colors.gray[500] }}
              >
                Account
              </div>
              <div
                className="h-[2px] w-14 mt-2"
                style={{ background: ds.colors.black }}
              ></div>
            </div>
          </div>

          <h1 className="mt-4 text-3xl font-space-grotesk font-bold">
            Sign in
          </h1>
          <p className="mt-2 text-sm" style={{ color: ds.colors.gray[700] }}>
            Welcome back. Use your email and password.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="w-full bg-white border-2 rounded-lg px-4 py-3 text-base outline-none"
              style={{
                borderColor: ds.colors.black,
                boxShadow: ds.shadows.offset,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = ds.colors.blue;
                e.target.style.boxShadow = `4px 4px 0px 0px ${ds.colors.blue}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = ds.colors.black;
                e.target.style.boxShadow = ds.shadows.offset;
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              className="w-full bg-white border-2 rounded-lg px-4 py-3 text-base outline-none"
              style={{
                borderColor: ds.colors.black,
                boxShadow: ds.shadows.offset,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = ds.colors.blue;
                e.target.style.boxShadow = `4px 4px 0px 0px ${ds.colors.blue}`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = ds.colors.black;
                e.target.style.boxShadow = ds.shadows.offset;
              }}
            />
          </div>

          {error ? (
            <div
              className="border-2 rounded-lg px-4 py-3 text-sm font-medium"
              style={{
                borderColor: ds.colors.pink,
                boxShadow: `3px 3px 0px 0px ${ds.colors.pink}`,
                color: ds.colors.gray[700],
                background: "#fff",
              }}
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 rounded-lg px-4 py-3 font-space-grotesk font-bold text-base transition-all duration-200"
            style={{
              background: ds.colors.yellow,
              borderColor: ds.colors.black,
              boxShadow: ds.shadows.offsetLarge,
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (loading) return;
              e.currentTarget.style.transform = "translate(-2px, -2px)";
              e.currentTarget.style.boxShadow = ds.shadows.offsetXL;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = ds.shadows.offsetLarge;
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <p
            className="text-center text-sm"
            style={{ color: ds.colors.gray[700] }}
          >
            Don’t have an account?{" "}
            <a
              href={`/account/signup${callbackSearch}`}
              className="font-semibold underline"
              style={{ color: ds.colors.blue }}
            >
              Create one
            </a>
          </p>
        </div>
      </form>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@300;400;600;700;800&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-space-grotesk { font-family: 'Space Grotesk', sans-serif; }
      `}</style>
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

  const { signInWithCredentials } = useAuth();

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
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      const errorMessages = {
        OAuthSignin:
          "Couldn’t start sign-in. Please try again or use a different method.",
        OAuthCallback: "Sign-in failed after redirecting. Please try again.",
        OAuthCreateAccount:
          "Couldn’t create an account with this sign-in method. Try another option.",
        EmailCreateAccount:
          "This email can’t be used to create an account. It may already exist.",
        Callback: "Something went wrong during sign-in. Please try again.",
        OAuthAccountNotLinked:
          "This account is linked to a different sign-in method. Try using that instead.",
        CredentialsSignin:
          "Incorrect email or password. Try again or reset your password.",
        AccessDenied: "You don’t have permission to sign in.",
        Configuration:
          "Sign-in isn’t working right now. Please try again later.",
        Verification: "Your sign-in link has expired. Request a new one.",
      };

      setError(
        errorMessages[err.message] || "Something went wrong. Please try again.",
      );
      setLoading(false);
    }
  };

  const PasswordInput = ({ newUser }) => {
    return (
      <input
        required
        name="password"
        type="password"
        className="w-full rounded-lg bg-transparent text-lg outline-none"
        placeholder="Enter your password"
      />
    );
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Welcome Back
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
            {loading ? "Loading..." : "Sign In"}
          </button>
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <a
              href={`/account/signup${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-[#357AFF] hover:text-[#2E69DE]"
            >
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default MainComponent;
>>>>>>> theirs
