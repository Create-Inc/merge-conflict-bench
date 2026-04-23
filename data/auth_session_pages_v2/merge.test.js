import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("auth_session_pages_v2", () => {
  describe("base behaviors", () => {
    it("all three pages import useAuth from @/utils/useAuth", () => {
      const logout = readResolved("apps/web/src/app/account/logout/page.jsx");
      const signin = readResolved("apps/web/src/app/account/signin/page.jsx");
      const signup = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(logout).toMatch(/@\/utils\/useAuth/);
      expect(signin).toMatch(/@\/utils\/useAuth/);
      expect(signup).toMatch(/@\/utils\/useAuth/);
    });

    it("signin page has form with email and password inputs", () => {
      const src = readResolved("apps/web/src/app/account/signin/page.jsx");
      expect(src).toMatch(/type=["']email["']/);
      expect(src).toMatch(/type=["']password["']/);
    });

    it("signup page has form with email and password inputs", () => {
      const src = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(src).toMatch(/type=["']email["']/);
      expect(src).toMatch(/type=["']password["']/);
    });
  });

  describe("ours behaviors", () => {
    it("all three pages use named export default function (not MainComponent)", () => {
      const logout = readResolved("apps/web/src/app/account/logout/page.jsx");
      const signin = readResolved("apps/web/src/app/account/signin/page.jsx");
      const signup = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(logout).toMatch(/export\s+default\s+function\s+LogoutPage/);
      expect(signin).toMatch(/export\s+default\s+function\s+SignInPage/);
      expect(signup).toMatch(/export\s+default\s+function\s+SignUpPage/);
    });

    it("logout page has loading and error state", () => {
      const src = readResolved("apps/web/src/app/account/logout/page.jsx");
      expect(src).toMatch(/loading/);
      expect(src).toMatch(/setLoading/);
      expect(src).toMatch(/error/);
      expect(src).toMatch(/setError/);
    });

    it("logout page wraps signOut in try/catch", () => {
      const src = readResolved("apps/web/src/app/account/logout/page.jsx");
      expect(src).toMatch(/try\s*\{/);
      expect(src).toMatch(/catch\s*\(/);
      expect(src).toMatch(/console\.error/);
    });

    it("logout page shows error message and disabled state", () => {
      const src = readResolved("apps/web/src/app/account/logout/page.jsx");
      expect(src).toMatch(/Could not sign out/);
      expect(src).toMatch(/disabled/);
    });

    it("logout page shows 'Signing out' loading text", () => {
      const src = readResolved("apps/web/src/app/account/logout/page.jsx");
      expect(src).toMatch(/Signing out/);
    });

    it("logout page has 'Back to app' link to /", () => {
      const src = readResolved("apps/web/src/app/account/logout/page.jsx");
      expect(src).toMatch(/Back to app/);
      expect(src).toMatch(/href=["']\/["']/);
    });

    it("signin page trims email before validation", () => {
      const src = readResolved("apps/web/src/app/account/signin/page.jsx");
      expect(src).toMatch(/\.trim\(\)/);
      expect(src).toMatch(/safeEmail/);
    });

    it("signin page has CredentialsSignin error mapping", () => {
      const src = readResolved("apps/web/src/app/account/signin/page.jsx");
      expect(src).toMatch(/CredentialsSignin/);
      expect(src).toMatch(/Incorrect email or password/);
    });

    it("signin page has 'FIRE OPS' branding text", () => {
      const src = readResolved("apps/web/src/app/account/signin/page.jsx");
      expect(src).toMatch(/FIRE OPS/);
    });

    it("signup page has fullName field with autoComplete='name'", () => {
      const src = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(src).toMatch(/fullName/);
      expect(src).toMatch(/autoComplete=["']name["']/);
    });

    it("signup page passes name to signUpWithCredentials", () => {
      const src = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(src).toMatch(/name:\s*safeName/);
    });

    it("signin page links to signup preserving query string", () => {
      const src = readResolved("apps/web/src/app/account/signin/page.jsx");
      expect(src).toMatch(/\/account\/signup/);
      expect(src).toMatch(/linkSuffix/);
    });

    it("signup page links to signin preserving query string", () => {
      const src = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(src).toMatch(/\/account\/signin/);
      expect(src).toMatch(/linkSuffix/);
    });
  });

  describe("theirs behaviors", () => {
    it("resolved version does not use MainComponent export pattern from theirs", () => {
      const logout = readResolved("apps/web/src/app/account/logout/page.jsx");
      const signin = readResolved("apps/web/src/app/account/signin/page.jsx");
      const signup = readResolved("apps/web/src/app/account/signup/page.jsx");
      expect(logout).not.toMatch(/function\s+MainComponent/);
      expect(signin).not.toMatch(/function\s+MainComponent/);
      expect(signup).not.toMatch(/function\s+MainComponent/);
    });
  });
});
