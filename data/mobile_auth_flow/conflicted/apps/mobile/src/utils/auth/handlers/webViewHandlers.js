import { Platform } from "react-native";
import { hostFor, isUuidHost } from "../utils/urlUtils";

export function createWebViewHandlers({
  setLastNavUrl,
  setIsExchangingToken,
  setAuthError,
  setNullPageUrl,
  failoverOrigin,
  retryFinalStep,
  restart,
  setAuth,
  close,
  nullRecoveryRef,
  lastNavUrl,
  webViewRef,
  nullDetectorScript,
  authOrigin,
}) {
  // Helper: only fail over between origins when we're on a proxy/uuid host.
  // On a normal stable host, switching origins breaks cookies and can cause infinite loops.
  const authHost0 = authOrigin ? hostFor(authOrigin) : null;
  const usingProxyOrigin = Boolean(authHost0 && isUuidHost(authHost0));

<<<<<<< ours
  // IMPORTANT (2026-01):
  // Do NOT do a native (React Native fetch) token exchange here.
  // In practice, RN fetch does not reliably share WKWebView cookies, which causes
  // "token exchange succeeded but no jwt" and infinite loops.
  // We instead rely on the WebView final-step pages (/mobile-auth/complete, /mobile-auth/callback)
  // which exchange tokens inside the WebView cookie jar and postMessage AUTH_SUCCESS.

=======

>>>>>>> theirs
  // IMPORTANT: Only use the URL *pathname* for route checks.
  // The sign-in page URL can include "/mobile-auth/callback" inside callbackUrl query params,
  // and naive `url.includes('/mobile-auth/callback')` checks cause false positives + loops.
  const getPathname = (rawUrl) => {
    const u0 = String(rawUrl || "");
    if (!u0) return "";

    try {
      const base = authOrigin || "https://example.com";
      return new URL(u0, base).pathname || "";
    } catch (_) {
      try {
        const withoutHash = u0.split("#")[0] || "";
        const withoutQuery = withoutHash.split("?")[0] || "";
        return withoutQuery.replace(/^https?:\/\/[^/]+/i, "");
      } catch (_) {
        return "";
      }
    }
  };

  const isFinalStepUrl = (rawUrl) => {
    const p = String(getPathname(rawUrl) || "").toLowerCase();

    // Final-step pages are stable page routes.
    // We also treat the API helpers as final-step in case any flow lands on them;
    // in that case we rewrite to the stable page helper.
    return (
      p === "/mobile-auth/callback" ||
<<<<<<< ours
      p === "/api/auth/token" ||
      p === "/api/mobile-auth/callback"
=======
      p === "/mobile-auth/complete" ||
      p === "/api/auth/token" ||
      p === "/api/mobile-auth/callback"
>>>>>>> theirs
    );
  };

  const isAuthPageUrl = (rawUrl) => {
    const p = String(getPathname(rawUrl) || "").toLowerCase();
    return p === "/account/signin" || p === "/account/signup";
  };

  const clearFinalWatchdog = () => {
    try {
      const t = nullRecoveryRef.current?.finalStepTimer;
      if (t) clearTimeout(t);
    } catch (_) {
      // ignore
    }

    nullRecoveryRef.current = {
      ...(nullRecoveryRef.current || {}),
      finalStepTimer: null,
    };
  };

  const startFinalWatchdog = (url) => {
    try {
      const t = nullRecoveryRef.current?.finalStepTimer;
      if (t) clearTimeout(t);
    } catch (_) {
      // ignore
    }

    nullRecoveryRef.current = {
      ...(nullRecoveryRef.current || {}),
      finalStepTimer: null,
      receivedSuccess: false,
      finalStepUrl: url || null,
    };

<<<<<<< ours
    // Give the WebView final-step pages plenty of time; they may run retries.
    const watchdogMs = 35000;
=======
    // The /mobile-auth/* pages embed their own retry behavior; give them time.
    const watchdogMs = 25000;
>>>>>>> theirs

    nullRecoveryRef.current.finalStepTimer = setTimeout(() => {
      try {
        const state = nullRecoveryRef.current || {};
        if (state.receivedSuccess) return;

        const retryUrl = state.finalStepUrl || url || lastNavUrl || "";
        const didRetry = retryFinalStep(retryUrl);
        if (!didRetry) {
          restart("final_step_watchdog");
        }
      } catch (_) {
        restart("final_step_watchdog_error");
      }
    }, watchdogMs);
  };

  const onNavigationStateChange = (navState) => {
    const url = navState?.url || "";
    setLastNavUrl(url);
    console.log("🔐 Auth WebView nav:", url);

    const isFinalStep = Boolean(url && isFinalStepUrl(url));

    if (!isFinalStep) {
      setIsExchangingToken(false);
      clearFinalWatchdog();
    }
  };

  const onLoadEnd = (e) => {
    const url = e?.nativeEvent?.url;
    if (url) {
      setLastNavUrl(url);
      console.log("🔐 Auth WebView loadEnd:", url);
    }

    const isFinal = Platform.OS !== "web" && url && isFinalStepUrl(url);

    if (isFinal) {
      // Show the exchanging banner, but DO NOT do a native POST exchange.
      // The /mobile-auth/* page will handle token exchange and postMessage the JWT.
      setIsExchangingToken(true);
      setAuthError(null);
      startFinalWatchdog(url);
    }

    try {
      webViewRef.current?.injectJavaScript(nullDetectorScript);
    } catch (_) {
      // ignore
    }
  };

  const onError = (e) => {
    console.error("🔐 Auth WebView error:", e?.nativeEvent);
    setAuthError("A network error occurred while loading the sign-in page.");
    setIsExchangingToken(false);
    clearFinalWatchdog();
  };

  const onHttpError = (e) => {
    const status = e?.nativeEvent?.statusCode;
    const url = e?.nativeEvent?.url;
    console.error("🔐 Auth WebView HTTP error:", e?.nativeEvent);

    if (status === 404 && url) {
      const path = String(getPathname(url) || "").toLowerCase();
      const isHelperRoute =
        path === "/mobile-auth/callback" ||
        path === "/mobile-auth/complete" ||
        path === "/api/auth/token" ||
        path === "/api/mobile-auth/callback";

      if (isHelperRoute) {
        const didFailover = failoverOrigin(
          "Sign-in could not finish on this host. Trying an alternate sign-in host…",
        );
        if (didFailover) return;

        setAuthError(
          "Sign-in could not finish (the sign-in host does not support the final callback page).",
        );
        setIsExchangingToken(false);
        clearFinalWatchdog();
        setNullPageUrl(url);
        return;
      }

      const didFailover = failoverOrigin(
        "Sign-in returned a 404 on this host. Trying an alternate sign-in host…",
      );
      if (didFailover) return;
    }

    setAuthError(`Sign-in returned an HTTP error (${status || "unknown"}).`);
    setIsExchangingToken(false);
    clearFinalWatchdog();
    if (url) setNullPageUrl(url);
  };

  const onMessage = (event) => {
    try {
      const raw = event?.nativeEvent?.data;
      if (!raw) return;

      console.log("🔐 Auth WebView message:", raw);

      let data;
      try {
        data = JSON.parse(raw);
      } catch (_) {
        return;
      }

      if (data?.type === "AUTH_WEBVIEW_NULL") {
        clearFinalWatchdog();

        const urlFromMsg = data?.url || lastNavUrl || "(unknown)";
        const pathFromMsg = data?.path || "";
        const labelFromMsg = data?.label || "";

        setAuthError(
          `WebView rendered a blank page (literal null). ${labelFromMsg ? `(${labelFromMsg}) ` : ""}${pathFromMsg ? `Path: ${pathFromMsg}` : ""}`.trim(),
        );

<<<<<<< ours

=======
        // If this happened during the final step, retry the WebView navigation.
        if (isFinalStepUrl(urlFromMsg) && Platform.OS !== "web") {
          setNullPageUrl(urlFromMsg);
          setIsExchangingToken(true);
          const didRetryFinal = retryFinalStep(urlFromMsg);
          if (didRetryFinal) return;
          setIsExchangingToken(false);
          return;
        }

>>>>>>> theirs
        // NEVER auto-restart on credential entry pages; it makes the screen unusable.
        if (isAuthPageUrl(urlFromMsg)) {
          setNullPageUrl(urlFromMsg);
          setIsExchangingToken(false);
          return;
        }

        // If this happened during the final step, retry the final-step helper.
        if (isFinalStepUrl(urlFromMsg)) {
          setNullPageUrl(urlFromMsg);
          const didRetryFinal = retryFinalStep(urlFromMsg);
          if (didRetryFinal) {
            setIsExchangingToken(true);
            return;
          }
        }

        // General recovery
        const prev = nullRecoveryRef.current || {
          lastUrl: null,
          retryCount: 0,
        };
        const sameUrl = prev.lastUrl && prev.lastUrl === urlFromMsg;

        if (!sameUrl) {
          nullRecoveryRef.current = {
            ...prev,
            lastUrl: urlFromMsg,
            retryCount: 1,
          };
          restart("null_page_auto_retry");
          return;
        }

        if (sameUrl && prev.retryCount < 2) {
          nullRecoveryRef.current = {
            ...prev,
            lastUrl: urlFromMsg,
            retryCount: prev.retryCount + 1,
          };

          if (usingProxyOrigin) {
            const didFailover = failoverOrigin(
              "The sign-in flow loaded a blank (null) screen. Trying an alternate sign-in host…",
            );
            if (didFailover) return;
          }

          restart("null_page_auto_retry_2");
          return;
        }

        setNullPageUrl(urlFromMsg);
        setIsExchangingToken(false);
        return;
      }

      if (data?.type === "AUTH_SUCCESS" && data?.jwt) {
        nullRecoveryRef.current = {
          ...(nullRecoveryRef.current || {}),
          lastUrl: null,
          retryCount: 0,
          receivedSuccess: true,
          noSessionRetryCount: 0,
        };
        clearFinalWatchdog();

<<<<<<< ours
        setAuth({ jwt: data.jwt, user: data.user || null });
=======
        if (!data?.jwt) {
          setIsExchangingToken(false);
          setAuthError("Sign-in succeeded but no token was returned.");
          setNullPageUrl(lastNavUrl || "(unknown)");
          return;
        }

        setAuth({ jwt: data.jwt, user: data.user });
>>>>>>> theirs
        setIsExchangingToken(false);
        close();
        return;
      }

      if (data?.type === "AUTH_ERROR") {
        const prev = nullRecoveryRef.current || {};
        const prevNoSessionRetryCount = Number(prev.noSessionRetryCount || 0);

        nullRecoveryRef.current = {
          ...prev,
          lastUrl: null,
          retryCount: 0,
        };

        clearFinalWatchdog();

        const details = data?.details || data?.body || null;
        const msg = details
          ? `${data?.error || "Authentication failed."} (${details})`
          : data?.error || "Authentication failed.";

        if (data?.final) {
          setIsExchangingToken(false);
          setNullPageUrl(lastNavUrl || "(unknown)");
          setAuthError(msg);
          return;
        }

        const lower = String(msg || "").toLowerCase();
        const looksLikeNoSession =
          lower.includes("no session") ||
          lower.includes("unauthorized") ||
          lower.includes("401");

        setIsExchangingToken(false);

        if (looksLikeNoSession) {
          const nextRetryCount = prevNoSessionRetryCount + 1;
          nullRecoveryRef.current = {
            ...(nullRecoveryRef.current || {}),
            noSessionRetryCount: nextRetryCount,
          };

          if (usingProxyOrigin && nextRetryCount === 1) {
            const didFailover = failoverOrigin();
            if (didFailover) return;
          }
        }

        setNullPageUrl(lastNavUrl || "(unknown)");
        setAuthError(msg);
        return;
      }
    } catch (err) {
      console.error("🔐 Auth WebView message handler error:", err);
      setIsExchangingToken(false);
      clearFinalWatchdog();
    }
  };

  const isMainFrameRequest = (request) => {
    if (!request) return true;

    if (typeof request.isTopFrame === "boolean") {
      return request.isTopFrame;
    }

    if (request.mainDocumentURL && request.url) {
      return request.mainDocumentURL === request.url;
    }

    return true;
  };

  const onShouldStartLoadWithRequest = (
    request,
    currentURI,
    authOriginParam,
    originCandidates,
    originIndex,
    setOriginIndex,
    setURI,
  ) => {
    const url = request?.url || "";
    const method = String(request?.method || "GET").toUpperCase();

    // Only apply our navigation/origin rewriting for main-frame navigations.
    if (!isMainFrameRequest(request)) {
      return true;
    }

    if (url) {
      setLastNavUrl(url);
      console.log("🔐 Auth WebView shouldStart:", method, url);
    }

    // We do NOT intercept final-step URLs anymore.
    // Let the WebView load /mobile-auth/complete and let the page postMessage AUTH_SUCCESS.

    if (method !== "GET") {
      return true;
    }

<<<<<<< ours

=======
    const isFinalStep = Platform.OS !== "web" && url && isFinalStepUrl(url);
    if (isFinalStep) {
      const p = String(getPathname(url) || "").toLowerCase();
      const isPageHelper =
        p === "/mobile-auth/callback" || p === "/mobile-auth/complete";

      if (isPageHelper) {
        setIsExchangingToken(true);
        return true;
      }

      // If we land on API helpers as documents, rewrite to the stable page helper.
      if (authOriginParam) {
        const next = `${authOriginParam}/mobile-auth/callback?t=${Date.now()}`;
        setURI(next);
        setIsExchangingToken(true);
        return false;
      }

      return true;
    }

>>>>>>> theirs
    // Only do cross-origin switching when the configured auth origin is a proxy host.
    const authHost0b = authOriginParam ? hostFor(authOriginParam) : null;
    const usingProxyOriginForRequest = Boolean(
      authHost0b && isUuidHost(authHost0b),
    );

    if (!usingProxyOriginForRequest) {
      return true;
    }

    // Avoid bouncing between hosts while on the credential entry screen.
    const lower = String(url || "").toLowerCase();
    const isAuthPage =
      lower.includes("/account/signin") || lower.includes("/account/signup");

    if (isAuthPage) {
      const currentLower = String(currentURI || "").toLowerCase();
      const currentIsAuthPage =
        currentLower.includes("/account/signin") ||
        currentLower.includes("/account/signup");
      if (currentIsAuthPage) {
        return true;
      }
    }

    const isHttp = url.startsWith("http://") || url.startsWith("https://");
    const isAbout = url.startsWith("about:");

    let currentOrigin = "";
    let nextOrigin = "";
    try {
      currentOrigin = currentURI ? new URL(currentURI).origin : "";
      nextOrigin = url ? new URL(url).origin : "";
    } catch (_) {
      // ignore
    }

    const matchingIndex = originCandidates.findIndex(
      (o) => o && url.startsWith(o),
    );

    const isCrossOrigin = Boolean(
      currentOrigin && nextOrigin && currentOrigin !== nextOrigin,
    );

    if (isHttp && !isAbout && matchingIndex !== -1 && isCrossOrigin) {
      if (matchingIndex !== originIndex) {
        setOriginIndex(matchingIndex);
      }
      setURI(url);
      return false;
    }

    return true;
  };

  return {
    onNavigationStateChange,
    onLoadEnd,
    onError,
    onHttpError,
    onMessage,
    onShouldStartLoadWithRequest,
  };
}
