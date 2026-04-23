import { describe, it, expect, vi } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("matchmaking_user_helpers", () => {
  describe("base behaviors", () => {
    it("userHelpers exports getCompanyIdForUser that queries company_profiles then company_managers", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(/export\s+async\s+function\s+getCompanyIdForUser/);
      expect(src).toMatch(/company_profiles\s+WHERE\s+user_id/);
      expect(src).toMatch(/company_managers\s+WHERE\s+manager_user_id/);
    });

    it("userHelpers exports isSellerConnectedToAssignment with deal_ownership and external_sources checks", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(
        /export\s+async\s+function\s+isSellerConnectedToAssignment/,
      );
      expect(src).toMatch(/deal_ownership/);
      expect(src).toMatch(/external_sources/);
    });

    it("userHelpers exports canUserSeeExpiredAssignment checking admin, partner, seller, company, consultant roles", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(
        /export\s+async\s+function\s+canUserSeeExpiredAssignment/,
      );
      expect(src).toMatch(/roleSet\.has\(["']admin["']\)/);
      expect(src).toMatch(/roleSet\.has\(["']partner["']\)/);
      expect(src).toMatch(/roleSet\.has\(["']seller["']\)/);
      expect(src).toMatch(/roleSet\.has\(["']company["']\)/);
      expect(src).toMatch(/roleSet\.has\(["']consultant["']\)/);
    });

    it("route.js uses normalizeRole for POST role endpoint", () => {
      const src = readResolved("apps/web/src/app/api/users/route.js");
      expect(src).toMatch(/function\s+normalizeRole/);
      expect(src).toMatch(/ALLOWED_DASHBOARD_ROLES/);
      expect(src).toMatch(/normalizeRole\(body\?\.role\)/);
    });

    it("route.js POST validates role against ALLOWED_DASHBOARD_ROLES set", () => {
      const src = readResolved("apps/web/src/app/api/users/route.js");
      expect(src).toMatch(/ALLOWED_DASHBOARD_ROLES\.has\(role\)/);
      expect(src).toMatch(/Invalid role/);
    });
  });

  describe("ours behaviors", () => {
    it("normalizeRole maps plural aliases to singular in userHelpers", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(/function\s+normalizeRole/);
      // Must contain the plural-to-singular mappings
      expect(src).toMatch(/["']companies["']\)\s*return\s*["']company["']/);
      expect(src).toMatch(/["']partners["']\)\s*return\s*["']partner["']/);
      expect(src).toMatch(/["']sellers["']\)\s*return\s*["']seller["']/);
      expect(src).toMatch(/["']admins["']\)\s*return\s*["']admin["']/);
    });

    it("getUserRoleSet in userHelpers uses normalizeRole for mapping roles", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(/normalizeRole\(r\?\.role\)/);
    });

    it("route.js GET role endpoint uses normalizeRole for mapping explicit roles", () => {
      const src = readResolved("apps/web/src/app/api/users/route.js");
      // The GET role endpoint should use normalizeRole
      expect(src).toMatch(/normalizeRole\(r\?\.role\)/);
    });
  });

  describe("theirs behaviors", () => {
    it("getUserRoleSet in userHelpers derives roles from profile tables via transaction", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(/sql\.transaction/);
      expect(src).toMatch(/company_profiles\s+WHERE\s+user_id/);
      expect(src).toMatch(/partner_company_profiles\s+WHERE\s+user_id/);
      expect(src).toMatch(/seller_profiles\s+WHERE\s+user_id/);
      expect(src).toMatch(/consultant_profiles\s+WHERE\s+user_id/);
      expect(src).toMatch(/roleSet\.add\(["']company["']\)/);
      expect(src).toMatch(/roleSet\.add\(["']partner["']\)/);
      expect(src).toMatch(/roleSet\.add\(["']seller["']\)/);
      expect(src).toMatch(/roleSet\.add\(["']consultant["']\)/);
    });

    it("getUserRoleSet catches derived role lookup errors non-fatally", () => {
      const src = readResolved(
        "apps/web/src/app/api/matchmaking/utils/userHelpers.js",
      );
      expect(src).toMatch(/catch\s*\(/);
      expect(src).toMatch(/derived role lookup failed/);
    });

    it("route.js GET role endpoint also derives roles from profile tables", () => {
      const src = readResolved("apps/web/src/app/api/users/route.js");
      expect(src).toMatch(/sql\.transaction/);
      expect(src).toMatch(/roleSet\.add\(["']company["']\)/);
      expect(src).toMatch(/roleSet\.add\(["']partner["']\)/);
      expect(src).toMatch(/roleSet\.add\(["']seller["']\)/);
      expect(src).toMatch(/roleSet\.add\(["']consultant["']\)/);
    });

    it("route.js GET role endpoint returns Array.from(roleSet)", () => {
      const src = readResolved("apps/web/src/app/api/users/route.js");
      expect(src).toMatch(/Array\.from\(roleSet\)/);
    });
  });
});
