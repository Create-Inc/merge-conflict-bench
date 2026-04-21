import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Utility: read a resolved file as text for structural assertions
// ---------------------------------------------------------------------------
function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

// ---------------------------------------------------------------------------
// Mock dependencies used by the API route
// ---------------------------------------------------------------------------
const sqlMock = vi.fn();
const requireCompanyUserMock = vi.fn();
const getStaffUserMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => {
  const tagged = (...args) => sqlMock(...args);
  tagged.default = tagged;
  // Support tagged template: sql`...`
  return { default: tagged };
});
vi.mock("@/app/api/utils/company-context", () => ({
  requireCompanyUser: requireCompanyUserMock,
  getStaffUser: getStaffUserMock,
}));

// ---------------------------------------------------------------------------
// Import the resolved API route handlers
// ---------------------------------------------------------------------------
const { GET, PUT } = await import(
  "./resolved/apps/web/src/app/api/settings/legal-compliance/route.js"
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body) {
  return { json: () => Promise.resolve(body) };
}

async function json(response) {
  return response.json();
}

function gateOk() {
  requireCompanyUserMock.mockResolvedValue({
    ok: true,
    ctx: {
      company: { id: 42 },
      isSuperAdmin: true,
    },
  });
  getStaffUserMock.mockResolvedValue({
    id: 1,
    permission_level: "Admin",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// API ROUTE TESTS
// =====================================================================
describe("GET /api/settings/legal-compliance", () => {
  describe("base behaviors", () => {
    it("returns 403 when requireCompanyUser rejects", async () => {
      requireCompanyUserMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Forbidden" }, { status: 403 }),
      });

      const res = await GET();
      expect(res.status).toBe(403);
    });

    it("returns consent fields in the response", async () => {
      gateOk();
      // Mock company_settings table creation + consent query + doc settings query
      sqlMock.mockResolvedValue([]);

      const res = await GET();
      const body = await json(res);

      expect(body).toHaveProperty("eula_accepted");
      expect(body).toHaveProperty("sms_consent_accepted");
    });
  });

  describe("theirs behaviors: nested documents object", () => {
    it("returns a documents object with eula_document_url and sms_document_url", async () => {
      gateOk();
      sqlMock.mockResolvedValue([]);

      const res = await GET();
      const body = await json(res);

      expect(body).toHaveProperty("documents");
      expect(body.documents).toHaveProperty("eula_document_url");
      expect(body.documents).toHaveProperty("sms_document_url");
    });

    it("returns legal_sites_eula_url and legal_sms_opt_in_url flat fields", async () => {
      gateOk();
      sqlMock.mockResolvedValue([]);

      const res = await GET();
      const body = await json(res);

      expect(body).toHaveProperty("legal_sites_eula_url");
      expect(body).toHaveProperty("legal_sms_opt_in_url");
    });
  });

  describe("ours behaviors: sites_eula_url and sms_opt_in_url flat fields", () => {
    it("returns sites_eula_url and sms_opt_in_url flat fields for backward compat", async () => {
      gateOk();
      sqlMock.mockResolvedValue([]);

      const res = await GET();
      const body = await json(res);

      // The resolved code should expose these flat fields for ours-branch compat
      expect(body).toHaveProperty("sites_eula_url");
      expect(body).toHaveProperty("sms_opt_in_url");
    });
  });
});

describe("PUT /api/settings/legal-compliance", () => {
  describe("base behaviors", () => {
    it("returns 403 when requireCompanyUser rejects", async () => {
      requireCompanyUserMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Forbidden" }, { status: 403 }),
      });

      const res = await PUT(makeRequest({}));
      expect(res.status).toBe(403);
    });
  });

  describe("theirs behaviors: normalizeOptionalUrl validation", () => {
    it("source includes normalizeOptionalUrl function for URL validation", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/function normalizeOptionalUrl/);
      expect(src).toMatch(/must start with http:\/\/ or https:\/\//);
    });

    it("accepts multiple naming conventions for EULA URL in PUT body", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/legal_sites_eula_url/);
      expect(src).toMatch(/eula_document_url/);
    });

    it("accepts multiple naming conventions for SMS URL in PUT body", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/legal_sms_opt_in_url/);
      expect(src).toMatch(/sms_document_url/);
    });

    it("includes saveCompanyDocSetting function", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/function saveCompanyDocSetting/);
      // undefined => skip, null => clear, string => save
      expect(src).toMatch(
        /normalizedValue\s*===\s*undefined/,
      );
      expect(src).toMatch(/normalizedValue\s*===\s*null/);
    });

    it("has getCompanyDocSettings that reads from company_settings table", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/function getCompanyDocSettings/);
      expect(src).toMatch(/company_settings/);
    });

    it("returns documents object in PUT response", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      // The PUT response should also include the documents nesting
      expect(src).toMatch(/documents:\s*\{/);
      expect(src).toMatch(/eula_document_url:/);
      expect(src).toMatch(/sms_document_url:/);
    });
  });

  describe("ours behaviors: sites_eula_url and sms_opt_in_url accepted in PUT", () => {
    it("accepts sites_eula_url naming from ours branch in PUT body", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/sites_eula_url/);
    });

    it("accepts sms_opt_in_url naming from ours branch in PUT body", () => {
      const src = readResolved(
        "apps/web/src/app/api/settings/legal-compliance/route.js",
      );
      expect(src).toMatch(/sms_opt_in_url/);
    });
  });
});

// =====================================================================
// PAGE COMPONENT TESTS
// =====================================================================
describe("LegalComplianceSettingsPage (source structure)", () => {
  const pageSrc = readResolved(
    "apps/web/src/app/settings/legal-compliance/page.jsx",
  );

  describe("base behaviors", () => {
    it("exports a default function for the page", () => {
      expect(pageSrc).toMatch(
        /export\s+default\s+function\s+LegalComplianceSettingsPage/,
      );
    });

    it("renders the AgreementCard component for Sites EULA", () => {
      expect(pageSrc).toMatch(/Sites EULA/);
    });

    it("renders the AgreementCard component for SMS agreement", () => {
      expect(pageSrc).toMatch(/SMS.*Opt-In Agreement/i);
    });

    it("has a Back to Settings link", () => {
      expect(pageSrc).toMatch(/Back to Settings/);
    });

    it("has an onAcceptEula callback that checks canManage", () => {
      expect(pageSrc).toMatch(/onAcceptEula/);
      expect(pageSrc).toMatch(/canManage/);
    });

    it("has an onAcceptSms callback", () => {
      expect(pageSrc).toMatch(/onAcceptSms/);
    });

    it("renders AuthProtection wrapper", () => {
      expect(pageSrc).toMatch(/AuthProtection/);
    });
  });

  describe("theirs behaviors: document URL section with Document Vault reference", () => {
    it("has the Agreement documents (optional) heading", () => {
      expect(pageSrc).toMatch(/Agreement documents \(optional\)/);
    });

    it("includes saveDocsMutation for saving document links", () => {
      expect(pageSrc).toMatch(/saveDocsMutation/);
    });

    it("has input fields for Sites EULA document URL and SMS agreement document URL", () => {
      expect(pageSrc).toMatch(/Sites EULA document URL/);
      expect(pageSrc).toMatch(/SMS agreement document URL/);
    });

    it("renders onSaveDocuments callback", () => {
      expect(pageSrc).toMatch(/onSaveDocuments/);
    });

    it("shows eula doc notice when docUrlEula is available", () => {
      expect(pageSrc).toMatch(/docUrlEula/);
    });

    it("shows sms doc notice when docUrlSms is available", () => {
      expect(pageSrc).toMatch(/docUrlSms/);
    });

    it("reads from documents.eula_document_url and fallbacks to legal_sites_eula_url", () => {
      expect(pageSrc).toMatch(/documents\?\.eula_document_url/);
      expect(pageSrc).toMatch(/legal_sites_eula_url/);
    });
  });

  describe("ours behaviors: docInputsTouched to prevent clobbering edits", () => {
    it("tracks docInputsTouched state to prevent clobbering user edits", () => {
      expect(pageSrc).toMatch(/docInputsTouched/);
    });

    it("sets docInputsTouched on input change", () => {
      expect(pageSrc).toMatch(/setDocInputsTouched\(true\)/);
    });

    it("skips hydration when docInputsTouched is true", () => {
      // Guard clause: don't clobber while typing
      expect(pageSrc).toMatch(/docInputsTouched/);
    });

    it("tracks hasDocChanges to enable/disable save button", () => {
      expect(pageSrc).toMatch(/hasDocChanges/);
    });
  });
});
