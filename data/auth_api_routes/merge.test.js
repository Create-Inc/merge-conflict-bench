import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Read resolved source files as text
// ---------------------------------------------------------------------------
const resolvedBase = join(__dirname, "resolved", "apps", "web", "src");

const loginSrc = readFileSync(
  join(resolvedBase, "app", "api", "auth", "login", "route.js"),
  "utf8",
);
const signupSrc = readFileSync(
  join(resolvedBase, "app", "api", "auth", "signup", "route.js"),
  "utf8",
);
const otpSrc = readFileSync(
  join(resolvedBase, "app", "api", "auth", "otp", "send", "route.js"),
  "utf8",
);
const layoutSrc = readFileSync(
  join(resolvedBase, "app", "layout.jsx"),
  "utf8",
);

// ---------------------------------------------------------------------------
// Mock dependencies for the OTP route (it has no complex imports)
// ---------------------------------------------------------------------------
const sqlMock = vi.fn();
vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/jwt", () => ({
  signToken: vi.fn(() => "mock-token"),
  generateRefreshToken: vi.fn(() => "mock-refresh-token"),
  hashRefreshToken: vi.fn(async () => "mock-hash"),
}));
vi.mock("@/app/api/utils/rate-limiter", () => ({
  rateLimitMiddleware: vi.fn(() => null),
}));
vi.mock("@/app/api/utils/constants", () => ({
  AUTH: {
    ACCESS_TOKEN_EXPIRY_SECONDS: 3600,
    ACCESS_TOKEN_EXPIRY_MS: 3600000,
    MAX_LOGIN_ATTEMPTS: 5,
    MIN_PASSWORD_LENGTH: 8,
  },
  ERROR_CODES: {},
}));
vi.mock("@/app/api/utils/api-response", () => ({
  created: vi.fn((body) => Response.json(body, { status: 201 })),
  badRequest: vi.fn((msg) => Response.json({ error: msg }, { status: 400 })),
  conflict: vi.fn((msg) => Response.json({ error: msg }, { status: 409 })),
  serverError: vi.fn((err, ctx) =>
    Response.json({ error: "Internal server error" }, { status: 500 }),
  ),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));
vi.mock("argon2", () => ({
  verify: vi.fn(async () => true),
  hash: vi.fn(async (pw) => `hashed-${pw}`),
}));
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "admin-1" } })),
}));
vi.mock("@/app/api/utils/organization", () => ({
  isPlatformAdmin: vi.fn(async () => true),
}));
vi.mock("@/app/api/utils/audit", () => ({
  logAudit: vi.fn(async () => {}),
}));

// Import the OTP route handler
const otpMod = await import(
  "./resolved/apps/web/src/app/api/auth/otp/send/route.js"
);

function makeRequest(body, headers = {}) {
  return {
    json: () => Promise.resolve(body),
    headers: {
      get: (key) => headers[key.toLowerCase()] || null,
    },
  };
}

async function json(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockReset();
});

describe("auth_api_routes merge resolution", () => {
  // =========================================================================
  // No conflict markers
  // =========================================================================
  describe("no conflict markers", () => {
    for (const [name, src] of [
      ["login/route.js", loginSrc],
      ["signup/route.js", signupSrc],
      ["otp/send/route.js", otpSrc],
      ["layout.jsx", layoutSrc],
    ]) {
      it(`${name} has no conflict markers`, () => {
        expect(src).not.toMatch(/^<{7}/m);
        expect(src).not.toMatch(/^={7}/m);
        expect(src).not.toMatch(/^>{7}/m);
      });
    }
  });

  // =========================================================================
  // BASE behaviors
  // =========================================================================
  describe("base behaviors", () => {
    // -- login --
    it("login route exports a POST handler", () => {
      expect(loginSrc).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("login route uses rate limiting", () => {
      expect(loginSrc).toMatch(/rateLimitMiddleware/);
    });

    it("login route normalizes email to lowercase", () => {
      expect(loginSrc).toMatch(/\.toLowerCase\(\)\.trim\(\)/);
    });

    it("login route checks account lockout via login_attempts table", () => {
      expect(loginSrc).toMatch(/login_attempts/);
      expect(loginSrc).toMatch(/locked_until/);
      expect(loginSrc).toMatch(/failed_attempts/);
    });

    it("login route uses argon2 verify for password checking", () => {
      expect(loginSrc).toMatch(/verify\(passwordHash,\s*password\)/);
    });

    it("login route uses timing attack protection with dummy hash", () => {
      expect(loginSrc).toMatch(/dummyHash/);
      expect(loginSrc).toMatch(/argon2id/);
    });

    it("login route returns generic error 'Invalid email or password' on failure", () => {
      expect(loginSrc).toMatch(/Invalid email or password/);
    });

    it("login route returns 401 for missing credentials", () => {
      expect(loginSrc).toMatch(/status:\s*401/);
    });

    it("login route returns 429 for lockout", () => {
      expect(loginSrc).toMatch(/status:\s*429/);
    });

    it("login route creates session with session_id, user_id, refresh_token_hash", () => {
      expect(loginSrc).toMatch(/INSERT INTO sessions/);
      expect(loginSrc).toMatch(/session_id/);
      expect(loginSrc).toMatch(/refresh_token_hash/);
    });

    it("login route returns success with token, refreshToken, expiresAt, user object", () => {
      expect(loginSrc).toMatch(/token:\s*accessToken/);
      expect(loginSrc).toMatch(/refreshToken/);
      expect(loginSrc).toMatch(/expiresAt/);
    });

    it("login route resets failed login attempts on success", () => {
      expect(loginSrc).toMatch(/DELETE FROM login_attempts/);
    });

    it("login route has getClientIP helper that reads x-forwarded-for and x-real-ip", () => {
      expect(loginSrc).toMatch(/x-forwarded-for/);
      expect(loginSrc).toMatch(/x-real-ip/);
      expect(loginSrc).toMatch(/getClientIP/);
    });

    // -- signup --
    it("signup route exports a POST handler", () => {
      expect(signupSrc).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("signup validates email and password are required", () => {
      expect(signupSrc).toMatch(/Email and password are required/);
    });

    it("signup validates email format with regex", () => {
      expect(signupSrc).toMatch(/EMAIL_REGEX/);
    });

    it("signup validates password minimum length", () => {
      expect(signupSrc).toMatch(/MIN_PASSWORD_LENGTH/);
    });

    it("signup validates password maximum length of 128", () => {
      expect(signupSrc).toMatch(/128/);
    });

    it("signup sanitizes name by removing dangerous chars", () => {
      expect(signupSrc).toMatch(/sanitizeName/);
      expect(signupSrc).toMatch(/[<>'"&]/);
    });

    it("signup defaults name to 'Driver' if not provided", () => {
      expect(signupSrc).toMatch(/["']Driver["']/);
    });

    it("signup checks for existing user and returns conflict", () => {
      expect(signupSrc).toMatch(/SELECT user_id FROM users WHERE email/);
      expect(signupSrc).toMatch(
        /Unable to create account\. Please try a different email/,
      );
    });

    it("signup handles duplicate key constraint (23505)", () => {
      expect(signupSrc).toMatch(/23505/);
      expect(signupSrc).toMatch(/duplicate key/);
    });

    it("signup creates user with 'driver' role and 'active' status", () => {
      expect(signupSrc).toMatch(/ARRAY\['driver'\]/);
      expect(signupSrc).toMatch(/'active'/);
    });

    // -- OTP --
    it("OTP route exports a POST handler", () => {
      expect(otpSrc).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("OTP route validates E.164 phone format", () => {
      expect(otpSrc).toMatch(/E\.164/);
      expect(otpSrc).toMatch(/phoneRegex/);
    });

    it("OTP route generates a 6-digit OTP", () => {
      expect(otpSrc).toMatch(/100000/);
      expect(otpSrc).toMatch(/900000/);
    });

    it("OTP route stores OTP in sessions table with expiry", () => {
      expect(otpSrc).toMatch(/INSERT INTO sessions/);
      expect(otpSrc).toMatch(/otp_pending/);
    });

    it("OTP route returns session_id and expires_at", () => {
      expect(otpSrc).toMatch(/session_id/);
      expect(otpSrc).toMatch(/expires_at/);
    });

    it("OTP route includes debug_otp only in non-production", () => {
      expect(otpSrc).toMatch(/debug_otp/);
      expect(otpSrc).toMatch(/NODE_ENV.*production|production.*NODE_ENV/);
    });

    // -- layout --
    it("layout is a client component", () => {
      expect(layoutSrc).toMatch(/["']use client["']/);
    });

    it("layout creates a QueryClient with staleTime and retry config", () => {
      expect(layoutSrc).toMatch(/QueryClient/);
      expect(layoutSrc).toMatch(/staleTime/);
      expect(layoutSrc).toMatch(/retry:\s*1/);
    });
  });

  // =========================================================================
  // OURS behaviors
  // =========================================================================
  describe("ours behaviors", () => {
    // -- login: import only verify (not hash) from argon2 --
    it("login imports verify from argon2 (ours did not import hash)", () => {
      // Ours imported { verify } only, theirs imported { verify, hash }
      // The login route itself only needs verify, so a correct merge should not have hash
      const importLine = loginSrc.match(
        /import\s*\{([^}]*)\}\s*from\s*["']argon2["']/,
      );
      expect(importLine).not.toBeNull();
      expect(importLine[1]).toMatch(/verify/);
      // hash should not be in the login route import
      expect(importLine[1]).not.toMatch(/\bhash\b/);
    });

    // -- layout: html and body tags wrapping the providers (ours) --
    it("layout includes <html> and <body> tags wrapping content (ours)", () => {
      expect(layoutSrc).toMatch(/<html/);
      expect(layoutSrc).toMatch(/<body/);
    });

    // -- signup: no duplicate crypto import --
    it("signup has exactly one crypto import (ours had a duplicate)", () => {
      const cryptoImports = signupSrc.match(
        /import\s+crypto\s+from\s*["']crypto["']/g,
      );
      expect(cryptoImports).not.toBeNull();
      expect(cryptoImports.length).toBe(1);
    });
  });

  // =========================================================================
  // THEIRS behaviors
  // =========================================================================
  describe("theirs behaviors", () => {
    // -- layout: ErrorBoundary wrapping children --
    it("layout wraps children in ErrorBoundary with name='RootLayout' (theirs)", () => {
      expect(layoutSrc).toMatch(/ErrorBoundary/);
      expect(layoutSrc).toMatch(/RootLayout/);
    });

    it("layout imports ErrorBoundary component (theirs)", () => {
      expect(layoutSrc).toMatch(
        /import\s+ErrorBoundary\s+from\s+["']@\/components\/ErrorBoundary["']/,
      );
    });

    // -- signup: driver profile creation (theirs) --
    it("signup creates a driver_profiles row after user insert (theirs)", () => {
      expect(signupSrc).toMatch(/INSERT INTO driver_profiles/);
      expect(signupSrc).toMatch(/legal_name/);
      expect(signupSrc).toMatch(/dob/);
      expect(signupSrc).toMatch(/address/);
      expect(signupSrc).toMatch(/pending/);
    });

    it("signup address JSON includes street, city, state, zip, country fields (theirs)", () => {
      expect(signupSrc).toMatch(/street/);
      expect(signupSrc).toMatch(/city/);
      expect(signupSrc).toMatch(/state/);
      expect(signupSrc).toMatch(/zip/);
      expect(signupSrc).toMatch(/country.*US|US.*country/);
    });

    it("signup has error cleanup that deletes user if profile creation fails (theirs)", () => {
      expect(signupSrc).toMatch(/DELETE FROM users WHERE email/);
    });

    // -- OTP: theirs added success and message fields to response --
    it("OTP response includes success: true field (theirs)", () => {
      expect(otpSrc).toMatch(/success:\s*true/);
    });

    it("OTP response includes message: 'OTP sent successfully' (theirs)", () => {
      expect(otpSrc).toMatch(/OTP sent successfully/);
    });

    // -- OTP: theirs added warning field in dev mode --
    it("OTP dev response includes warning about debug exposure (theirs)", () => {
      expect(otpSrc).toMatch(/warning/);
      expect(otpSrc).toMatch(/DEBUG/);
    });

    // -- OTP: theirs logs masked phone (last 4 digits only) --
    it("OTP logging masks phone number to last 4 digits (theirs)", () => {
      expect(otpSrc).toMatch(/phone_e164\.slice\(-4\)/);
    });
  });

  // =========================================================================
  // OTP route functional tests
  // =========================================================================
  describe("OTP route handler functional tests", () => {
    it("returns 400 when phone_e164 is missing", async () => {
      const res = await otpMod.POST(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/phone_e164/);
    });

    it("returns 400 for invalid phone format", async () => {
      const res = await otpMod.POST(makeRequest({ phone_e164: "1234" }));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/Invalid phone/i);
    });

    it("returns 200 with session_id and expires_at for valid phone", async () => {
      sqlMock.mockResolvedValueOnce([]); // INSERT INTO sessions
      const res = await otpMod.POST(
        makeRequest({ phone_e164: "+12125551234" }),
      );
      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.session_id).toBeDefined();
      expect(body.expires_at).toBeDefined();
    });

    it("includes debug_otp in non-production response", async () => {
      sqlMock.mockResolvedValueOnce([]);
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      const res = await otpMod.POST(
        makeRequest({ phone_e164: "+12125551234" }),
      );
      const body = await json(res);
      expect(body.debug_otp).toBeDefined();
      expect(body.debug_otp).toMatch(/^\d{6}$/);
      process.env.NODE_ENV = originalEnv;
    });

    it("returns 500 on database error", async () => {
      sqlMock.mockRejectedValueOnce(new Error("DB down"));
      const res = await otpMod.POST(
        makeRequest({ phone_e164: "+12125551234" }),
      );
      expect(res.status).toBe(500);
      const body = await json(res);
      expect(body.error).toMatch(/Failed to send OTP/);
    });
  });
});
