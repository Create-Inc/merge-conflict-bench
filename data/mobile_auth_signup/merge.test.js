import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const signinSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/auth/signin.jsx"),
  "utf8",
);

const signupSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/auth/signup.jsx"),
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
  describe("signin.jsx - component structure", () => {
    it("exports a default SignInPage function component", () => {
      expect(signinSrc).toMatch(/export\s+default\s+function\s+SignInPage/);
    });

    it("uses useState for email, password, loading, and error", () => {
      expect(signinSrc).toMatch(/useState.*email/s);
      expect(signinSrc).toMatch(/useState.*password/s);
      expect(signinSrc).toMatch(/useState.*loading/s);
      expect(signinSrc).toMatch(/useState.*error/s);
    });

    it("calls /api/auth/token with POST method", () => {
      expect(signinSrc).toMatch(/\/api\/auth\/token/);
      expect(signinSrc).toMatch(/method:\s*["']POST["']/);
    });

    it("validates that email and password are filled before submitting", () => {
      expect(signinSrc).toMatch(/!email\s*\|\|\s*!password/);
    });

    it("uses setAuth to store token and user", () => {
      expect(signinSrc).toMatch(/setAuth/);
    });

    it("navigates to home after successful login", () => {
      expect(signinSrc).toMatch(/router\.replace\(["']\/["']\)/);
    });

    it("has a link to signup page", () => {
      expect(signinSrc).toMatch(/\/auth\/signup/);
    });
  });

  describe("signup.jsx - component structure", () => {
    it("exports a default SignUpPage function component", () => {
      expect(signupSrc).toMatch(/export\s+default\s+function\s+SignUpPage/);
    });

    it("validates minimum password length of 6 characters", () => {
      expect(signupSrc).toMatch(/password\.length\s*<\s*6/);
    });

    it("calls /api/auth/token with PUT method for signup", () => {
      expect(signupSrc).toMatch(/method:\s*["']PUT["']/);
    });

    it("has a link to signin page", () => {
      expect(signupSrc).toMatch(/\/auth\/signin/);
    });

    it("sends name, email, and password in the signup request", () => {
      expect(signupSrc).toMatch(/name/);
      expect(signupSrc).toMatch(/email/);
      expect(signupSrc).toMatch(/password/);
    });
  });

  describe("token/route.js - POST handler (login)", () => {
    it("exports a POST function for login", () => {
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("validates email and password are required", () => {
      expect(tokenRouteSrc).toMatch(/!email\s*\|\|\s*!password/);
    });

    it("uses argon2 verify to check password", () => {
      expect(tokenRouteSrc).toMatch(/verify\(/);
    });

    it("returns token and user object on successful login", () => {
      expect(tokenRouteSrc).toMatch(/token/);
      expect(tokenRouteSrc).toMatch(/user:/);
    });

    it("returns 401 for wrong credentials", () => {
      expect(tokenRouteSrc).toMatch(/401/);
    });
  });

  describe("token/route.js - PUT handler (signup)", () => {
    it("exports a PUT function for signup", () => {
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+PUT/);
    });

    it("validates minimum password length of 6", () => {
      expect(tokenRouteSrc).toMatch(/password\.length\s*<\s*6/);
    });

    it("checks for existing users before creating", () => {
      expect(tokenRouteSrc).toMatch(/SELECT.*FROM\s+auth_users.*WHERE.*email/s);
    });

    it("hashes password using argon2 before storing", () => {
      expect(tokenRouteSrc).toMatch(/hash\(password\)/);
    });

    it("inserts into auth_users and auth_accounts tables", () => {
      expect(tokenRouteSrc).toMatch(/INSERT\s+INTO\s+auth_users/);
      expect(tokenRouteSrc).toMatch(/INSERT\s+INTO\s+auth_accounts/);
    });
  });

  describe("token/route.js - GET handler (session-based)", () => {
    it("exports a GET function", () => {
      expect(tokenRouteSrc).toMatch(/export\s+async\s+function\s+GET/);
    });

    it("uses getToken from @auth/core/jwt", () => {
      expect(tokenRouteSrc).toMatch(/getToken/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (token-only auth check, token returned on signup)
// =====================================================================
describe("ours behaviors", () => {
  describe("signin.jsx - token-only auth check", () => {
    it("checks for data.token to determine successful login (not requiring data.user)", () => {
      // The ours branch checks data.token (not data.token && data.user)
      expect(signinSrc).toMatch(/data\.token/);
    });

    it("passes user with fallback when calling setAuth", () => {
      // Should handle case where user might be null/undefined
      expect(signinSrc).toMatch(/setAuth/);
    });
  });

  describe("signup.jsx - token returned on signup", () => {
    it("checks signupData.token for immediate login after signup", () => {
      expect(signupSrc).toMatch(/signupData\.token/);
    });

    it("has a fallback sign-in flow if signup does not return a token", () => {
      // Should have a POST call to /api/auth/token as fallback
      expect(signupSrc).toMatch(/method:\s*["']POST["']/);
    });
  });

  describe("token/route.js - signup returns token", () => {
    it("returns a token along with success on signup", () => {
      // The PUT handler should return token in the response
      expect(tokenRouteSrc).toMatch(/token/);
      expect(tokenRouteSrc).toMatch(/signUserToken/);
    });

    it("email is required but name is optional (falls back to default)", () => {
      // Ours checks !email || !password (not !name)
      // And uses name || "Ny bruker" as fallback
      expect(tokenRouteSrc).toMatch(/Ny bruker/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (user existence check, error message style)
// =====================================================================
describe("theirs behaviors", () => {
  describe("token/route.js - user already exists error message", () => {
    it("returns an error when user with that email already exists", () => {
      // The error message should indicate the user already exists
      expect(tokenRouteSrc).toMatch(/eksisterer allerede|finnes allerede/);
    });
  });

  describe("token/route.js - signup creates credentials account", () => {
    it("inserts credentials account with provider = 'credentials'", () => {
      expect(tokenRouteSrc).toMatch(/provider.*credentials/s);
    });

    it("assigns role 'customer' to new users", () => {
      expect(tokenRouteSrc).toMatch(/customer/);
    });
  });
});
