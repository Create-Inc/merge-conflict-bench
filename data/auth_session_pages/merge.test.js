import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("auth_session_pages", () => {
  describe("base behaviors", () => {
    it("all three pages import useAuth from @/utils/useAuth", () => {
      const logout = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      const signin = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      const signup = readResolved(
        "apps/web/src/app/account/signup/page.jsx",
      );
      expect(logout).toMatch(/@\/utils\/useAuth/);
      expect(signin).toMatch(/@\/utils\/useAuth/);
      expect(signup).toMatch(/@\/utils\/useAuth/);
    });

    it("signin page calls signInWithCredentials with email, password, callbackUrl, redirect", () => {
      const src = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      expect(src).toMatch(/signInWithCredentials/);
      expect(src).toMatch(/callbackUrl/);
      expect(src).toMatch(/redirect:\s*true/);
    });

    it("signup page calls signUpWithCredentials", () => {
      const src = readResolved(
        "apps/web/src/app/account/signup/page.jsx",
      );
      expect(src).toMatch(/signUpWithCredentials/);
    });

    it("logout page calls signOut with callbackUrl and redirect", () => {
      const src = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      expect(src).toMatch(/signOut/);
      expect(src).toMatch(/callbackUrl:\s*["']\/["']/);
      expect(src).toMatch(/redirect:\s*true/);
    });
  });

  describe("ours behaviors", () => {
    it("all three pages import designSystem from @/design-system", () => {
      const logout = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      const signin = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      const signup = readResolved(
        "apps/web/src/app/account/signup/page.jsx",
      );
      expect(logout).toMatch(/@\/design-system/);
      expect(signin).toMatch(/@\/design-system/);
      expect(signup).toMatch(/@\/design-system/);
    });

    it("all three pages use ds.colors and ds.shadows for styling", () => {
      const logout = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      const signin = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      const signup = readResolved(
        "apps/web/src/app/account/signup/page.jsx",
      );
      expect(logout).toMatch(/ds\.colors/);
      expect(logout).toMatch(/ds\.shadows/);
      expect(signin).toMatch(/ds\.colors/);
      expect(signup).toMatch(/ds\.colors/);
    });

    it("signin and signup pages use named export function (not MainComponent)", () => {
      const signin = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      const signup = readResolved(
        "apps/web/src/app/account/signup/page.jsx",
      );
      expect(signin).toMatch(/export\s+default\s+function\s+SignInPage/);
      expect(signup).toMatch(/export\s+default\s+function\s+SignUpPage/);
    });

    it("logout page uses named export function LogoutPage", () => {
      const src = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      expect(src).toMatch(/export\s+default\s+function\s+LogoutPage/);
    });

    it("logout page wraps signOut in try/catch with console.error", () => {
      const src = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      expect(src).toMatch(/try\s*\{/);
      expect(src).toMatch(/catch\s*\(/);
      expect(src).toMatch(/console\.error/);
    });

    it("signin page uses useMemo for callbackSearch", () => {
      const src = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      expect(src).toMatch(/useMemo/);
      expect(src).toMatch(/callbackSearch/);
    });

    it("signin page links to signup preserving query string via callbackSearch", () => {
      const src = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      expect(src).toMatch(/\/account\/signup/);
      expect(src).toMatch(/callbackSearch/);
    });

    it("signin page maps CredentialsSignin to 'Incorrect email or password. Try again.'", () => {
      const src = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      expect(src).toMatch(/CredentialsSignin/);
      expect(src).toMatch(/Incorrect email or password/);
    });

    it("all pages include Space Grotesk and Inter font import", () => {
      const logout = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      const signin = readResolved(
        "apps/web/src/app/account/signin/page.jsx",
      );
      const signup = readResolved(
        "apps/web/src/app/account/signup/page.jsx",
      );
      expect(logout).toMatch(/Space\+Grotesk/);
      expect(signin).toMatch(/Space\+Grotesk/);
      expect(signup).toMatch(/Space\+Grotesk/);
    });

    it("logout page has a 'Back to jobs' link pointing to /jobs", () => {
      const src = readResolved(
        "apps/web/src/app/account/logout/page.jsx",
      );
      expect(src).toMatch(/\/jobs/);
      expect(src).toMatch(/Back to jobs/);
    });
  });

  describe("theirs behaviors", () => {
    it("resolved version does not use MainComponent export pattern from theirs", () => {
      const logout = readResolved("apps/web/src/app/account/logout/page.jsx");
      const signin = readResolved("apps/web/src/app/account/signin/page.jsx");
      const signup = readResolved("apps/web/src/app/account/signup/page.jsx");
      // The theirs version used "function MainComponent" + "export default MainComponent"
      // The resolved version should NOT use that pattern
      expect(logout).not.toMatch(/function\s+MainComponent/);
      expect(signin).not.toMatch(/function\s+MainComponent/);
      expect(signup).not.toMatch(/function\s+MainComponent/);
    });
  });
});
