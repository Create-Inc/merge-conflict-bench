import React, { useEffect, useMemo, useState } from "react";

function postToReactNative(message) {
  try {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify(message));
    }
  } catch (_) {
    // ignore
  }
}

function postToParent(message) {
  try {
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage(message, "*");
    }
  } catch (_) {
    // ignore
  }
}

// iOS WebViews sometimes drop a single postMessage during fast redirects.
// Post a few times to make the success handshake "sticky".
function postWithRetries(message) {
  const post = () => {
    postToReactNative(message);
    postToParent(message);
  };

  post();
  setTimeout(post, 50);
  setTimeout(post, 250);
  setTimeout(post, 1000);
}

export default function MobileAuthCallbackPage() {
  // This page exists because some WKWebView builds can be flaky when navigating
  // directly to API routes.
  //
  // IMPORTANT:
  // Avoid JSON POST exchanges here (some environments have returned a literal "null"
  // body for JSON responses even on 200 OK). Instead, load /api/auth/token (HTML)
  // in an iframe and forward its postMessage up to the ReactNativeWebView.

  const startedAt = useMemo(() => Date.now(), []);

  const [status, setStatus] = useState("Finishing sign-in…");
  const [details, setDetails] = useState("Preparing token exchange…");
  const [lastError, setLastError] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let done = false;
    let attempt = 0;
    const maxAttempts = 8;

    const sendError = (detail) => {
      postWithRetries({
        type: "AUTH_ERROR",
        error: "TokenExchangeFailed",
        details: detail,
        final: true,
      });
    };

    const sendSuccess = (payload) => {
      postWithRetries(payload);
    };

    const makeFrameSrc = () => {
      const t = Date.now();
      const u = new URL("/api/auth/token", window.location.origin);
      u.searchParams.set("t", String(t));
      u.searchParams.set("attempt", String(attempt));
      return u.pathname + u.search;
    };

    const setFrameSrc = () => {
      attempt += 1;
      setStatus("Finishing sign-in…");
      setDetails(`Exchanging token… (${attempt}/${maxAttempts})`);

      const frame = document.getElementById("token-frame");
      if (frame && frame.tagName === "IFRAME") {
        frame.setAttribute("src", makeFrameSrc());
      }
    };

    const onWindowMessage = (event) => {
      if (cancelled || done) return;

      // Only accept messages from our own origin (iframe is same-origin).
      try {
        if (event?.origin && event.origin !== window.location.origin) {
          return;
        }
      } catch (_) {
        // ignore
      }

      const data = event?.data;
      if (!data) return;

      // Accept both stringified JSON and raw objects.
      let msg = null;
      if (typeof data === "string") {
        try {
          msg = JSON.parse(data);
        } catch (_) {
          msg = null;
        }
      } else if (typeof data === "object") {
        msg = data;
      }

      if (!msg) return;

      if (msg?.type === "AUTH_SUCCESS") {
        done = true;
        setStatus("Signed in");
        setDetails("Done.");
        setLastError(null);
        sendSuccess(msg);
        return;
      }

      if (msg?.type === "AUTH_ERROR") {
        const detail = msg?.details || msg?.error || "Token exchange failed.";

        setStatus("Could not finish sign-in");
        setDetails(null);
        setLastError(String(detail));

        if (msg?.final) {
          done = true;
          sendError(String(detail));
          return;
        }

        if (attempt < maxAttempts) {
          setTimeout(setFrameSrc, 650);
          return;
        }

        done = true;
        sendError(String(detail));
      }
    };

    window.addEventListener("message", onWindowMessage);

    // Kick off first attempt immediately.
    setFrameSrc();

    // Safety watchdog: if we never receive a message (WebKit sometimes drops it), reload.
    const watchdog = setInterval(() => {
      if (cancelled || done) return;

      if (attempt >= 1 && attempt < maxAttempts) {
        setTimeout(setFrameSrc, 0);
        return;
      }

      if (attempt >= maxAttempts) {
        clearInterval(watchdog);
        const msg2 = `Token exchange failed (watchdog). reason=/mobile-auth/callback attempts=${maxAttempts}`;
        setStatus("Could not finish sign-in");
        setDetails(null);
        setLastError(msg2);
        done = true;
        sendError(msg2);
      }
    }, 9000);

    return () => {
      cancelled = true;
      window.removeEventListener("message", onWindowMessage);
      clearInterval(watchdog);
    };
  }, [startedAt]);

  const safeStarted = useMemo(() => {
    try {
      return new Date(startedAt).toLocaleString();
    } catch (_) {
      return String(startedAt);
    }
  }, [startedAt]);

  const detailsBlock = details ? (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 whitespace-pre-wrap">
      {details}
    </div>
  ) : null;

  const lastErrorBlock = lastError ? (
    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 whitespace-pre-wrap">
      {lastError}
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-lg font-semibold text-gray-900">{status}</div>
        <div className="mt-2 text-sm text-gray-600">
          You can close this page if it doesn’t close automatically.
        </div>

        {detailsBlock}
        {lastErrorBlock}

        <div className="mt-4 text-xs text-gray-400">Started: {safeStarted}</div>

        {/* Hidden iframe used for the final HTML token helper step */}
        <iframe
          id="token-frame"
          title="token-frame"
          style={{ width: 0, height: 0, border: 0, position: "absolute" }}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
