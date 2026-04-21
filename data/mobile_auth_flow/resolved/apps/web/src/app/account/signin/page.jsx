import React, { useEffect, useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";
import useUser from "@/utils/useUser";
import { Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function SignInPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [isEmbeddedWebView, setIsEmbeddedWebView] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);

  const { signInWithCredentials, signInWithGoogle } = useAuth();

  // Keep useUser hooked up so the page can reflect session state in the future.
  // We intentionally do not auto-redirect away from this page.
  useUser();

  const errorMessages = useMemo(
    () => ({
      OAuthSignin:
        "Couldn’t start Google sign-in. Please try again or use email/password.",
      OAuthCallback:
        "Google sign-in failed after redirecting. Please try again.",
      OAuthCreateAccount:
        "Couldn’t create an account with Google sign-in. Try another option.",
      EmailCreateAccount:
        "This email can’t be used to create an account. It may already exist.",
      Callback: "Something went wrong during sign-in. Please try again.",
      OAuthAccountNotLinked:
        "This email is linked to a different sign-in method. Try using that method instead.",
      CredentialsSignin: "Incorrect email/username/phone or password.",
      AccessDenied: "You don’t have permission to sign in.",
      Configuration:
        "Sign-in isn’t working right now (configuration issue). Please try again later.",
      Verification: "Your sign-in link has expired. Please request a new one.",
      Default: "Could not sign in. Please try again.",
    }),
    [],
  );

  const resetPasswordHref = useMemo(() => {
    const looksLikeEmail = identifier && identifier.includes("@");
    if (looksLikeEmail) {
      return `/reset-password?email=${encodeURIComponent(identifier)}`;
    }
    return "/reset-password";
  }, [identifier]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const embedded = Boolean(window.ReactNativeWebView);
    setIsEmbeddedWebView(embedded);

    const params = new URLSearchParams(window.location.search);
    const callback = params.get("callbackUrl");

    let normalizedCallback = "/";
    if (callback) {
      try {
        // Normalize callbackUrl so we don't pass a weird absolute URL through the auth redirect.
        // This is especially important for mobile WebViews.
        const u = new URL(callback, window.location.origin);
        const sameOrigin = u.origin === window.location.origin;
        normalizedCallback = sameOrigin
          ? `${u.pathname}${u.search}${u.hash}`
          : "/";

        // IMPORTANT (Mobile WKWebView):
        // If the callbackUrl points at an API route, force it to a stable page route.
        const isApiToken = u.pathname === "/api/auth/token";
        const isApiMobileCallback = u.pathname === "/api/mobile-auth/callback";

        if (embedded && (isApiToken || isApiMobileCallback)) {
          const next = new URL("/mobile-auth/complete", window.location.origin);
          next.search = u.search || "";
          if (!next.searchParams.get("t")) {
            next.searchParams.set("t", String(Date.now()));
          }
          normalizedCallback = `${next.pathname}${next.search}${next.hash}`;
        }
      } catch (_) {
        normalizedCallback = "/";
      }
    }

    setCallbackUrl(normalizedCallback);

    const prefillEmail = params.get("email");
    if (prefillEmail) {
      setIdentifier(prefillEmail);
    }

    const errorCode = params.get("error");
    if (errorCode) {
      const msg = errorMessages[errorCode] || errorMessages.Default;
      setError(msg);
    }

    if (embedded) {
      setDebugInfo({
        callbackUrlParam: callback || null,
        callbackUrlNormalized: normalizedCallback,
        location: window.location.href,
      });
    }
  }, [errorMessages]);

  const resolveIdentifierMutation = useMutation({
    mutationFn: async (rawIdentifier) => {
      const response = await fetch("/api/account/resolve-identifier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: rawIdentifier }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const msg =
          text ||
          `When fetching /api/account/resolve-identifier, the response was [${response.status}] ${response.statusText}`;
        throw new Error(msg);
      }
      return response.json();
    },
  });

  const mapErrorToMessage = (err) => {
    const raw = err?.message || String(err || "");
    if (!raw) return errorMessages.Default;

    if (errorMessages[raw]) {
      return errorMessages[raw];
    }

    const lower = raw.toLowerCase();
    if (lower.includes("account not found")) {
      return "No account found for that email/phone/username.";
    }

    return "Could not sign in. Please double-check your details and try again.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const looksLikeEmail = identifier.includes("@");
      let resolvedEmail = identifier;

      if (!looksLikeEmail) {
        const resolved = await resolveIdentifierMutation.mutateAsync(identifier);
        resolvedEmail = resolved?.email;
      }

      if (!resolvedEmail) {
        throw new Error("Could not resolve identifier");
      }

      const normalizedEmail = String(resolvedEmail).trim().toLowerCase();

      // IMPORTANT:
      // Always finish auth via the redirect callback pages. Do not attempt an
      // immediate JS token exchange here.
      const result = await signInWithCredentials({
        email: normalizedEmail,
        password,
        callbackUrl,
        redirect: true,
      });

      // If the auth adapter ever returns a result object, surface its error.
      if (isEmbeddedWebView && result?.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError(mapErrorToMessage(err));

      if (isEmbeddedWebView) {
        setDebugInfo((prev) => ({
          ...(prev || {}),
          lastError: err?.message || String(err),
          callbackUrlUsed: callbackUrl,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");

    // Google OAuth is commonly blocked inside embedded webviews (iOS/Android).
    if (isEmbeddedWebView) {
      setError(
        "Google sign-in usually won’t work inside the in-app browser. If your account was created with Google, tap ‘Forgot your password?’ to set a password, then sign in here.",
      );
      return;
    }

    try {
      await signInWithGoogle({ callbackUrl, redirect: true });
    } catch (err) {
      console.error("Google sign in error:", err);
      setError(mapErrorToMessage(err));
    }
  };

  const signupHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("callbackUrl", callbackUrl);
    if (identifier) {
      params.set("email", identifier);
    }
    if (isEmbeddedWebView) {
      params.set("simple", "1");
    }
    return `/account/signup?${params.toString()}`;
  }, [callbackUrl, identifier, isEmbeddedWebView]);

  const embeddedTopPadding = isEmbeddedWebView ? 18 : 0;

  const errorBlock = error ? (
    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-600 dark:text-red-300">
      {error}
    </div>
  ) : null;

  const embeddedTip = isEmbeddedWebView ? (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-800 dark:text-amber-200 text-sm">
      Tip: If you usually sign in with Google, you may need to set a password
      first (Google sign-in can be blocked inside the in-app browser).
      <div className="mt-2">
        <a href={resetPasswordHref} className="underline font-semibold">
          Set / reset password
        </a>
      </div>
    </div>
  ) : null;

  const googleButton = !isEmbeddedWebView ? (
    <button
      type="button"
      onClick={handleGoogle}
      className="w-full mb-4 py-3 rounded-full font-semibold transition-colors duration-200 bg-white/70 dark:bg-white/80 text-black hover:bg-white"
    >
      Continue with Google
    </button>
  ) : null;

  const debugBlock = debugInfo ? (
    <div className="mt-6 rounded-xl border border-white/30 bg-white/20 dark:bg-white/10 px-4 py-3 text-xs text-gray-800 dark:text-gray-200">
      <div className="font-semibold">Mobile sign-in debug</div>
      <div className="mt-2 whitespace-pre-wrap break-words">
        Callback used: {debugInfo.callbackUrlUsed || callbackUrl}
      </div>
      {debugInfo.lastError ? (
        <div className="mt-2 whitespace-pre-wrap break-words text-red-700 dark:text-red-300">
          Last error: {debugInfo.lastError}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#121212] flex items-center justify-center relative">
      <img
        src="https://ucarecdn.com/60d4ef4e-285b-418b-bfb4-e8336e2203fa/-/format/auto/"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover opacity-70 dark:opacity-60"
      />

      <div
        className="relative z-10 w-full max-w-md p-6 sm:p-8"
        style={{ paddingTop: embeddedTopPadding }}
      >
        <div className="rounded-3xl p-6 sm:p-8 border shadow-xl bg-white/20 dark:bg-white/10 backdrop-blur-2xl border-white/30 dark:border-white/10">
          <div className="flex items-center justify-center mb-8">
            <img
              src="https://ucarecdn.com/a671b841-f2c9-44d6-9bc4-3b8368ef4d2a/-/format/auto/"
              alt="SilqueCRM"
              className="w-10 h-10 mr-3 rounded"
            />
            <span className="text-2xl font-bold text-black dark:text-white">
              SilqueCRM
            </span>
          </div>

          <h1 className="text-3xl font-bold text-center text-black dark:text-white mb-2">
            Welcome back
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-center mb-4">
            Sign in to your account
          </p>

          <div className="text-center mb-6">
            <a
              href={signupHref}
              className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-white/60 dark:bg-white/20 text-black dark:text-white hover:bg-white/80 dark:hover:bg-white/30"
            >
              New here? Create an account
            </a>
          </div>

          {errorBlock}
          {embeddedTip}
          {googleButton}

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-white/40" />
            <div className="text-xs text-gray-700 dark:text-gray-300">or</div>
            <div className="h-px flex-1 bg-white/40" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Email, phone, or username
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{ WebkitTextFillColor: "currentColor", color: "inherit" }}
                className="w-full px-4 py-3 rounded-lg border bg-white/30 dark:bg-white/5 backdrop-blur-md border-white/40 dark:border-white/10 placeholder-gray-600 dark:placeholder-gray-400 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/20"
                placeholder="Email, phone, or username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ WebkitTextFillColor: "currentColor", color: "inherit" }}
                  className="w-full pr-10 px-4 py-3 rounded-lg border bg-white/30 dark:bg-white/5 backdrop-blur-md border-white/40 dark:border-white/10 placeholder-gray-600 dark:placeholder-gray-400 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-white/40 dark:focus:ring-white/20"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="text-right mt-2">
                <a
                  href={resetPasswordHref}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || resolveIdentifierMutation.isPending}
              className="w-full py-3 rounded-full font-semibold transition-colors duration-200 disabled:opacity-50 bg-black/80 dark:bg-white/80 text-white dark:text-black hover:bg-black/90 dark:hover:bg-white"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {debugBlock}

          <div className="mt-6 text-center">
            <span className="text-gray-700 dark:text-gray-300">
              Don't have an account?{" "}
            </span>
            <a
              href={signupHref}
              className="text-black dark:text-white font-semibold hover:underline"
            >
              Sign up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
