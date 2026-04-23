import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const pageSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/page.jsx"),
  "utf-8"
);
const signinSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/account/signin/page.jsx"),
  "utf-8"
);
const signupSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/account/signup/page.jsx"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("landing page: cashmike SMTP checker header", () => {
    it("displays 'cashmike SMTP checker' heading", () => {
      expect(pageSrc).toMatch(/cashmike SMTP checker/);
    });

    it("displays 'Choose a user to sign in' subtext", () => {
      expect(pageSrc).toMatch(/Choose a user to sign in/);
    });
  });

  describe("landing page: admin and alonsy-y user buttons", () => {
    it("has a link for Admin user", () => {
      expect(pageSrc).toMatch(/user=admin/);
      expect(pageSrc).toMatch(/>[\s]*Admin[\s]*</);
    });

    it("has a link for ALONSY-Y user", () => {
      expect(pageSrc).toMatch(/user=alonsy-y/);
      expect(pageSrc).toMatch(/ALONSY-Y/);
    });

    it("both links include callbackUrl=/", () => {
      expect(pageSrc).toMatch(/callbackUrl=\//);
    });
  });

  describe("signin page: form structure", () => {
    it("has a Sign In heading", () => {
      expect(signinSrc).toMatch(/Sign In/);
    });

    it("has email/username and password inputs", () => {
      expect(signinSrc).toMatch(/name=["']email["']/);
      expect(signinSrc).toMatch(/name=["']password["']/);
      expect(signinSrc).toMatch(/type=["']password["']/);
    });

    it("has a submit button", () => {
      expect(signinSrc).toMatch(/type=["']submit["']/);
    });
  });

  describe("signin page: error handling", () => {
    it("defines error messages for common auth errors", () => {
      expect(signinSrc).toMatch(/OAuthSignin/);
      expect(signinSrc).toMatch(/CredentialsSignin/);
      expect(signinSrc).toMatch(/AccessDenied/);
    });
  });

  describe("signin page: username-to-email transform", () => {
    it("appends @smtp-checker.local for plain usernames", () => {
      expect(signinSrc).toMatch(/smtp-checker\.local/);
    });
  });

  describe("signin page: callbackUrl support", () => {
    it("reads callbackUrl from URL search params", () => {
      expect(signinSrc).toMatch(/callbackUrl/);
      expect(signinSrc).toMatch(/params\.get/);
    });

    it("uses callbackUrl state initialized to '/'", () => {
      expect(signinSrc).toMatch(/useState\(["']\/["']\)/);
    });
  });

  describe("signup page: disabled state", () => {
    it("shows 'Sign up is disabled' message", () => {
      expect(signupSrc).toMatch(/Sign up is disabled/);
    });

    it("has a link back to home", () => {
      expect(signupSrc).toMatch(/href=["']\/["']/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("landing page: admin button uses blue-600 styling", () => {
    it("admin link uses bg-blue-600", () => {
      // Find the admin link's class
      const adminLinkMatch = pageSrc.match(/user=admin[\s\S]*?className=["']([^"']+)["']/);
      expect(adminLinkMatch).not.toBeNull();
      expect(adminLinkMatch[1]).toMatch(/bg-blue-600/);
    });
  });

  describe("signin page: uses signInWithCredentials from useAuth", () => {
    it("imports useAuth hook", () => {
      expect(signinSrc).toMatch(/import.*useAuth.*from/);
    });

    it("calls signInWithCredentials with email, password, callbackUrl, redirect", () => {
      expect(signinSrc).toMatch(/signInWithCredentials/);
      expect(signinSrc).toMatch(/redirect:\s*true/);
    });
  });

  describe("signup page: exports named function component", () => {
    it("exports SignUpDisabledPage as default", () => {
      expect(signupSrc).toMatch(/export\s+default\s+function\s+SignUpDisabledPage/);
    });
  });

  describe("signin page: lockedUser disables input", () => {
    it("disables email input when lockedUser is true", () => {
      expect(signinSrc).toMatch(/disabled=\{lockedUser\}/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("landing page: callbackUrl first in query string", () => {
    it("uses callbackUrl=/&user= format (callbackUrl before user)", () => {
      expect(pageSrc).toMatch(/callbackUrl=\/&user=/);
    });
  });

  describe("signin page: locked user from query param", () => {
    it("reads user from URL params and sets lockedUser", () => {
      expect(signinSrc).toMatch(/params\.get\(["']user["']\)/);
      expect(signinSrc).toMatch(/setLockedUser/);
    });

    it("lockedUser is boolean (not string)", () => {
      expect(signinSrc).toMatch(/useState\(false\)/);
    });
  });

  describe("signin page: username placeholder", () => {
    it("uses 'admin or alonsy-y' as placeholder", () => {
      expect(signinSrc).toMatch(/admin or alonsy-y/);
    });
  });

  describe("signin page: back to home link", () => {
    it("has a 'Back to home' link", () => {
      expect(signinSrc).toMatch(/Back to home/);
    });
  });

  describe("signup page: uses pre-made accounts wording", () => {
    it("says 'pre-made accounts only'", () => {
      expect(signupSrc).toMatch(/pre-made accounts/);
    });

    it("button text says 'Go to home'", () => {
      expect(signupSrc).toMatch(/Go to home/);
    });
  });

  describe("no conflict markers", () => {
    it("page.jsx has no conflict markers", () => {
      expect(pageSrc).not.toMatch(/<<<<<<</);
    });

    it("signin page has no conflict markers", () => {
      expect(signinSrc).not.toMatch(/<<<<<<</);
    });

    it("signup page has no conflict markers", () => {
      expect(signupSrc).not.toMatch(/<<<<<<</);
    });
  });
});
