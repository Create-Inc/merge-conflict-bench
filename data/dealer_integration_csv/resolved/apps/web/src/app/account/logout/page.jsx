"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "@/utils/useAuth";

function safePath(raw) {
  const v = String(raw || "").trim();
  if (!v || v === "null" || v === "undefined") return null;
  return v.startsWith("/") ? v : null;
}

export default function LogoutPage() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { auto, finalUrl } = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        auto: false,
        finalUrl: "/",
      };
    }

    const params = new URLSearchParams(window.location.search || "");
    const autoParam = params.get("auto") === "1";
    const rawFinal = safePath(params.get("final"));

    return {
      auto: autoParam,
      finalUrl: rawFinal || "/",
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    // IMPORTANT:
    // We have seen 405s on some /api/* signout endpoints on production.
    // Our /logout route is NOT under /api, so we prefer it.
    if (loading) return;
    if (typeof window === "undefined") return;

    setLoading(true);
    setError(null);

    const finalSafe = finalUrl || "/";

    // 1) Best path: navigate through /logout (server clears cookies + bounces www/apex)
    try {
      const target = `/logout?final=${encodeURIComponent(finalSafe)}&bounce=1&t=${Date.now()}`;
      window.location.href = target;
      return;
    } catch (e) {
      // fall through
      console.error("Logout navigation failed", e);
    }

    // 2) Fallback: auth library signOut
    try {
      await signOut({
        callbackUrl: finalSafe,
        redirect: true,
      });

      // If redirect=false ever happens, fall back:
      window.location.href = `${finalSafe}?t=${Date.now()}`;
    } catch (e) {
      console.error("Sign out failed", e);
      setError(e?.message || "Could not sign out. Please try again.");
      setLoading(false);
    }
  }, [finalUrl, loading, signOut]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!auto) return;
    handleSignOut();
  }, [auto, handleSignOut]);

  const title = loading || auto ? "Signing you out..." : "Sign Out";
  const subtitle =
    loading || auto
      ? "Please wait a moment."
      : "Sign out of your account on this device.";

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-sm text-gray-600">{subtitle}</p>

        {error ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {!auto ? (
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="w-full rounded-lg bg-red-600 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Signing out..." : "Sign out"}
            </button>

            <a
              href="/dashboard"
              className="w-full rounded-lg bg-gray-100 px-4 py-3 text-base font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 inline-block text-center"
            >
              Cancel
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
