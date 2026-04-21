import { useEffect, useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [lockedUser, setLockedUser] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const { signInWithCredentials } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const presetUser = (params.get("user") || "").trim();
    const cb = (params.get("callbackUrl") || "").trim();

    if (cb) {
      setCallbackUrl(cb);
    }

    if (presetUser) {
      setEmail(presetUser);
      setLockedUser(true);
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    // allow username sign-in by turning it into <username>@smtp-checker.local
    let emailToSend = email.trim();
    if (emailToSend && !emailToSend.includes("@")) {
      emailToSend = `${emailToSend.toLowerCase()}@smtp-checker.local`;
    }

    try {
      await signInWithCredentials({
        email: emailToSend,
        password,
        callbackUrl,
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
        CredentialsSignin: "Incorrect username or password. Try again.",
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

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(40deg, #F9F6ED 0%, #F0F0F8 50%, #E7E9FB 100%)",
      }}
    >
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-200"
      >
        <h1 className="mb-2 text-center text-3xl font-bold text-gray-800">
          Sign In
        </h1>
        <p className="mb-8 text-center text-sm text-slate-500">
          cashmike SMTP checker
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <input
                required
                name="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin or alonsy-y"
                disabled={lockedUser}
                className="w-full bg-transparent text-lg outline-none disabled:text-slate-500"
              />
            </div>
            {lockedUser ? (
              <p className="text-xs text-slate-500">
                Pick a different user from the home screen to switch.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
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
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>

          <p className="text-center text-sm text-gray-600">
            <a href="/" className="text-blue-600 hover:text-blue-700">
              Back to home
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}

export default MainComponent;
