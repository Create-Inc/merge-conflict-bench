import React, { useEffect, useMemo, useState } from "react";

export default function MobileAuthCompletePage() {
  // Stable helper route for native mobile WebViews.
  // IMPORTANT: We finish auth by navigating the WebView to /api/auth/token (GET).
  // /api/auth/token returns HTML that posts AUTH_SUCCESS back to the WebView.

  const startedAt = useMemo(() => Date.now(), []);
  const [redirectError, setRedirectError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only auto-redirect inside the mobile app WebView.
    const isEmbedded = Boolean(window.ReactNativeWebView);
    if (!isEmbedded) return;

    try {
      const params = new URLSearchParams(window.location.search);
      // Force a fresh token attempt (avoid caching).
      params.set("t", String(Date.now()));
      // Start without attempt; /api/auth/token handles its own retry loop.
      params.delete("attempt");

      const next = `/api/auth/token?${params.toString()}`;
      window.location.replace(next);
    } catch (err) {
      console.error("Mobile auth complete redirect error", err);
      setRedirectError("Could not continue sign-in. Please tap Try again.");
    }
  }, []);

  const safeStarted = useMemo(() => {
    try {
      return new Date(startedAt).toLocaleString();
    } catch (_) {
      return String(startedAt);
    }
  }, [startedAt]);

  const retryHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("t", String(Date.now()));
    return `/mobile-auth/complete?${qs.toString()}`;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-gray-900">
          Finishing sign-in…
        </div>
        <div className="mt-2 text-sm text-gray-600">
          If this doesn’t finish in a few seconds, tap Try again.
        </div>
        <div className="mt-4 text-xs text-gray-400">Started: {safeStarted}</div>

        {redirectError ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {redirectError}
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <a
            href={retryHref}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </a>
          <a
            href="/account/signin"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
