import { useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";
import designSystem from "@/design-system";

export default function SignUpPage() {
  const { signUpWithCredentials } = useAuth();

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
      await signUpWithCredentials({
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
        Configuration: "Sign-up isn’t working right now. Please try again later.",
        Verification: "Your sign-up link has expired. Request a new one.",
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
              01
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
            Create account
          </h1>
          <p className="mt-2 text-sm" style={{ color: ds.colors.gray[700] }}>
            Make an account to save jobs and come back later.
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
              autoComplete="new-password"
              placeholder="Create a password"
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
            {loading ? "Creating…" : "Create account"}
          </button>

          <p className="text-center text-sm" style={{ color: ds.colors.gray[700] }}>
            Already have an account?{" "}
            <a
              href={`/account/signin${callbackSearch}`}
              className="font-semibold underline"
              style={{ color: ds.colors.blue }}
            >
              Sign in
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
