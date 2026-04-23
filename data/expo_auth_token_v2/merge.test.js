import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const expoWebSuccessSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/auth/expo-web-success/route.js"),
  "utf-8"
);
const tokenRouteSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/auth/token/route.js"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("expo-web-success: HTML postMessage pattern", () => {
    it("defines htmlWithPostMessage function", () => {
      expect(expoWebSuccessSrc).toMatch(/function\s+htmlWithPostMessage/);
    });

    it("posts to ReactNativeWebView.postMessage", () => {
      expect(expoWebSuccessSrc).toMatch(/ReactNativeWebView\.postMessage/);
    });

    it("posts to window.parent.postMessage", () => {
      expect(expoWebSuccessSrc).toMatch(/window\.parent\.postMessage/);
    });

    it("retries posting with setTimeout delays (50, 250, 1000ms)", () => {
      expect(expoWebSuccessSrc).toMatch(/setTimeout\(post,\s*50\)/);
      expect(expoWebSuccessSrc).toMatch(/setTimeout\(post,\s*250\)/);
      expect(expoWebSuccessSrc).toMatch(/setTimeout\(post,\s*1000\)/);
    });
  });

  describe("expo-web-success: GET handler", () => {
    it("exports GET async function", () => {
      expect(expoWebSuccessSrc).toMatch(/export\s+async\s+function\s+GET/);
    });

    it("calls getToken with raw:true for the token string", () => {
      expect(expoWebSuccessSrc).toMatch(/raw:\s*true/);
    });

    it("calls getToken without raw for decoded JWT", () => {
      // Two getToken calls: one with raw:true and one without
      const matches = expoWebSuccessSrc.match(/getToken\(/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it("returns AUTH_ERROR with Unauthorized when jwt is null", () => {
      expect(expoWebSuccessSrc).toMatch(/AUTH_ERROR/);
      expect(expoWebSuccessSrc).toMatch(/Unauthorized/);
    });

    it("returns AUTH_ERROR with TokenExchangeFailed when token is null", () => {
      expect(expoWebSuccessSrc).toMatch(/TokenExchangeFailed/);
    });

    it("returns AUTH_SUCCESS with jwt and user on success", () => {
      expect(expoWebSuccessSrc).toMatch(/AUTH_SUCCESS/);
      expect(expoWebSuccessSrc).toMatch(/jwt:\s*token/);
    });

    it("includes user object with id, email, name", () => {
      expect(expoWebSuccessSrc).toMatch(/jwt\.sub/);
      expect(expoWebSuccessSrc).toMatch(/jwt\.email/);
      expect(expoWebSuccessSrc).toMatch(/jwt\.name/);
    });
  });

  describe("expo-web-success: error handling", () => {
    it("catches errors and returns AUTH_ERROR with InternalError", () => {
      expect(expoWebSuccessSrc).toMatch(/InternalError/);
    });

    it("logs errors to console.error", () => {
      expect(expoWebSuccessSrc).toMatch(/console\.error/);
    });
  });

  describe("token route: GET handler (HTML for WebView)", () => {
    it("exports GET async function", () => {
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+GET/);
    });

    it("returns HTML responses for GET (WebView compatibility)", () => {
      expect(tokenRouteSrc).toMatch(/htmlWithPostMessage/);
    });

    it("returns AUTH_ERROR for missing jwt", () => {
      expect(tokenRouteSrc).toMatch(/AUTH_ERROR/);
    });

    it("returns AUTH_SUCCESS with jwt and user data", () => {
      expect(tokenRouteSrc).toMatch(/AUTH_SUCCESS/);
    });
  });

  describe("token route: imports and utilities", () => {
    it("imports getToken from @auth/core/jwt", () => {
      expect(tokenRouteSrc).toMatch(/import.*getToken.*from\s*["']@auth\/core\/jwt["']/);
    });

    it("defines safeRequestUrl for URL parsing", () => {
      expect(tokenRouteSrc).toMatch(/function\s+safeRequestUrl/);
    });

    it("defines isSecureRequest for cookie naming", () => {
      expect(tokenRouteSrc).toMatch(/function\s+isSecureRequest/);
    });
  });

  describe("shared: Cache-Control no-store", () => {
    it("expo-web-success sets Cache-Control: no-store", () => {
      expect(expoWebSuccessSrc).toMatch(/Cache-Control.*no-store/);
    });

    it("token route sets Cache-Control: no-store", () => {
      expect(tokenRouteSrc).toMatch(/Cache-Control.*no-store/);
    });
  });

  describe("shared: secure cookie detection", () => {
    it("expo-web-success detects secure from protocol", () => {
      expect(expoWebSuccessSrc).toMatch(/https:/);
    });

    it("token route detects secure from protocol", () => {
      expect(tokenRouteSrc).toMatch(/https:/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("token route: separate GET and POST handlers", () => {
    it("exports both GET and POST functions", () => {
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+GET/);
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+POST/);
    });
  });

  describe("expo-web-success: safe URL parsing with fallback", () => {
    it("falls back to AUTH_URL env var for URL parsing", () => {
      expect(expoWebSuccessSrc).toMatch(/AUTH_URL/);
    });

    it("falls back to APP_URL env var for URL parsing", () => {
      expect(expoWebSuccessSrc).toMatch(/APP_URL/);
    });
  });

  describe("token route: HTML headers vs JSON headers separation", () => {
    it("defines separate HTML and JSON header objects", () => {
      expect(tokenRouteSrc).toMatch(/htmlHeaders|Content-Type.*text\/html/);
      expect(tokenRouteSrc).toMatch(/jsonHeaders|Content-Type.*application\/json/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("token route: POST returns JSON", () => {
    it("POST handler returns JSON.stringify responses", () => {
      expect(tokenRouteSrc).toMatch(/JSON\.stringify/);
    });

    it("POST error returns JSON with error field", () => {
      expect(tokenRouteSrc).toMatch(/JSON\.stringify\(\s*\{\s*error/);
    });
  });

  describe("token route: GET returns HTML for WKWebView", () => {
    it("GET uses htmlWithPostMessage for all responses", () => {
      // GET handler should always return HTML
      const getSection = tokenRouteSrc.match(
        /export\s+async\s+function\s+GET[\s\S]*?(?=export\s+async\s+function|$)/
      );
      expect(getSection).not.toBeNull();
      expect(getSection[0]).toMatch(/htmlWithPostMessage/);
    });
  });

  describe("expo-web-success: Content-Type header", () => {
    it("includes Content-Type text/html header", () => {
      expect(expoWebSuccessSrc).toMatch(/Content-Type.*text\/html/);
    });
  });

  describe("no conflict markers", () => {
    it("expo-web-success has no conflict markers", () => {
      expect(expoWebSuccessSrc).not.toMatch(/<<<<<<</);
      expect(expoWebSuccessSrc).not.toMatch(/>>>>>>>/);
    });

    it("token route has no conflict markers", () => {
      expect(tokenRouteSrc).not.toMatch(/<<<<<<</);
      expect(tokenRouteSrc).not.toMatch(/>>>>>>>/);
    });
  });
});
