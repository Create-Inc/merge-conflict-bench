import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const expoWebSuccessSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/auth/expo-web-success/route.js",
  ),
  "utf8",
);

const tokenRouteSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/auth/token/route.js"),
  "utf8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("expo-web-success/route.js structure", () => {
    it("exports a GET function", () => {
      expect(expoWebSuccessSrc).toMatch(
        /export\s+async\s+function\s+GET\b/,
      );
    });

    it("postMessages AUTH_SUCCESS with jwt and user on success", () => {
      expect(expoWebSuccessSrc).toMatch(/AUTH_SUCCESS/);
      expect(expoWebSuccessSrc).toMatch(/postMessage/);
    });

    it("postMessages AUTH_ERROR when unauthorized", () => {
      expect(expoWebSuccessSrc).toMatch(/AUTH_ERROR/);
      expect(expoWebSuccessSrc).toMatch(/Unauthorized/);
    });

    it("returns HTML content type", () => {
      expect(expoWebSuccessSrc).toMatch(/Content-Type.*text\/html/);
    });
  });

  describe("token/route.js structure", () => {
    it("exports a GET function", () => {
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+GET\b/);
    });

    it("returns Unauthorized error when user is not authenticated", () => {
      expect(tokenRouteSrc).toMatch(/Unauthorized/);
      expect(tokenRouteSrc).toMatch(/401/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (auth() + createMobileJwtFromSessionUser pattern)
// =====================================================================
describe("ours behaviors", () => {
  describe("expo-web-success/route.js - session-based auth", () => {
    it("uses auth() to get session instead of getToken", () => {
      expect(expoWebSuccessSrc).toMatch(/auth\(\)/);
      expect(expoWebSuccessSrc).not.toMatch(/getToken/);
    });

    it("uses createMobileJwtFromSessionUser to generate JWT payload", () => {
      expect(expoWebSuccessSrc).toMatch(/createMobileJwtFromSessionUser/);
    });

    it("uses a reusable htmlResponse helper with cache-control", () => {
      expect(expoWebSuccessSrc).toMatch(/htmlResponse/);
      expect(expoWebSuccessSrc).toMatch(/no-store/);
      expect(expoWebSuccessSrc).toMatch(/Cache-Control/);
    });

    it("returns 401 status for unauthorized requests", () => {
      expect(expoWebSuccessSrc).toMatch(/401/);
    });

    it("exports a POST handler that delegates to GET", () => {
      expect(expoWebSuccessSrc).toMatch(
        /export\s+async\s+function\s+POST\b/,
      );
      expect(expoWebSuccessSrc).toMatch(/return\s+GET\(\)/);
    });

    it("has a try/catch with error handling that returns 500", () => {
      expect(expoWebSuccessSrc).toMatch(/catch/);
      expect(expoWebSuccessSrc).toMatch(/500/);
    });
  });

  describe("token/route.js - session-based auth", () => {
    it("uses auth() to get session instead of getToken", () => {
      expect(tokenRouteSrc).toMatch(/auth\(\)/);
      expect(tokenRouteSrc).not.toMatch(/getToken/);
    });

    it("uses createMobileJwtFromSessionUser to generate JWT payload", () => {
      expect(tokenRouteSrc).toMatch(/createMobileJwtFromSessionUser/);
    });

    it("includes Cache-Control no-store headers on responses", () => {
      expect(tokenRouteSrc).toMatch(/no-store/);
      expect(tokenRouteSrc).toMatch(/Cache-Control/);
    });

    it("exports a POST handler that delegates to GET", () => {
      expect(tokenRouteSrc).toMatch(
        /export\s+async\s+function\s+POST\b/,
      );
      expect(tokenRouteSrc).toMatch(/return\s+GET\(\)/);
    });

    it("returns 500 on internal server error", () => {
      expect(tokenRouteSrc).toMatch(/500/);
      expect(tokenRouteSrc).toMatch(/Internal Server Error/);
    });

    it("returns JSON using Response.json", () => {
      expect(tokenRouteSrc).toMatch(/Response\.json/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (structural - message shape)
// =====================================================================
describe("theirs behaviors", () => {
  describe("expo-web-success/route.js - message payload shape", () => {
    it("constructs message object with type, jwt, and user fields", () => {
      expect(expoWebSuccessSrc).toMatch(/type:\s*["']AUTH_SUCCESS["']/);
      expect(expoWebSuccessSrc).toMatch(/jwt:/);
      expect(expoWebSuccessSrc).toMatch(/user:/);
    });

    it("serializes message with JSON.stringify in postMessage script", () => {
      expect(expoWebSuccessSrc).toMatch(/JSON\.stringify\(message\)/);
    });
  });

  describe("token/route.js - JSON response format", () => {
    it("returns a JSON response (not HTML)", () => {
      // token route should return JSON, not HTML
      expect(tokenRouteSrc).toMatch(/Response\.json|application\/json/);
    });
  });
});
