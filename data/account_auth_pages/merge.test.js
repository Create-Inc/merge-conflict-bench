import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (rel) =>
  readFileSync(join(__dirname, "resolved", rel), "utf-8");

const signup = read("apps/web/src/app/account/signup/page.jsx");
const signin = read("apps/web/src/app/account/signin/page.jsx");
const forgot = read("apps/web/src/app/account/forgot-password/page.jsx");
const reset = read("apps/web/src/app/account/reset-password/page.jsx");

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("signup page", () => {
    it("exports a default function component", () => {
      expect(signup).toMatch(/export\s+default\s+function\s+\w+/);
    });

    it("has use client directive", () => {
      expect(signup.trimStart().startsWith('"use client"')).toBe(true);
    });

    it("manages formData state with name, email, password, confirmPassword", () => {
      expect(signup).toMatch(/useState\s*\(\s*\{[^}]*name/);
      expect(signup).toMatch(/email/);
      expect(signup).toMatch(/password/);
      expect(signup).toMatch(/confirmPassword/);
    });

    it("has password toggle with showPassword and showConfirmPassword states", () => {
      expect(signup).toMatch(/showPassword/);
      expect(signup).toMatch(/showConfirmPassword/);
    });

    it("has terms checkbox with agreedToTerms state", () => {
      expect(signup).toMatch(/agreedToTerms/);
      expect(signup).toMatch(/type="checkbox"/);
    });

    it("disables submit when loading or terms not agreed", () => {
      expect(signup).toMatch(/disabled=\{.*loading.*\|\|.*!agreedToTerms/);
    });

    it("validates email format with regex", () => {
      expect(signup).toMatch(/emailRegex/);
      // Check for email regex pattern like [^\s@]+@[^\s@]+
      expect(signup).toMatch(/@/);
    });

    it("validates password length >= 8", () => {
      expect(signup).toMatch(/password\.length\s*<\s*8/);
    });

    it("validates passwords match", () => {
      expect(signup).toMatch(
        /formData\.password\s*!==\s*formData\.confirmPassword/,
      );
    });

    it("posts to /api/auth/signup", () => {
      expect(signup).toMatch(/\/api\/auth\/signup/);
    });

    it("redirects to signin after success", () => {
      expect(signup).toMatch(/\/account\/signin/);
    });

    it("shows success state with email verification message", () => {
      expect(signup).toMatch(/success/);
      expect(signup).toMatch(/verification/i);
    });

    it("has link to signin page", () => {
      expect(signup).toMatch(/signInHref/);
    });

    it("has Eye and EyeOff icons for password visibility", () => {
      expect(signup).toMatch(/Eye/);
      expect(signup).toMatch(/EyeOff/);
    });
  });

  describe("signin page", () => {
    it("exports a default function component", () => {
      expect(signin).toMatch(/export\s+default\s+function\s+\w+/);
    });

    it("manages email, password, showPassword, loading, error states", () => {
      expect(signin).toMatch(/useState.*email/s);
      expect(signin).toMatch(/useState.*password/s);
      expect(signin).toMatch(/showPassword/);
      expect(signin).toMatch(/loading/);
      expect(signin).toMatch(/error/);
    });

    it("uses signInWithCredentials from useAuth", () => {
      expect(signin).toMatch(/signInWithCredentials/);
      expect(signin).toMatch(/useAuth/);
    });

    it("has forgot password link", () => {
      expect(signin).toMatch(/forgot-password/);
    });

    it("normalizes email to lowercase before submitting", () => {
      expect(signin).toMatch(/\.trim\(\)\.toLowerCase\(\)/);
    });

    it("has link to signup page", () => {
      expect(signin).toMatch(/signUpHref/);
      expect(signin).toMatch(/\/account\/signup/);
    });

    it("reads message and callbackUrl from URL params", () => {
      expect(signin).toMatch(/URLSearchParams/);
      expect(signin).toMatch(/callbackUrl/);
      expect(signin).toMatch(/message/);
    });

    it("shows success message and error state", () => {
      expect(signin).toMatch(/successMessage/);
      expect(signin).toMatch(/\{error\s*&&/);
    });
  });

  describe("forgot-password page", () => {
    it("exports a default function component", () => {
      expect(forgot).toMatch(/export\s+default\s+function\s+\w+/);
    });

    it("has email, loading, success, error states", () => {
      expect(forgot).toMatch(/useState.*null/s);
      expect(forgot).toMatch(/loading/);
      expect(forgot).toMatch(/success/);
    });

    it("validates email before submitting", () => {
      expect(forgot).toMatch(/validateEmail/);
    });

    it("posts to /api/auth/forgot-password", () => {
      expect(forgot).toMatch(/\/api\/auth\/forgot-password/);
    });

    it("shows success state with email confirmation", () => {
      expect(forgot).toMatch(/success/);
      expect(forgot).toMatch(/Check your email/i);
    });

    it("has try different email button that resets state", () => {
      expect(forgot).toMatch(/setSuccess\(false\)/);
      expect(forgot).toMatch(/setEmail\(""\)/);
    });

    it("has link back to signin", () => {
      expect(forgot).toMatch(/\/account\/signin/);
    });

    it("disables submit when loading or email empty", () => {
      expect(forgot).toMatch(/disabled=\{.*loading.*\|\|.*!email\.trim\(\)/);
    });
  });

  describe("reset-password page", () => {
    it("exports a default function component", () => {
      expect(reset).toMatch(/export\s+default\s+function\s+\w+/);
    });

    it("manages token, email, password states", () => {
      expect(reset).toMatch(/token/);
      expect(reset).toMatch(/email/);
      expect(reset).toMatch(/password/);
    });

    it("reads token and email from URL params", () => {
      expect(reset).toMatch(/URLSearchParams/);
      expect(reset).toMatch(/token/);
    });

    it("posts to /api/auth/reset-password", () => {
      expect(reset).toMatch(/\/api\/auth\/reset-password/);
    });

    it("sends token, email, and password in request body", () => {
      expect(reset).toMatch(/JSON\.stringify/);
      expect(reset).toMatch(/token/);
    });

    it("redirects to signin after successful reset", () => {
      expect(reset).toMatch(/\/account\/signin/);
    });

    it("has password visibility toggle with Eye/EyeOff", () => {
      expect(reset).toMatch(/showPassword/);
      expect(reset).toMatch(/Eye/);
      expect(reset).toMatch(/EyeOff/);
    });

    it("shows success state", () => {
      expect(reset).toMatch(/success/);
    });

    it("has link to signin", () => {
      expect(reset).toMatch(/signInHref|\/account\/signin/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (glassmorphism / frosted-glass design)
// =====================================================================
describe("ours behaviors", () => {
  describe("signup page uses glassmorphism background design", () => {
    it("includes background image with BG_URL", () => {
      expect(signup).toMatch(/BG_URL/);
      expect(signup).toMatch(/createusercontent\.com/);
    });

    it("uses glassmorphism card with backdrop blur", () => {
      expect(signup).toMatch(/backdrop-blur/);
      expect(signup).toMatch(/bg-white\/35|bg-white\/30/);
    });

    it("uses rounded-[28px] card styling", () => {
      expect(signup).toMatch(/rounded-\[28px\]/);
    });

    it("uses Home icon watermark element", () => {
      expect(signup).toMatch(/Home/);
      expect(signup).toMatch(/HOOY SOLUTIONS/);
    });
  });

  describe("signin page uses glassmorphism design with remember me", () => {
    it("has remember me checkbox", () => {
      expect(signin).toMatch(/rememberMe/);
      expect(signin).toMatch(/Remember me/);
    });

    it("saves/loads email in localStorage for remember me", () => {
      expect(signin).toMatch(/localStorage/);
      expect(signin).toMatch(/hooy_remember_email/);
    });

    it("uses glassmorphism card with backdrop blur", () => {
      expect(signin).toMatch(/backdrop-blur/);
    });

    it("uses Home icon", () => {
      expect(signin).toMatch(/Home/);
    });
  });

  describe("forgot-password page uses glassmorphism design with back button", () => {
    it("has ArrowLeft back button", () => {
      expect(forgot).toMatch(/ArrowLeft/);
    });

    it("uses window.history.back() for back navigation", () => {
      expect(forgot).toMatch(/window\.history\.back\(\)/);
    });

    it("uses glassmorphism card with backdrop blur", () => {
      expect(forgot).toMatch(/backdrop-blur/);
    });
  });

  describe("reset-password page uses glassmorphism design", () => {
    it("uses glassmorphism card with backdrop blur", () => {
      expect(reset).toMatch(/backdrop-blur/);
    });

    it("uses Home icon", () => {
      expect(reset).toMatch(/Home/);
    });

    it("has background image with BG_URL", () => {
      expect(reset).toMatch(/BG_URL/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (translation support, password strength, token validation)
// =====================================================================
describe("theirs behaviors", () => {
  describe("signup page uses useTranslation for i18n", () => {
    it("imports and uses useTranslation", () => {
      expect(signup).toMatch(/useTranslation/);
    });

    it("uses t() for translatable text in submit button", () => {
      expect(signup).toMatch(/t\(\s*["']creatingAccount["']\s*\)/);
    });
  });

  describe("signin page uses useTranslation for i18n", () => {
    it("imports and uses useTranslation", () => {
      expect(signin).toMatch(/useTranslation/);
    });

    it("uses t() for signing in button text", () => {
      expect(signin).toMatch(/t\(\s*["']signingIn["']\s*\)/);
    });

    it("uses t() for error messages", () => {
      expect(signin).toMatch(/t\(\s*["']fillAllFields["']\s*\)/);
      expect(signin).toMatch(/t\(\s*["']incorrectCredentials["']\s*\)/);
    });
  });

  describe("reset-password page has token validation", () => {
    it("validates token with API call on mount", () => {
      expect(reset).toMatch(/\/api\/auth\/reset-password\/validate/);
    });

    it("manages tokenValid state (null, true, false)", () => {
      expect(reset).toMatch(/tokenValid/);
      expect(reset).toMatch(/setTokenValid/);
    });

    it("shows invalid token state with AlertCircle icon", () => {
      expect(reset).toMatch(/AlertCircle/);
      expect(reset).toMatch(/Invalid reset link/i);
    });

    it("shows loading/validating state when tokenValid is null", () => {
      expect(reset).toMatch(/tokenValid\s*===\s*null/);
      expect(reset).toMatch(/Validating/i);
    });

    it("has link to request new reset link when token is invalid", () => {
      expect(reset).toMatch(/\/account\/forgot-password/);
    });
  });
});
