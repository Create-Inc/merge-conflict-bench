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

const confirmRouteSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/password-reset/confirm/route.js",
  ),
  "utf8",
);

const requestRouteSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/password-reset/request/route.js",
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
  describe("confirm/route.js - input validation", () => {
    it("returns 400 when token is missing", async () => {
      const res = await confirmPOST(
        makeRequest({ password: "validpassword123" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is missing", async () => {
      const res = await confirmPOST(makeRequest({ token: "abc" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is under 8 characters", async () => {
      const res = await confirmPOST(
        makeRequest({ token: "abc", password: "short" }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/8 characters/i);
    });

    it("returns 500 on unexpected error", async () => {
      sqlMock.mockRejectedValue(new Error("crash"));
      const res = await confirmPOST(
        makeRequest({ token: "t", password: "longpassword" }),
      );
      expect(res.status).toBe(500);
    });
  });

  describe("request/route.js - prevents account enumeration", () => {
    it("returns ok:true even when the email does not match any user", async () => {
      sqlMock.mockResolvedValueOnce([]); // no user found
      const res = await requestPOST(
        makeRequest({ email: "nouser@example.com" }),
      );
      const body = await json(res);
      expect(body.ok).toBe(true);
    });

    it("returns ok:true even when there is a server error", async () => {
      sqlMock.mockRejectedValue(new Error("DB error"));
      const res = await requestPOST(
        makeRequest({ email: "user@example.com" }),
      );
      const body = await json(res);
      expect(body.ok).toBe(true);
    });
  });

  describe("forgot-password/page.jsx - form elements", () => {
    it("renders an email input", () => {
      expect(forgotPasswordSrc).toMatch(/type="email"/);
    });

    it("uses useMutation for the request", () => {
      expect(forgotPasswordSrc).toMatch(/useMutation/);
    });

    it("calls /api/password-reset/request", () => {
      expect(forgotPasswordSrc).toMatch(/\/api\/password-reset\/request/);
    });

    it("exports a default ForgotPasswordPage component", () => {
      expect(forgotPasswordSrc).toMatch(
        /export\s+default\s+function\s+ForgotPasswordPage/,
      );
    });
  });

  describe("reset-password/page.jsx - form structure", () => {
    it("exports a default ResetPasswordPage component", () => {
      expect(resetPasswordSrc).toMatch(
        /export\s+default\s+function\s+ResetPasswordPage/,
      );
    });

    it("has two password inputs (new + confirm)", () => {
      const passwordInputs = resetPasswordSrc.match(/type="password"/g) || [];
      expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
    });

    it("validates passwords match before submitting", () => {
      expect(resetPasswordSrc).toMatch(/[Pp]asswords do not match/);
    });

    it("shows success message after password update", () => {
      expect(resetPasswordSrc).toMatch(/[Pp]assword updated/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the 'ours' branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("forgot-password/page.jsx - callbackUrl in sign-in link", () => {
    it("preserves callbackUrl when linking back to sign-in", () => {
      expect(forgotPasswordSrc).toMatch(/callbackUrl/);
      expect(forgotPasswordSrc).toMatch(/signInHref/);
    });
  });

  describe("reset-password/page.jsx - reads token from URL", () => {
    it("reads token from URL search params on mount", () => {
      expect(resetPasswordSrc).toMatch(/token/);
      expect(resetPasswordSrc).toMatch(/searchParams|URLSearchParams/);
    });

    it("shows error when token is missing", () => {
      expect(resetPasswordSrc).toMatch(/[Mm]issing reset token/);
    });
  });

  describe("request/route.js - generates reset URL", () => {
    it("builds a reset URL with the token as a query parameter", () => {
      expect(requestRouteSrc).toMatch(
        /\/account\/reset-password\?token=/,
      );
    });

    it("uses crypto.randomBytes to generate the token", () => {
      expect(requestRouteSrc).toMatch(/crypto\.randomBytes/);
    });

    it("sets token expiry to 1 hour", () => {
      expect(requestRouteSrc).toMatch(/1 hour|'1 hour'/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the 'theirs' branch)
// =====================================================================
describe("theirs behaviors", () => {
  describe("confirm/route.js - validates token in DB before updating", () => {
    it("checks token is unused and not expired in database", () => {
      expect(confirmRouteSrc).toMatch(/used\s*=\s*false/);
      expect(confirmRouteSrc).toMatch(/expires_at/);
    });

    it("marks the token as used after successful reset", () => {
      expect(confirmRouteSrc).toMatch(
        /UPDATE.*password_reset_tokens.*SET.*used\s*=\s*true/s,
      );
    });

    it("handles upsert for auth_accounts (update existing OR insert new)", () => {
      expect(confirmRouteSrc).toMatch(/UPDATE.*auth_accounts/s);
      expect(confirmRouteSrc).toMatch(/INSERT.*auth_accounts/s);
    });
  });

  describe("request/route.js - getAppBaseUrl helper", () => {
    it("has a getAppBaseUrl function that falls back to request origin", () => {
      expect(requestRouteSrc).toMatch(/getAppBaseUrl/);
      expect(requestRouteSrc).toMatch(/APP_URL|request\.url/);
    });
  });

  describe("request/route.js - best-effort email send", () => {
    it("wraps sendEmail in try/catch (best-effort, does not fail the request)", () => {
      // There should be a nested try/catch around the email send
      expect(requestRouteSrc).toMatch(/try\s*\{[\s\S]*sendEmail/);
    });
  });

  describe("reset-password/page.jsx - readTokenFromUrl helper", () => {
    it("has a readTokenFromUrl helper that extracts token from URL", () => {
      expect(resetPasswordSrc).toMatch(/readTokenFromUrl/);
    });
  });
});
