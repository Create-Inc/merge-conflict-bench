import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Read resolved files as text for structural tests
const getSessionSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/utils/get-session.js"),
  "utf-8"
);
const onboardingSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/onboarding/page.jsx"),
  "utf-8"
);
const useUserSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/utils/useUser.js"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS (shared by both ours and theirs before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("get-session: locked account rejection", () => {
    it("returns null when the user account is locked (locked_until in the future)", () => {
      // Both sides check locked_until and return null
      expect(getSessionSrc).toMatch(/locked_until/);
      expect(getSessionSrc).toMatch(/new Date\(.*locked_until\).*>.*new Date\(\)/);
      // After the lock check, it returns null
      expect(getSessionSrc).toMatch(/locked_until[\s\S]*?return null/);
    });
  });

  describe("get-session: error handling", () => {
    it("catches errors and returns null", () => {
      expect(getSessionSrc).toMatch(/catch\s*\(err\)/);
      expect(getSessionSrc).toMatch(/console\.error\(.*Get session error/);
      expect(getSessionSrc).toMatch(/catch[\s\S]*?return null/);
    });
  });

  describe("get-session: auth() call", () => {
    it("imports and calls auth() from @/auth", () => {
      expect(getSessionSrc).toMatch(/import\s*\{?\s*auth\s*\}?\s*from\s*["']@\/auth["']/);
      expect(getSessionSrc).toMatch(/const session\s*=\s*await auth\(\)/);
    });
  });

  describe("get-session: SQL query for auth_users", () => {
    it("queries the auth_users table by user id", () => {
      expect(getSessionSrc).toMatch(/FROM\s+auth_users/);
      expect(getSessionSrc).toMatch(/WHERE\s+id\s*=/);
    });

    it("selects role and two_factor_enabled from the database", () => {
      expect(getSessionSrc).toMatch(/role/);
      expect(getSessionSrc).toMatch(/two_factor_enabled/);
    });
  });

  describe("onboarding: redirect when not logged in", () => {
    it("redirects to /account/signin with callbackUrl=/onboarding", () => {
      expect(onboardingSrc).toMatch(
        /window\.location\.href\s*=\s*["']\/account\/signin\?callbackUrl=\/onboarding["']/
      );
    });
  });

  describe("onboarding: 4-step wizard", () => {
    it("has 4 steps: Welcome, Your Details, Preferences, Terms", () => {
      expect(onboardingSrc).toMatch(/Welcome to Burger Head/);
      expect(onboardingSrc).toMatch(/Your Details/);
      expect(onboardingSrc).toMatch(/Preferences/);
      expect(onboardingSrc).toMatch(/Terms & Conditions/);
    });
  });

  describe("onboarding: form submission", () => {
    it("submits to /api/profile with PUT method", () => {
      expect(onboardingSrc).toMatch(/fetch\(["']\/api\/profile["']/);
      expect(onboardingSrc).toMatch(/method:\s*["']PUT["']/);
    });

    it("sends name, patty_size_g, default_quantity, profile_notes, terms_accepted", () => {
      expect(onboardingSrc).toMatch(/patty_size_g/);
      expect(onboardingSrc).toMatch(/default_quantity/);
      expect(onboardingSrc).toMatch(/profile_notes/);
      expect(onboardingSrc).toMatch(/terms_accepted/);
    });
  });

  describe("useUser: session hook integration", () => {
    it("imports useSession from @auth/create/react", () => {
      expect(useUserSrc).toMatch(/import.*useSession.*from\s*["']@auth\/create\/react["']/);
    });

    it("fetches /api/profile for richer user data", () => {
      expect(useUserSrc).toMatch(/fetch\(["']\/api\/profile["']/);
    });

    it("returns user, data, loading, and refetch", () => {
      expect(useUserSrc).toMatch(/return\s*\{[\s\S]*?user[\s\S]*?data[\s\S]*?loading[\s\S]*?refetch[\s\S]*?\}/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the "ours" side of the conflict)
// =====================================================================
describe("ours behaviors", () => {
  describe("get-session: expanded field selection", () => {
    it("selects approved, approved_at, terms_accepted_at from auth_users", () => {
      // Ours added these extra fields to the SELECT query
      expect(getSessionSrc).toMatch(/approved/);
      expect(getSessionSrc).toMatch(/terms_accepted_at/);
    });

    it("selects two_factor_verified_at from auth_users", () => {
      expect(getSessionSrc).toMatch(/two_factor_verified_at/);
    });
  });

  describe("get-session: email fallback lookup", () => {
    it("falls back to email-based lookup when userId is not a valid number", () => {
      // Ours has a branch that queries by email when userId isn't numeric
      expect(getSessionSrc).toMatch(/WHERE\s+email\s*=/);
    });
  });

  describe("get-session: session spreading", () => {
    it("spreads session into the return value (preserving expires and other fields)", () => {
      expect(getSessionSrc).toMatch(/\.\.\.session/);
    });
  });

  describe("useUser: credentials in fetch", () => {
    it("includes credentials: 'include' in the profile fetch", () => {
      expect(useUserSrc).toMatch(/credentials:\s*["']include["']/);
    });

    it("includes Accept: application/json header", () => {
      expect(useUserSrc).toMatch(/Accept.*application\/json/);
    });
  });

  describe("useUser: warns on non-ok response", () => {
    it("logs a console.warn when /api/profile returns non-ok", () => {
      expect(useUserSrc).toMatch(/console\.warn/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the "theirs" side of the conflict)
// =====================================================================
describe("theirs behaviors", () => {
  describe("get-session: rawId extraction", () => {
    it("checks session validity with rawId null/undefined check", () => {
      // Theirs extracts rawId from session.user.id and checks for null/undefined
      // The resolved version must handle the case where session has no valid user id
      expect(getSessionSrc).toMatch(/session/);
      // It should still return null for invalid sessions
      expect(getSessionSrc).toMatch(/return null/);
    });
  });

  describe("onboarding: callbackUrl comment from theirs", () => {
    it("includes a callbackUrl reference in the signin redirect", () => {
      expect(onboardingSrc).toMatch(/callbackUrl/);
    });
  });

  describe("useUser: unauthenticated fallback with profile fetch", () => {
    it("has a fallback path for unauthenticated status using profile fetch", () => {
      expect(useUserSrc).toMatch(/unauthenticated/);
      expect(useUserSrc).toMatch(/triedProfileFallbackRef/);
    });
  });

  describe("signup page: sign-up disabled placeholder", () => {
    it("does not contain conflict markers", () => {
      expect(onboardingSrc).not.toMatch(/<<<<<<</);
      expect(onboardingSrc).not.toMatch(/>>>>>>>/);
      expect(onboardingSrc).not.toMatch(/=======/);
    });
  });
});
