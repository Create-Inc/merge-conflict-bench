import { useEffect, useState } from "react";
import useAuth from "@/utils/useAuth";

function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
<<<<<<< ours
  const [lockedUser, setLockedUser] = useState(null);
  const [callbackUrl, setCallbackUrl] = useState("/");
=======
  const [lockedUser, setLockedUser] = useState(false);
>>>>>>> theirs

  const { signInWithCredentials } = useAuth();

<<<<<<< ours
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get("user");
    const cb = params.get("callbackUrl");

    if (cb && cb.trim()) {
      setCallbackUrl(cb);
    }

    if (userParam && userParam.trim()) {
      const u = userParam.trim();
      setLockedUser(u);
      setEmail(u);
    }
  }, []);

  const emailLabel = lockedUser ? "User" : "Email or Username";
  const emailPlaceholder = lockedUser ? "" : "Enter your email or username";

=======
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const presetUser = (params.get("user") || "").trim();

    if (presetUser) {
      // we treat this as a username, not an email
      setEmail(presetUser);
      setLockedUser(true);
    }
  }, []);

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

    // Allow signing in with username for this app.
    // If the user types "admin" or "alonsy-y" we map it to admin@smtp-checker.local / alonsy-y@smtp-checker.local.
    let emailToSend = email.trim();
    if (emailToSend && !emailToSend.includes("@")) {
      // normalize username input (case-insensitive)
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
<<<<<<< ours
        CredentialsSignin: "Incorrect email/username or password. Try again.",
=======
        CredentialsSignin: "Incorrect email or password. Try again.",
>>>>>>> theirs
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
<<<<<<< ours
        <p className="mb-8 text-center text-sm text-slate-500">
          cashmike SMTP checker
        </p>
=======
        <p className="mb-8 text-center text-sm text-slate-600">
          This app has only two users:{" "}
          <span className="font-semibold">Admin</span> and{" "}
          <span className="font-semibold">ALONSY-Y</span>.
        </p>
>>>>>>> theirs

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
<<<<<<< ours
              {emailLabel}
=======
              Username
>>>>>>> theirs
            </label>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white px-4 py-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <input
                required
                name="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
<<<<<<< ours
                placeholder={emailPlaceholder}
                disabled={Boolean(lockedUser)}
                className="w-full bg-transparent text-lg outline-none disabled:text-slate-500"
=======
                placeholder="admin or alonsy-y"
                disabled={lockedUser}
                className="w-full bg-transparent text-lg outline-none disabled:text-slate-500"
>>>>>>> theirs
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
                placeholder="Enter password"
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

<<<<<<< ours
          <div className="text-center">
            <a href="/" className="text-sm text-slate-600 hover:text-slate-800">
              Back
            </a>
          </div>
=======
          <p className="text-center text-sm text-gray-600">
            <a href="/" className="text-blue-600 hover:text-blue-700">
              Back to home
            </a>
          </p>
>>>>>>> theirs
        </div>
      </form>
    </div>
  );
}

export default MainComponent;
