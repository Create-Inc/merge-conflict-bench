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
  webViewHeaders,
}) {
  // Helper: only fail over between origins when we're on a proxy/uuid host.
  // On a normal stable host, switching origins breaks cookies and can cause infinite loops.
  const authHost0 = authOrigin ? hostFor(authOrigin) : null;
  const usingProxyOrigin = Boolean(authHost0 && isUuidHost(authHost0));

  // IMPORTANT (2026-01):
  // Avoid native fetch-based token exchange on iOS because it can fail to share
  // WKWebView cookies reliably.
  //
  // The supported flow is:
  //   /api/auth/token (GET) -> returns HTML and postMessages AUTH_SUCCESS back to the WebView.
  //
  // We keep a native exchange as a last-resort fallback only.

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Kept as a last-resort fallback; normally unused.
  const exchangeTokenNative = async (reasonUrl) => {
    try {
      if (!authOrigin) {
        setAuthError("Sign-in could not finish (missing auth host).");
        setIsExchangingToken(false);
        return;
      }

      const prev = nullRecoveryRef.current || {};
      if (prev.nativeExchangeInFlight) {
        return;
      }

      nullRecoveryRef.current = {
        ...prev,
        nativeExchangeInFlight: true,
        nativeExchangeAttempts: 0,
      };

      setIsExchangingToken(true);
      setAuthError(null);

      const maxAttempts = 4;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        nullRecoveryRef.current = {
          ...(nullRecoveryRef.current || {}),
          nativeExchangeAttempts: attempt,
        };

        let response;
        try {
          response = await fetch(`${authOrigin}/api/auth/token`, {
            method: "POST",
            headers: {
              ...webViewHeaders,
              "Content-Type": "application/json",
            },
          });
        } catch (err) {
          console.error("🔐 Native token exchange network error", err);
          if (attempt < maxAttempts) {
            await sleep(650);
            continue;
          }
          throw err;
        }

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          if (response.status === 401 && attempt < maxAttempts) {
            await sleep(650);
            continue;
          }

          const msg =
            `Token exchange failed: [${response.status}] ${response.statusText || ""}${text ? ` ${text}` : ""}`.trim();
          throw new Error(msg);
        }

        // Prefer header-based JWT.
        const headerJwt =
          response.headers.get("x-auth-jwt") ||
          response.headers.get("X-Auth-JWT");

        if (headerJwt) {
          clearFinalWatchdog();
          setNullPageUrl(null);

          // setAuth here is the zustand store setter.
          setAuth({ jwt: headerJwt, user: null });

          setIsExchangingToken(false);
          nullRecoveryRef.current = {
            ...(nullRecoveryRef.current || {}),
            nativeExchangeInFlight: false,
            receivedSuccess: true,
          };
          close();
          return;
        }

        let json = null;
        try {
          json = await response.json();
        } catch (_) {
          json = null;
        }

        const jwt = json?.jwt || null;
        const user = json?.user || null;

        if (jwt) {
          clearFinalWatchdog();
          setNullPageUrl(null);

          setAuth({ jwt, user });
          setIsExchangingToken(false);
          nullRecoveryRef.current = {
            ...(nullRecoveryRef.current || {}),
            nativeExchangeInFlight: false,
            receivedSuccess: true,
          };
          close();
          return;
        }

        if (attempt < maxAttempts) {
          await sleep(650);
          continue;
        }

        const msg = `Token exchange succeeded but no jwt returned. reason=${String(
          getPathname(reasonUrl) || reasonUrl || "(unknown)",
        )}`;
        throw new Error(msg);
      }
    } catch (err) {
      console.error("🔐 Native token exchange failed", err);

      nullRecoveryRef.current = {
        ...(nullRecoveryRef.current || {}),
        nativeExchangeInFlight: false,
      };

      setIsExchangingToken(false);
      setNullPageUrl(reasonUrl || lastNavUrl || "(unknown)");
      setAuthError(err?.message || "Token exchange failed.");
    }
  };

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
    return (
      p === "/mobile-auth/callback" ||
      p === "/mobile-auth/complete" ||
      p === "/api/auth/token" ||
      p === "/api/mobile-auth/callback"
    );
  };

  const isAuthPageUrl = (rawUrl) => {
    const p = String(getPathname(rawUrl) || "").toLowerCase();
    return p === "/account/signin" || p === "/account/signup";
  };

  const isOnPageHelper = (rawUrl) => {
    const p = String(getPathname(rawUrl) || "").toLowerCase();
    return p === "/mobile-auth/callback" || p === "/mobile-auth/complete";
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

    const watchdogMs = 35000;

    nullRecoveryRef.current.finalStepTimer = setTimeout(() => {
      try {
        const state = nullRecoveryRef.current || {};
        if (state.receivedSuccess) return;

        const retryUrl = state.finalStepUrl || url || lastNavUrl || "";

        // If we're sitting on a page helper, let that page keep working.
        // Only force retries when we've landed on an API endpoint.
        const path = String(getPathname(retryUrl) || "").toLowerCase();
        const isApi = path.startsWith("/api/");

        if (isApi) {
          const didRetry = retryFinalStep(retryUrl);
          if (!didRetry) {
            restart("final_step_watchdog");
          }
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

      nullRecoveryRef.current = {
        ...(nullRecoveryRef.current || {}),
        nativeExchangeInFlight: false,
      };
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
      // We expect /api/auth/token (GET) to postMessage AUTH_SUCCESS.
      // Do not start native exchange here.
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

        if (isFinalStepUrl(urlFromMsg) && Platform.OS !== "web") {
          setNullPageUrl(urlFromMsg);
          setIsExchangingToken(true);
          const didRetryFinal = retryFinalStep(urlFromMsg);
          if (didRetryFinal) return;
          setIsExchangingToken(false);
          return;
        }

        if (isAuthPageUrl(urlFromMsg)) {
          setNullPageUrl(urlFromMsg);
          setIsExchangingToken(false);
          return;
        }

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

      if (data?.type === "AUTH_SUCCESS") {
        clearFinalWatchdog();

        if (!data?.jwt) {
          // Fallback: extremely rare, but keep a last-resort native exchange.
          exchangeTokenNative(lastNavUrl || "");
          return;
        }

        nullRecoveryRef.current = {
          ...(nullRecoveryRef.current || {}),
          lastUrl: null,
          retryCount: 0,
          receivedSuccess: true,
          noSessionRetryCount: 0,
          nativeExchangeInFlight: false,
        };

        setAuth({ jwt: data.jwt, user: data.user || null });
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

    if (!isMainFrameRequest(request)) {
      return true;
    }

    if (url) {
      console.log("🔐 Auth WebView shouldStart:", method, url);
    }

    if (method !== "GET") {
      return true;
    }

    // Use the actual main document URL when available (currentURI state can be stale).
    const currentDocUrl = request?.mainDocumentURL || currentURI || "";

    const isFinalStep = Platform.OS !== "web" && url && isFinalStepUrl(url);
    if (isFinalStep) {
      const p = String(getPathname(url) || "").toLowerCase();

      // IMPORTANT: /api/auth/token is our intended mobile callback target.
      if (p === "/api/auth/token") {
        setIsExchangingToken(true);
        return true;
      }

      const isPageHelper =
        p === "/mobile-auth/callback" || p === "/mobile-auth/complete";

      if (isPageHelper) {
        setIsExchangingToken(true);
        return true;
      }

      // Allow /api/auth/token navigation if we are coming from the helper page.
      const currentIsHelper = isOnPageHelper(currentDocUrl);
      const isApiToken = p === "/api/auth/token";
      if (currentIsHelper && isApiToken) {
        setIsExchangingToken(true);
        return true;
      }

      // If we land on API helpers as top-level documents, rewrite to a stable page helper.
      if (authOriginParam) {
        const next = `${authOriginParam}/mobile-auth/callback?t=${Date.now()}`;
        setURI(next);
        setIsExchangingToken(true);
        return false;
      }

      return true;
    }

    const authHost0b = authOriginParam ? hostFor(authOriginParam) : null;
    const usingProxyOriginForRequest = Boolean(
      authHost0b && isUuidHost(authHost0b),
    );

    if (!usingProxyOriginForRequest) {
      return true;
    }

    const lower = String(url || "").toLowerCase();
    const isAuthPage =
      lower.includes("/account/signin") || lower.includes("/account/signup");

    if (isAuthPage) {
      const currentLower = String(currentDocUrl || "").toLowerCase();
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

    const matchingIndex = originCandidates.findIndex((o) => o && url.startsWith(o));

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
