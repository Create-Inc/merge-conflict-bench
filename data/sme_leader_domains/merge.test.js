import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("sme_leader_domains", () => {
  describe("base behaviors", () => {
    it("domain-assignments route exports GET and PATCH handlers", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
      expect(src).toMatch(/export\s+async\s+function\s+PATCH/);
    });

    it("domain-assignments GET returns items from domain_sme_assignments table", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      expect(src).toMatch(/domain_sme_assignments/);
      expect(src).toMatch(/items/);
    });

    it("domain-assignments PATCH with empty assigned_sme_user_id deletes the assignment rule", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      expect(src).toMatch(/DELETE\s+FROM\s+domain_sme_assignments/);
    });

    it("domain-assignments PATCH upserts assignment via INSERT ON CONFLICT", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      expect(src).toMatch(/ON\s+CONFLICT[\s\S]*?DO\s+UPDATE/);
    });

    it("domain-assignments PATCH auto-reassigns tickets_v2 on upsert", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      expect(src).toMatch(/UPDATE\s+tickets_v2/);
      expect(src).toMatch(/assignment_method\s*=\s*'auto'/);
    });

    it("domain-assignments PATCH unassigns tickets when rule is removed", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      expect(src).toMatch(/assigned_sme_user_id\s*=\s*NULL/);
      expect(src).toMatch(/assignment_method\s*=\s*'manual'/);
    });

    it("domains route exports GET, POST, PATCH, DELETE handlers", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
      expect(src).toMatch(/export\s+async\s+function\s+PATCH/);
      expect(src).toMatch(/export\s+async\s+function\s+DELETE/);
    });

    it("domains route defines BASE_DOMAINS including Datacenter, IT, Software, Network, Storage, Cybersecurity", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      expect(src).toMatch(/BASE_DOMAINS/);
      expect(src).toMatch(/Datacenter/);
      expect(src).toMatch(/Cybersecurity/);
    });

    it("domains route rejects base domain names in POST and PATCH", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      expect(src).toMatch(/isBaseDomain/);
      expect(src).toMatch(/already exists as a base domain/);
    });

    it("domains route validates domain_name length <= 80", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      expect(src).toMatch(/80 characters or less/);
    });

    it("domains POST returns 409 for unique constraint violations", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      expect(src).toMatch(/409/);
      expect(src).toMatch(/Domain already exists/);
    });

    it("smes route exports GET handler", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/smes/route.js",
      );
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
    });

    it("smes route queries org_memberships with msp_sme role filter", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/smes/route.js",
      );
      expect(src).toMatch(/org_memberships/);
      expect(src).toMatch(/msp_sme/);
    });
  });

  describe("ours behaviors", () => {
    it("all routes use requireLeaderOrAdmin helper that allows platform admins", () => {
      const assignments = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      const domains = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      const smes = readResolved(
        "apps/web/src/app/api/v2/sme-leader/smes/route.js",
      );
      expect(assignments).toMatch(/function\s+requireLeaderOrAdmin/);
      expect(assignments).toMatch(/isPlatformAdmin/);
      expect(domains).toMatch(/function\s+requireLeaderOrAdmin/);
      expect(smes).toMatch(/function\s+requireLeaderOrAdmin/);
    });

    it("all routes use safeTrim in error responses for 500 errors", () => {
      const assignments = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      const domains = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      const smes = readResolved(
        "apps/web/src/app/api/v2/sme-leader/smes/route.js",
      );
      // safeTrim should be used to sanitize error messages
      expect(assignments).toMatch(/safeTrim\(error\?\.message\)/);
      expect(domains).toMatch(/safeTrim\(error\?\.message\)/);
      expect(smes).toMatch(/safeTrim\(error\?\.message\)/);
    });

    it("smes route imports safeTrim from authz", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/smes/route.js",
      );
      expect(src).toMatch(/safeTrim/);
    });

    it("domains route uses safeTrim for error fallback in 500 responses", () => {
      const src = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      // Should use safeTrim or fallback pattern, not raw error.message
      expect(src).toMatch(
        /safeTrim\(error\?\.message\)\s*\|\|\s*["']Internal server error["']/,
      );
    });
  });

  describe("theirs behaviors", () => {
    it("all routes check Platform Admin must set x-org-id (from both branches)", () => {
      const assignments = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domain-assignments/route.js",
      );
      const domains = readResolved(
        "apps/web/src/app/api/v2/sme-leader/domains/route.js",
      );
      const smes = readResolved(
        "apps/web/src/app/api/v2/sme-leader/smes/route.js",
      );
      expect(assignments).toMatch(/Platform Admin must set x-org-id/);
      expect(domains).toMatch(/Platform Admin must set x-org-id/);
      expect(smes).toMatch(/Platform Admin must set x-org-id/);
    });
  });
});
