import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Read resolved source files as text
// ---------------------------------------------------------------------------
const resolvedBase = join(__dirname, "resolved", "apps", "web", "src");

const switcherSrc = readFileSync(
  join(resolvedBase, "components", "OrganizationSwitcher.jsx"),
  "utf8",
);
const platformAdminSrc = readFileSync(
  join(resolvedBase, "app", "settings", "hooks", "usePlatformAdmin.js"),
  "utf8",
);
const deleteRouteSrc = readFileSync(
  join(resolvedBase, "app", "api", "admin", "organizations", "delete", "route.js"),
  "utf8",
);

// ---------------------------------------------------------------------------
// Mock deps for delete route
// ---------------------------------------------------------------------------
const sqlMock = vi.fn();
const authMock = vi.fn();
const isPlatformAdminMock = vi.fn();
const logAuditMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/app/api/utils/organization", () => ({
  isPlatformAdmin: isPlatformAdminMock,
}));
vi.mock("@/app/api/utils/audit", () => ({ logAudit: logAuditMock }));

const deleteMod = await import(
  "./resolved/apps/web/src/app/api/admin/organizations/delete/route.js"
);

function makeRequest(body, queryParams = {}) {
  const url = new URL("http://localhost/api/admin/organizations/delete");
  for (const [k, v] of Object.entries(queryParams)) {
    url.searchParams.set(k, v);
  }
  return {
    url: url.toString(),
    json: () => Promise.resolve(body),
    headers: {
      get: (key) => null,
    },
  };
}

async function json(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  sqlMock.mockReset();
  authMock.mockResolvedValue({ user: { id: "admin-1" } });
  isPlatformAdminMock.mockResolvedValue(true);
  logAuditMock.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Extract normalizeOrgName from delete route for direct testing
// ---------------------------------------------------------------------------
let normalizeOrgName = null;
{
  const fnMatch = deleteRouteSrc.match(
    /function\s+normalizeOrgName\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/,
  );
  if (fnMatch) {
    try {
      normalizeOrgName = new Function("name", fnMatch[1]);
    } catch {
      // leave null
    }
  }
}

describe("org_switcher merge resolution", () => {
  // =========================================================================
  // No conflict markers
  // =========================================================================
  describe("no conflict markers", () => {
    for (const [name, src] of [
      ["OrganizationSwitcher.jsx", switcherSrc],
      ["usePlatformAdmin.js", platformAdminSrc],
      ["delete/route.js", deleteRouteSrc],
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
    // -- OrganizationSwitcher --
    it("OrganizationSwitcher is a client component", () => {
      expect(switcherSrc).toMatch(/["']use client["']/);
    });

    it("OrganizationSwitcher exports a default function", () => {
      expect(switcherSrc).toMatch(
        /export\s+default\s+function\s+OrganizationSwitcher/,
      );
    });

    it("OrganizationSwitcher fetches /api/organizations/list", () => {
      expect(switcherSrc).toMatch(/\/api\/organizations\/list/);
    });

    it("OrganizationSwitcher tracks currentOrgId state", () => {
      expect(switcherSrc).toMatch(/currentOrgId/);
      expect(switcherSrc).toMatch(/setCurrentOrgId/);
    });

    it("OrganizationSwitcher persists selection to localStorage", () => {
      expect(switcherSrc).toMatch(/platformAdmin\.selectedOrgId/);
      expect(switcherSrc).toMatch(/localStorage\.setItem/);
      expect(switcherSrc).toMatch(/localStorage\.removeItem/);
    });

    it("OrganizationSwitcher reads org from URL param organizationId", () => {
      expect(switcherSrc).toMatch(/organizationId/);
      expect(switcherSrc).toMatch(/URLSearchParams/);
    });

    it("OrganizationSwitcher falls back to stored selection when URL lacks org param", () => {
      expect(switcherSrc).toMatch(/localStorage\.getItem/);
      expect(switcherSrc).toMatch(/platformAdmin\.selectedOrgId/);
    });

    it("OrganizationSwitcher defaults to null (My Organization) when no valid selection", () => {
      expect(switcherSrc).toMatch(/setCurrentOrgId\(null\)/);
      expect(switcherSrc).toMatch(/My Organization/);
    });

    it("OrganizationSwitcher has switchOrganization function that navigates", () => {
      expect(switcherSrc).toMatch(/function\s+switchOrganization/);
      expect(switcherSrc).toMatch(/window\.location\.href\s*=/);
    });

    it("OrganizationSwitcher clears lfms_branding_self when deselecting org", () => {
      expect(switcherSrc).toMatch(/lfms_branding_self/);
    });

    it("OrganizationSwitcher renders loading/non-admin as null", () => {
      expect(switcherSrc).toMatch(/return\s+null/);
    });

    it("OrganizationSwitcher detects dark mode from document class or media query", () => {
      expect(switcherSrc).toMatch(/prefers-color-scheme.*dark/);
      expect(switcherSrc).toMatch(/classList\.contains.*dark/);
    });

    it("OrganizationSwitcher renders dropdown with org list", () => {
      expect(switcherSrc).toMatch(/organizations\.map/);
      expect(switcherSrc).toMatch(/Switch Organization View/);
    });

    it("OrganizationSwitcher shows org stats (user_count, call_count, subscription_plan)", () => {
      expect(switcherSrc).toMatch(/user_count/);
      expect(switcherSrc).toMatch(/call_count/);
      expect(switcherSrc).toMatch(/subscription_plan/);
    });

    // -- usePlatformAdmin --
    it("usePlatformAdmin exports a named function hook", () => {
      expect(platformAdminSrc).toMatch(
        /export\s+function\s+usePlatformAdmin/,
      );
    });

    it("usePlatformAdmin manages org creation form state", () => {
      expect(platformAdminSrc).toMatch(/orgName/);
      expect(platformAdminSrc).toMatch(/adminName/);
      expect(platformAdminSrc).toMatch(/adminEmail/);
      expect(platformAdminSrc).toMatch(/plan/);
      expect(platformAdminSrc).toMatch(/complimentary/);
    });

    it("usePlatformAdmin handles organization deletion", () => {
      expect(platformAdminSrc).toMatch(/handleDeleteOrganization/);
      expect(platformAdminSrc).toMatch(/confirmOrgName/);
      expect(platformAdminSrc).toMatch(/confirmPhrase/);
    });

    it("usePlatformAdmin loads current org from /api/organizations/current", () => {
      expect(platformAdminSrc).toMatch(/\/api\/organizations\/current/);
    });

    it("usePlatformAdmin prefills form from URL params on mount", () => {
      expect(platformAdminSrc).toMatch(/params\.get.*orgName/s);
      expect(platformAdminSrc).toMatch(/params\.get.*adminEmail/s);
    });

    it("usePlatformAdmin clears localStorage on successful org deletion", () => {
      expect(platformAdminSrc).toMatch(/removeItem.*platformAdmin\.selectedOrgId/);
    });

    it("usePlatformAdmin redirects to /settings after deletion", () => {
      expect(platformAdminSrc).toMatch(/window\.location\.href\s*=\s*["']\/settings["']/);
    });

    // -- delete route --
    it("delete route exports a POST handler", () => {
      expect(deleteRouteSrc).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("delete route requires authentication", () => {
      expect(deleteRouteSrc).toMatch(/auth\(\)/);
      expect(deleteRouteSrc).toMatch(/Unauthorized/);
    });

    it("delete route requires platform admin", () => {
      expect(deleteRouteSrc).toMatch(/isPlatformAdmin/);
      expect(deleteRouteSrc).toMatch(/Forbidden/);
    });

    it("delete route accepts organizationId from body or query string", () => {
      expect(deleteRouteSrc).toMatch(/body\?\.organizationId/);
      expect(deleteRouteSrc).toMatch(/qsOrgId/);
    });

    it("delete route validates organizationId is a number", () => {
      expect(deleteRouteSrc).toMatch(/parseInt/);
      expect(deleteRouteSrc).toMatch(/Number\.isNaN/);
    });

    it("delete route looks up org in database", () => {
      expect(deleteRouteSrc).toMatch(/SELECT.*FROM organizations WHERE id/s);
    });

    it("delete route returns 404 when org not found", () => {
      expect(deleteRouteSrc).toMatch(/Organization not found/);
      expect(deleteRouteSrc).toMatch(/404/);
    });

    it("delete route logs an audit trail before deletion", () => {
      expect(deleteRouteSrc).toMatch(/logAudit/);
      expect(deleteRouteSrc).toMatch(/delete_organization/);
    });

    it("delete route executes DELETE FROM organizations", () => {
      expect(deleteRouteSrc).toMatch(/DELETE FROM organizations WHERE id/);
    });

    it("delete route has a normalizeOrgName function", () => {
      expect(deleteRouteSrc).toMatch(/function\s+normalizeOrgName/);
    });
  });

  // =========================================================================
  // OURS behaviors
  // =========================================================================
  describe("ours behaviors", () => {
    // -- OrganizationSwitcher: Number.isFinite validation on URL param --
    it("OrganizationSwitcher validates URL orgParam with Number.isFinite (ours)", () => {
      expect(switcherSrc).toMatch(/Number\.isFinite\(orgIdFromUrl\)/);
    });

    it("OrganizationSwitcher validates stored org with Number.isFinite and > 0 (ours)", () => {
      expect(switcherSrc).toMatch(/Number\.isFinite\(parsed\)/);
      expect(switcherSrc).toMatch(/parsed\s*>\s*0/);
    });

    it("OrganizationSwitcher restores org to URL via window.location.replace when missing from URL (ours)", () => {
      expect(switcherSrc).toMatch(/window\.location\.replace/);
    });

    // -- usePlatformAdmin: getEffectiveSearch with URL sync (ours) --
    it("usePlatformAdmin has getEffectiveSearch helper that falls back to stored org (ours)", () => {
      expect(platformAdminSrc).toMatch(/getEffectiveSearch/);
    });

    it("usePlatformAdmin updates URL via history.replaceState when org param missing (ours)", () => {
      expect(platformAdminSrc).toMatch(/window\.history\.replaceState/);
    });

    // -- delete route: normalizeOrgName uses .normalize('NFKC') (ours) --
    it("normalizeOrgName uses Unicode NFKC normalization (ours)", () => {
      expect(deleteRouteSrc).toMatch(/\.normalize\(["']NFKC["']\)/);
    });

    it("normalizeOrgName collapses whitespace via replace (ours)", () => {
      expect(deleteRouteSrc).toMatch(/\.replace\(\/\\s\+\/g,\s*["'] ["']\)/);
    });
  });

  // =========================================================================
  // THEIRS behaviors
  // =========================================================================
  describe("theirs behaviors", () => {
    // -- OrganizationSwitcher: safe optional chaining on org.id --
    it("OrganizationSwitcher uses optional chaining org?.id for safety (theirs)", () => {
      expect(switcherSrc).toMatch(/org\?\.id/);
    });

    it("OrganizationSwitcher uses String(org?.id) as key for map (theirs)", () => {
      expect(switcherSrc).toMatch(/key=\{String\(org\?\.id\)\}/);
    });

    // -- delete route: normalizeOrgName uses toLowerCase (theirs) --
    it("normalizeOrgName uses toLowerCase for case-insensitive comparison (theirs)", () => {
      expect(deleteRouteSrc).toMatch(/\.toLowerCase\(\)/);
    });

    // -- delete route: combined name AND phrase check in single condition (theirs) --
    it("delete route checks both name match AND phrase in a single condition (theirs)", () => {
      expect(deleteRouteSrc).toMatch(
        /confirmName\s*!==\s*expectedName\s*\|\|\s*confirmPhrase\s*!==\s*["']DELETE["']/,
      );
    });

    // -- delete route: error message includes 'Name or phrase did not match' (theirs) --
    it("delete route error message references name or phrase mismatch (theirs)", () => {
      expect(deleteRouteSrc).toMatch(/Name or phrase did not match/);
    });

    // -- usePlatformAdmin: theirs had a fallback to stored org in loadCurrentOrg --
    it("usePlatformAdmin falls back to stored org when URL has no organizationId (theirs)", () => {
      expect(platformAdminSrc).toMatch(/platformAdmin\.selectedOrgId/);
      // The fetch URL should include the stored org as a query param
      expect(platformAdminSrc).toMatch(/organizationId/);
    });
  });

  // =========================================================================
  // Delete route functional tests
  // =========================================================================
  describe("delete route functional tests", () => {
    it("returns 401 when not authenticated", async () => {
      authMock.mockResolvedValue({ user: null });
      const res = await deleteMod.POST(
        makeRequest({ organizationId: 1, confirmName: "Test", confirmPhrase: "DELETE" }),
      );
      expect(res.status).toBe(401);
    });

    it("returns 403 when not a platform admin", async () => {
      isPlatformAdminMock.mockResolvedValue(false);
      const res = await deleteMod.POST(
        makeRequest({ organizationId: 1, confirmName: "Test", confirmPhrase: "DELETE" }),
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 when organizationId is missing", async () => {
      const res = await deleteMod.POST(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/organizationId/);
    });

    it("returns 400 when confirmName or confirmPhrase is missing", async () => {
      const res = await deleteMod.POST(
        makeRequest({ organizationId: 1 }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/confirmName|confirmPhrase/);
    });

    it("returns 404 when organization does not exist", async () => {
      sqlMock.mockResolvedValueOnce([]); // SELECT returns nothing
      const res = await deleteMod.POST(
        makeRequest({
          organizationId: 999,
          confirmName: "Test",
          confirmPhrase: "DELETE",
        }),
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when confirmPhrase is not DELETE", async () => {
      sqlMock.mockResolvedValueOnce([{ id: 1, name: "Test Org" }]);
      const res = await deleteMod.POST(
        makeRequest({
          organizationId: 1,
          confirmName: "Test Org",
          confirmPhrase: "REMOVE",
        }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when confirmName does not match org name (normalized)", async () => {
      sqlMock.mockResolvedValueOnce([{ id: 1, name: "Test Org" }]);
      const res = await deleteMod.POST(
        makeRequest({
          organizationId: 1,
          confirmName: "Wrong Name",
          confirmPhrase: "DELETE",
        }),
      );
      expect(res.status).toBe(400);
    });

    it("succeeds when name and phrase match (case-insensitive name)", async () => {
      sqlMock.mockResolvedValueOnce([{ id: 1, name: "Test Org" }]); // SELECT
      sqlMock.mockResolvedValueOnce(undefined); // DELETE

      const res = await deleteMod.POST(
        makeRequest({
          organizationId: 1,
          confirmName: "test  org", // extra space, different case
          confirmPhrase: "delete", // lowercase
        }),
      );
      expect(res.status).toBe(200);
      const body = await json(res);
      expect(body.success).toBe(true);
    });

    it("calls logAudit before deletion", async () => {
      sqlMock.mockResolvedValueOnce([{ id: 1, name: "Org" }]);
      sqlMock.mockResolvedValueOnce(undefined);

      await deleteMod.POST(
        makeRequest({
          organizationId: 1,
          confirmName: "org",
          confirmPhrase: "DELETE",
        }),
      );

      expect(logAuditMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "delete_organization",
          entityId: 1,
        }),
      );
    });

    it("accepts organizationId from query string as fallback", async () => {
      sqlMock.mockResolvedValueOnce([{ id: 5, name: "QS Org" }]);
      sqlMock.mockResolvedValueOnce(undefined);

      const res = await deleteMod.POST(
        makeRequest(
          { confirmName: "qs org", confirmPhrase: "DELETE" },
          { organizationId: "5" },
        ),
      );
      expect(res.status).toBe(200);
    });
  });

  // =========================================================================
  // normalizeOrgName functional tests
  // =========================================================================
  if (normalizeOrgName) {
    describe("normalizeOrgName functional tests", () => {
      it("trims and collapses whitespace", () => {
        const result = normalizeOrgName("  Hello   World  ");
        expect(result).toMatch(/hello world/i);
        expect(result).not.toMatch(/\s{2,}/);
      });

      it("returns empty string for null/undefined", () => {
        expect(normalizeOrgName(null)).toBe("");
        expect(normalizeOrgName(undefined)).toBe("");
      });

      it("lowercases the result (theirs behavior)", () => {
        const result = normalizeOrgName("TestOrg");
        expect(result).toBe(result.toLowerCase());
      });
    });
  }
});
