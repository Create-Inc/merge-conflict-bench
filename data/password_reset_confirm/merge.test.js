import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks ──────────────────────────────────────────────────────────────
const sqlMock = vi.fn();
sqlMock.transaction = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("argon2", () => ({
  default: { hash: vi.fn().mockResolvedValue("hashed-pw") },
  hash: vi.fn().mockResolvedValue("hashed-pw"),
}));
vi.mock("@/app/api/utils/send-email", () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
}));

// ── import resolved route handlers ──────────────────────────────────────
const confirmMod = await import(
  "./resolved/apps/web/src/app/api/password-reset/confirm/route.js"
);
const requestMod = await import(
  "./resolved/apps/web/src/app/api/password-reset/request/route.js"
);

const { POST: confirmPOST } = confirmMod;
const { POST: requestPOST } = requestMod;

// Also read the page source for structural tests
import { readFileSync } from "fs";
import { join } from "path";

const forgotPasswordSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/account/forgot-password/page.jsx",
  ),
  "utf8",
);

const resetPasswordSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/account/reset-password/page.jsx",
  ),
  "utf8",
);

// ── helpers ─────────────────────────────────────────────────────────────
function makeRequest(body, url = "http://localhost:3000/api/password-reset") {
  return {
    json: () => Promise.resolve(body),
    url,
  };
}

async function json(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_URL = "http://localhost:3000";
});

// =====================================================================
// BASE BEHAVIORS (shared by both branches)
// =====================================================================
describe("base behaviors", () => {
  describe("confirm/route.js - validation", () => {
    it("returns 400 when token is missing", async () => {
      const res = await confirmPOST(
        makeRequest({ password: "longpassword123" }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/token|required/i);
    });

    it("returns 400 when password is missing", async () => {
      const res = await confirmPOST(makeRequest({ token: "abc123" }));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/password|required/i);
    });

    it("returns 400 when password is too short (< 8 chars)", async () => {
      const res = await confirmPOST(
        makeRequest({ token: "abc123", password: "short" }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/8 characters/i);
    });

    it("returns 400 when token is invalid or expired", async () => {
      sqlMock.mockResolvedValueOnce([]); // token lookup returns nothing

      const res = await confirmPOST(
        makeRequest({ token: "bad-token", password: "validpassword123" }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/invalid|expired/i);
    });

    it("returns 500 on internal error", async () => {
      sqlMock.mockRejectedValue(new Error("DB down"));

      const res = await confirmPOST(
        makeRequest({ token: "abc", password: "validpassword123" }),
      );
      expect(res.status).toBe(500);
    });
  });

  describe("request/route.js - always returns ok to prevent enumeration", () => {
    it("returns ok:true even when email does not exist", async () => {
      sqlMock.mockResolvedValueOnce([]); // no user found

      const res = await requestPOST(
        makeRequest({ email: "unknown@example.com" }),
      );
      const body = await json(res);
      expect(body.ok).toBe(true);
    });

    it("returns ok:true when email is empty", async () => {
      const res = await requestPOST(makeRequest({ email: "" }));
      const body = await json(res);
      expect(body.ok).toBe(true);
    });

    it("returns ok:true even when an error occurs", async () => {
      sqlMock.mockRejectedValue(new Error("DB error"));

      const res = await requestPOST(
        makeRequest({ email: "user@example.com" }),
      );
      const body = await json(res);
      expect(body.ok).toBe(true);
    });
  });

  describe("forgot-password/page.jsx - structure", () => {
    it("exports a default ForgotPasswordPage function", () => {
      expect(forgotPasswordSrc).toMatch(
        /export\s+default\s+function\s+ForgotPasswordPage/,
      );
    });

    it("has use client directive", () => {
      expect(forgotPasswordSrc).toMatch(/["']use client["']/);
    });

    it("renders an email input field", () => {
      expect(forgotPasswordSrc).toMatch(/type="email"/);
    });

    it("uses useMutation for the reset request", () => {
      expect(forgotPasswordSrc).toMatch(/useMutation/);
    });

    it("calls /api/password-reset/request endpoint", () => {
      expect(forgotPasswordSrc).toMatch(/\/api\/password-reset\/request/);
    });

    it("has a link back to sign in", () => {
      expect(forgotPasswordSrc).toMatch(/sign\s*in/i);
      expect(forgotPasswordSrc).toMatch(/\/account\/signin/);
    });
  });

  describe("reset-password/page.jsx - structure", () => {
    it("exports a default ResetPasswordPage function", () => {
      expect(resetPasswordSrc).toMatch(
        /export\s+default\s+function\s+ResetPasswordPage/,
      );
    });

    it("has password and confirm password inputs", () => {
      expect(resetPasswordSrc).toMatch(/type="password"/);
      expect(resetPasswordSrc).toMatch(/[Cc]onfirm/);
    });

    it("validates passwords match", () => {
      expect(resetPasswordSrc).toMatch(/[Pp]asswords do not match/);
    });

    it("validates minimum password length of 8 characters", () => {
      expect(resetPasswordSrc).toMatch(/8 characters/);
    });

    it("reads token from URL search params", () => {
      expect(resetPasswordSrc).toMatch(/token/);
      expect(resetPasswordSrc).toMatch(/searchParams|URLSearchParams/);
    });

    it("calls /api/password-reset/confirm endpoint", () => {
      expect(resetPasswordSrc).toMatch(/\/api\/password-reset\/confirm/);
    });

    it("shows success state after password is updated", () => {
      expect(resetPasswordSrc).toMatch(/[Pp]assword updated/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (normalizeEmail, callbackUrl, link expiry)
// =====================================================================
describe("ours behaviors", () => {
  describe("forgot-password/page.jsx - email normalization", () => {
    it("has a normalizeEmail function that strips mailto: prefix", () => {
      expect(forgotPasswordSrc).toMatch(/normalizeEmail/);
      expect(forgotPasswordSrc).toMatch(/mailto:/i);
    });

    it("normalizeEmail strips http/https prefix", () => {
      expect(forgotPasswordSrc).toMatch(/https\?/);
    });

    it("normalizeEmail lowercases the email", () => {
      expect(forgotPasswordSrc).toMatch(/toLowerCase/);
    });
  });

  describe("request/route.js - normalizes email on server side", () => {
    it("has a normalizeEmail function on the server route", async () => {
      const requestSrc = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/password-reset/request/route.js",
        ),
        "utf8",
      );
      expect(requestSrc).toMatch(/normalizeEmail|safeNormalizeEmail/);
    });
  });

  describe("request/route.js - invalidates previous tokens", () => {
    it("marks previous unused tokens as used before creating a new one", async () => {
      const requestSrc = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/password-reset/request/route.js",
        ),
        "utf8",
      );
      // Should update existing tokens AND insert new token
      expect(requestSrc).toMatch(/UPDATE.*password_reset_tokens.*SET.*used\s*=\s*true/s);
      expect(requestSrc).toMatch(/INSERT.*password_reset_tokens/s);
    });
  });

  describe("confirm/route.js - marks token as used", () => {
    it("marks the token as used after successful reset", async () => {
      const confirmSrc = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/password-reset/confirm/route.js",
        ),
        "utf8",
      );
      expect(confirmSrc).toMatch(/used\s*=\s*true/);
    });
  });

  describe("reset-password/page.jsx - link expiry messaging", () => {
    it("mentions that the link expires after 1 hour", () => {
      expect(resetPasswordSrc).toMatch(/1 hour|expires/i);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (callbackUrl propagation, readTokenFromUrl helper)
// =====================================================================
describe("theirs behaviors", () => {
  describe("forgot-password/page.jsx - callbackUrl propagation", () => {
    it("extracts callbackUrl from query params", () => {
      expect(forgotPasswordSrc).toMatch(/callbackUrl/);
    });

    it("passes callbackUrl to sign-in href", () => {
      expect(forgotPasswordSrc).toMatch(/signInHref/);
      expect(forgotPasswordSrc).toMatch(/callbackUrl/);
    });
  });

  describe("reset-password/page.jsx - readTokenFromUrl helper", () => {
    it("has a readTokenFromUrl helper function", () => {
      expect(resetPasswordSrc).toMatch(/readTokenFromUrl/);
    });

    it("uses callbackUrl to build sign-in redirect", () => {
      expect(resetPasswordSrc).toMatch(/callbackUrl/);
      expect(resetPasswordSrc).toMatch(/signInHref/);
    });
  });

  describe("confirm/route.js - handles update-or-insert for credentials", () => {
    it("handles both UPDATE existing and INSERT new credentials account", async () => {
      const confirmSrc = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/password-reset/confirm/route.js",
        ),
        "utf8",
      );
      expect(confirmSrc).toMatch(/UPDATE.*auth_accounts.*SET.*password/s);
      expect(confirmSrc).toMatch(/INSERT.*auth_accounts/s);
    });
  });
});
