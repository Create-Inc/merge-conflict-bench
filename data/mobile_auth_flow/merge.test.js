import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (rel) =>
  readFileSync(join(__dirname, "resolved", rel), "utf-8");

const completePage = read("apps/web/src/app/mobile-auth/complete/page.jsx");
const callbackPage = read("apps/web/src/app/mobile-auth/callback/page.jsx");
const signinPage = read("apps/web/src/app/account/signin/page.jsx");
const webViewHandlers = read(
  "apps/mobile/src/utils/auth/handlers/webViewHandlers.js",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("mobile-auth/complete page", () => {
    it("exports a default function component", () => {
      expect(completePage).toMatch(
        /export\s+default\s+function\s+MobileAuthCompletePage/,
      );
    });

    it("has postToReactNative helper that uses ReactNativeWebView.postMessage", () => {
      expect(completePage).toMatch(/function\s+postToReactNative/);
      expect(completePage).toMatch(/ReactNativeWebView/);
      expect(completePage).toMatch(/postMessage/);
    });

    it("has postToParent helper for iframe communication", () => {
      expect(completePage).toMatch(/function\s+postToParent/);
      expect(completePage).toMatch(/window\.parent/);
    });

    it("uses a hidden iframe with id token-frame for token exchange", () => {
      expect(completePage).toMatch(/id="token-frame"/);
      expect(completePage).toMatch(/iframe/);
      expect(completePage).toMatch(/token-frame/);
    });

    it("loads /api/auth/token as iframe src for token exchange", () => {
      expect(completePage).toMatch(/\/api\/auth\/token/);
    });

    it("manages status and details state for user feedback", () => {
      expect(completePage).toMatch(/useState.*Finishing sign-in/);
      expect(completePage).toMatch(/setStatus/);
      expect(completePage).toMatch(/setDetails/);
    });

    it("has lastError state for displaying errors", () => {
      expect(completePage).toMatch(/lastError/);
      expect(completePage).toMatch(/setLastError/);
    });

    it("records startedAt timestamp with useMemo", () => {
      expect(completePage).toMatch(/startedAt/);
      expect(completePage).toMatch(/Date\.now\(\)/);
    });
  });

  describe("mobile-auth/callback page", () => {
    it("exports a default function component", () => {
      expect(callbackPage).toMatch(
        /export\s+default\s+function\s+MobileAuthCallbackPage/,
      );
    });

    it("has the same postToReactNative helper", () => {
      expect(callbackPage).toMatch(/function\s+postToReactNative/);
      expect(callbackPage).toMatch(/ReactNativeWebView/);
    });

    it("has the same hidden iframe token-frame pattern", () => {
      expect(callbackPage).toMatch(/id="token-frame"/);
    });

    it("manages status and details state", () => {
      expect(callbackPage).toMatch(/setStatus/);
      expect(callbackPage).toMatch(/setDetails/);
    });
  });

  describe("signin page", () => {
    it("detects embedded WebView via window.ReactNativeWebView", () => {
      expect(signinPage).toMatch(/ReactNativeWebView/);
      expect(signinPage).toMatch(/isEmbeddedWebView|isEmbedded/);
    });

    it("resolves identifier via /api/account/resolve-identifier", () => {
      expect(signinPage).toMatch(/\/api\/account\/resolve-identifier/);
    });

    it("uses signInWithCredentials from useAuth", () => {
      expect(signinPage).toMatch(/signInWithCredentials/);
      expect(signinPage).toMatch(/useAuth/);
    });

    it("has Google sign-in handler", () => {
      expect(signinPage).toMatch(/signInWithGoogle/);
      expect(signinPage).toMatch(/Google/);
    });

    it("warns about Google sign-in not working in embedded webview", () => {
      expect(signinPage).toMatch(
        /Google sign-in usually won.t work inside/i,
      );
    });

    it("has password visibility toggle with Eye/EyeOff", () => {
      expect(signinPage).toMatch(/showPassword/);
      expect(signinPage).toMatch(/Eye/);
      expect(signinPage).toMatch(/EyeOff/);
    });

    it("has forgot password link", () => {
      expect(signinPage).toMatch(/reset-password|resetPasswordHref/);
    });

    it("has signup link", () => {
      expect(signinPage).toMatch(/signupHref/);
      expect(signinPage).toMatch(/\/account\/signup/);
    });

    it("manages error state with errorMessages map", () => {
      expect(signinPage).toMatch(/errorMessages/);
      expect(signinPage).toMatch(/OAuthSignin/);
      expect(signinPage).toMatch(/CredentialsSignin/);
    });

    it("has debug info block for embedded webview", () => {
      expect(signinPage).toMatch(/debugInfo/);
      expect(signinPage).toMatch(/debugBlock/);
    });
  });

  describe("webViewHandlers", () => {
    it("exports createWebViewHandlers function", () => {
      expect(webViewHandlers).toMatch(/export\s+function\s+createWebViewHandlers/);
    });

    it("returns onNavigationStateChange, onLoadEnd, onError, onHttpError, onMessage, onShouldStartLoadWithRequest", () => {
      expect(webViewHandlers).toMatch(/onNavigationStateChange/);
      expect(webViewHandlers).toMatch(/onLoadEnd/);
      expect(webViewHandlers).toMatch(/onError/);
      expect(webViewHandlers).toMatch(/onHttpError/);
      expect(webViewHandlers).toMatch(/onMessage/);
      expect(webViewHandlers).toMatch(/onShouldStartLoadWithRequest/);
    });

    it("recognizes final step URLs including /mobile-auth/callback and /api/auth/token", () => {
      expect(webViewHandlers).toMatch(/isFinalStepUrl/);
      expect(webViewHandlers).toMatch(/\/mobile-auth\/callback/);
      expect(webViewHandlers).toMatch(/\/api\/auth\/token/);
    });

    it("recognizes auth page URLs /account/signin and /account/signup", () => {
      expect(webViewHandlers).toMatch(/isAuthPageUrl/);
      expect(webViewHandlers).toMatch(/\/account\/signin/);
      expect(webViewHandlers).toMatch(/\/account\/signup/);
    });

    it("handles AUTH_SUCCESS messages by calling setAuth and close", () => {
      expect(webViewHandlers).toMatch(/AUTH_SUCCESS/);
      expect(webViewHandlers).toMatch(/setAuth/);
      expect(webViewHandlers).toMatch(/close\(\)/);
    });

    it("handles AUTH_ERROR messages", () => {
      expect(webViewHandlers).toMatch(/AUTH_ERROR/);
      expect(webViewHandlers).toMatch(/setAuthError/);
    });

    it("handles AUTH_WEBVIEW_NULL messages for blank page recovery", () => {
      expect(webViewHandlers).toMatch(/AUTH_WEBVIEW_NULL/);
    });

    it("uses a final step watchdog timer", () => {
      expect(webViewHandlers).toMatch(/startFinalWatchdog/);
      expect(webViewHandlers).toMatch(/clearFinalWatchdog/);
    });

    it("supports origin failover for proxy/uuid hosts", () => {
      expect(webViewHandlers).toMatch(/failoverOrigin/);
      expect(webViewHandlers).toMatch(/usingProxyOrigin/);
    });

    it("has isMainFrameRequest helper for subresource filtering", () => {
      expect(webViewHandlers).toMatch(/isMainFrameRequest/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (comment/documentation improvements, IMPORTANT notes)
// =====================================================================
describe("ours behaviors", () => {
  describe("webViewHandlers has important comment about NOT doing native token exchange", () => {
    it("has IMPORTANT comment about not doing native RN fetch token exchange", () => {
      expect(webViewHandlers).toMatch(
        /Do NOT do a native.*React Native fetch.*token exchange/is,
      );
    });

    it("comments mention WKWebView cookie sharing issues", () => {
      expect(webViewHandlers).toMatch(/WKWebView/i);
    });
  });

  describe("complete page avoids JSON POST for token exchange", () => {
    it("has comment about avoiding JSON POST exchanges", () => {
      expect(completePage).toMatch(
        /Avoid.*JSON.*POST|Do NOT.*fetch.*POST/is,
      );
    });
  });

  describe("callback page avoids JSON POST exchanges", () => {
    it("has comment about avoiding JSON POST exchanges", () => {
      expect(callbackPage).toMatch(
        /Avoid.*JSON.*POST.*exchanges/is,
      );
    });
  });

  describe("signin page always finishes auth via redirect callback pages", () => {
    it("has redirect: true in signInWithCredentials call", () => {
      expect(signinPage).toMatch(/redirect:\s*true/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (retry with postWithRetries, /mobile-auth/complete route support, jwt check, origin-only msg filtering)
// =====================================================================
describe("theirs behaviors", () => {
  describe("complete and callback pages use postWithRetries for sticky handshake", () => {
    it("complete page has postWithRetries function", () => {
      expect(completePage).toMatch(/function\s+postWithRetries/);
    });

    it("callback page has postWithRetries function", () => {
      expect(callbackPage).toMatch(/function\s+postWithRetries/);
    });

    it("postWithRetries calls post() multiple times with setTimeout delays", () => {
      // Both pages should have retry logic with multiple setTimeout calls
      expect(completePage).toMatch(/setTimeout\(post,\s*50\)/);
      expect(completePage).toMatch(/setTimeout\(post,\s*250\)/);
      expect(completePage).toMatch(/setTimeout\(post,\s*1000\)/);
    });
  });

  describe("complete and callback pages have retry loop with maxAttempts", () => {
    it("complete page has maxAttempts = 8", () => {
      expect(completePage).toMatch(/maxAttempts\s*=\s*8/);
    });

    it("callback page has maxAttempts = 8", () => {
      expect(callbackPage).toMatch(/maxAttempts\s*=\s*8/);
    });

    it("complete page retries iframe loading with setFrameSrc on AUTH_ERROR", () => {
      expect(completePage).toMatch(/setFrameSrc/);
      expect(completePage).toMatch(/setTimeout\(setFrameSrc/);
    });

    it("callback page retries iframe loading with setFrameSrc on AUTH_ERROR", () => {
      expect(callbackPage).toMatch(/setFrameSrc/);
      expect(callbackPage).toMatch(/setTimeout\(setFrameSrc/);
    });
  });

  describe("complete and callback pages validate message origin", () => {
    it("complete page checks event.origin against window.location.origin", () => {
      expect(completePage).toMatch(
        /event\.origin\s*!==\s*window\.location\.origin/,
      );
    });

    it("callback page checks event.origin against window.location.origin", () => {
      expect(callbackPage).toMatch(
        /event\.origin\s*!==\s*window\.location\.origin/,
      );
    });
  });

  describe("complete and callback pages accept both string and object messages", () => {
    it("complete page parses string messages with JSON.parse", () => {
      expect(completePage).toMatch(/JSON\.parse\(data\)/);
    });

    it("callback page handles both stringified JSON and raw objects", () => {
      expect(callbackPage).toMatch(/typeof data === "string"/);
      expect(callbackPage).toMatch(/typeof data === "object"/);
    });
  });

  describe("webViewHandlers recognizes /mobile-auth/complete as final step URL", () => {
    it("includes /mobile-auth/complete in isFinalStepUrl check", () => {
      expect(webViewHandlers).toMatch(
        /\/mobile-auth\/complete/,
      );
    });
  });

  describe("webViewHandlers validates JWT presence on AUTH_SUCCESS", () => {
    it("checks for data.jwt before calling setAuth", () => {
      expect(webViewHandlers).toMatch(/!data\?\.jwt/);
    });

    it("sets auth error when no token is returned", () => {
      expect(webViewHandlers).toMatch(
        /Sign-in succeeded but no token was returned/,
      );
    });
  });

  describe("signin page normalizes API callback URLs to page routes for embedded WebViews", () => {
    it("redirects /api/auth/token to /mobile-auth/complete in embedded mode", () => {
      expect(signinPage).toMatch(/\/api\/auth\/token/);
      expect(signinPage).toMatch(/\/mobile-auth\/complete/);
    });

    it("redirects /api/mobile-auth/callback similarly", () => {
      expect(signinPage).toMatch(/\/api\/mobile-auth\/callback/);
    });
  });

  describe("webViewHandlers has null recovery with retry for final step pages", () => {
    it("retries final step on AUTH_WEBVIEW_NULL via retryFinalStep", () => {
      expect(webViewHandlers).toMatch(/retryFinalStep/);
    });

    it("never auto-restarts on credential entry pages", () => {
      expect(webViewHandlers).toMatch(
        /NEVER auto-restart on credential entry pages/i,
      );
    });
  });
});
