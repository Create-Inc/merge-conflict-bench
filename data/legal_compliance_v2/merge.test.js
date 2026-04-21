import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ── mock the imports the route file uses ────────────────────────────
const sqlMock = vi.fn();
const requireCompanyUserMock = vi.fn();
const getStaffUserMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/company-context", () => ({
  requireCompanyUser: requireCompanyUserMock,
  getStaffUser: getStaffUserMock,
}));

const routeMod = await import(
  "./resolved/apps/web/src/app/api/settings/legal-compliance/route.js"
);
const { GET, PUT } = routeMod;

// Read the page source as text for structural assertions
const pageSource = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/settings/legal-compliance/page.jsx"),
  "utf-8",
);

// Read the route source as text for structural assertions
const routeSource = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/settings/legal-compliance/route.js",
  ),
  "utf-8",
);

// ── helpers ──────────────────────────────────────────────────────────
function makeRequest(body) {
  return {
    json: () => Promise.resolve(body),
  };
}

async function json(response) {
  return response.json();
}

function setupAdminGate(companyId = 1, staffUserId = 42) {
  requireCompanyUserMock.mockResolvedValue({
    ok: true,
    ctx: {
      company: { id: companyId },
      isSuperAdmin: true,
    },
  });
  getStaffUserMock.mockResolvedValue({
    id: staffUserId,
    permission_level: "Admin",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("GET - auth gating", () => {
    it("returns gate.response when requireCompanyUser rejects", async () => {
      requireCompanyUserMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Forbidden" }, { status: 403 }),
      });

      const res = await GET();
      expect(res.status).toBe(403);
    });
  });

  describe("GET - returns consent fields", () => {
    it("returns eula_accepted and sms_consent_accepted booleans", async () => {
      setupAdminGate();
      // The resolved code calls sql many times:
      // 1. ensureCompanySettingsTable (CREATE TABLE)
      // 2. SELECT from company_settings
      // 3. SELECT from legal_consents
      // Use a default that returns [] for all, then check the response shape
      const consentRow = {
        eula_accepted: true,
        eula_accepted_at: "2026-01-01T00:00:00Z",
        eula_accepted_by_user_id: 42,
        sms_consent_accepted: false,
        sms_consent_accepted_at: null,
        sms_consent_accepted_by_user_id: null,
      };
      // Mock all sql calls: default to empty, but return consent row for
      // the legal_consents query.
      sqlMock.mockImplementation((...args) => {
        const q = String(args[0] || "");
        if (q.includes("legal_consents")) return Promise.resolve([consentRow]);
        return Promise.resolve([]);
      });

      const res = await GET();
      const body = await json(res);
      expect(body.eula_accepted).toBe(true);
      expect(body.sms_consent_accepted).toBe(false);
    });
  });

  describe("PUT - auth gating", () => {
    it("returns gate.response when requireCompanyUser rejects", async () => {
      requireCompanyUserMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await PUT(makeRequest({}));
      expect(res.status).toBe(401);
    });
  });

  describe("PUT - nothing to update returns 400", () => {
    it("returns 400 when no consent or doc update is provided", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValue([]);

      const res = await PUT(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/nothing to update/i);
    });
  });

  describe("PUT - eula acceptance", () => {
    it("accepts eula and returns success", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValue([]);
      // The resolved code may make many sql calls; just default them all to []
      sqlMock.mockResolvedValue([]);

      const res = await PUT(makeRequest({ eula_accepted: true }));
      const body = await json(res);
      expect(body.success).toBe(true);
    });
  });

  describe("company_settings table", () => {
    it("route source defines ensureCompanySettingsTable that creates the table", () => {
      expect(routeSource).toMatch(/CREATE TABLE IF NOT EXISTS company_settings/);
      expect(routeSource).toMatch(/company_id\s+bigint\s+NOT NULL/);
      expect(routeSource).toMatch(/PRIMARY KEY\s*\(company_id,\s*key\)/);
    });
  });

  describe("page - AgreementCard component exists", () => {
    it("defines AgreementCard component", () => {
      expect(pageSource).toMatch(/function\s+AgreementCard\s*\(/);
    });

    it("renders EULA and SMS agreement cards", () => {
      expect(pageSource).toMatch(/Sites EULA/);
      expect(pageSource).toMatch(/SMS.*Opt-In Agreement/i);
    });
  });

  describe("page - canManage authorization logic", () => {
    it("checks isSuperAdmin, Admin permission, Company Owner, and Admin role", () => {
      expect(pageSource).toMatch(/isSuperAdmin/);
      expect(pageSource).toMatch(/permissionLevel\s*===\s*["']Admin["']/);
      expect(pageSource).toMatch(/role\s*===\s*["']Company Owner["']/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the "ours" branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("PUT - accepts document URLs via ours-style field names", () => {
    it("accepts legal_sites_eula_url and legal_sms_opt_in_url in PUT body", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValue([]);

      const res = await PUT(
        makeRequest({
          legal_sites_eula_url: "https://example.com/eula.pdf",
          legal_sms_opt_in_url: "https://example.com/sms.pdf",
        }),
      );
      const body = await json(res);
      expect(body.success).toBe(true);
    });
  });

  describe("GET response includes flat doc URL fields", () => {
    it("returns legal_sites_eula_url and legal_sms_opt_in_url at top level", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValueOnce([
        { key: "legal_sites_eula_url", value: "https://example.com/eula.pdf" },
        {
          key: "legal_sms_opt_in_url",
          value: "https://example.com/sms.pdf",
        },
      ]);
      sqlMock.mockResolvedValue([]);

      const res = await GET();
      const body = await json(res);
      // The resolved version should expose the flat fields
      expect(body).toHaveProperty("legal_sites_eula_url");
      expect(body).toHaveProperty("legal_sms_opt_in_url");
    });
  });

  describe("route - URL validation rejects non-http URLs", () => {
    it("the route source validates URLs start with http:// or https://", () => {
      expect(routeSource).toMatch(/https?:\/\//);
    });
  });

  describe("route - saving URLs uses upsert (ON CONFLICT)", () => {
    it("route source contains ON CONFLICT...DO UPDATE for company_settings", () => {
      expect(routeSource).toMatch(/ON CONFLICT.*DO UPDATE/s);
    });
  });

  describe("route - clearing a URL deletes the setting", () => {
    it("route source contains DELETE FROM company_settings logic", () => {
      expect(routeSource).toMatch(/DELETE FROM company_settings/);
    });
  });

  describe("page - document links section exists", () => {
    it("has EULA document URL input", () => {
      expect(pageSource).toMatch(/EULA document URL/i);
    });

    it("has SMS agreement document URL input", () => {
      expect(pageSource).toMatch(/SMS.*document URL/i);
    });

    it("has a Save document links button", () => {
      expect(pageSource).toMatch(/Save document links/);
    });
  });

  describe("page - docSave disabled when not canManage", () => {
    it("page source has disabled logic involving canManage for doc save", () => {
      // The doc save button should be disabled when !canManage
      expect(pageSource).toMatch(/!canManage/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the "theirs" branch)
// =====================================================================
describe("theirs behaviors", () => {
  describe("GET response includes nested documents object", () => {
    it("returns documents.eula_document_url and documents.sms_document_url", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValueOnce([
        { key: "legal_sites_eula_url", value: "https://example.com/eula.pdf" },
        {
          key: "legal_sms_opt_in_url",
          value: "https://example.com/sms.pdf",
        },
      ]);
      sqlMock.mockResolvedValue([]);

      const res = await GET();
      const body = await json(res);
      expect(body.documents).toBeDefined();
      expect(body.documents).toHaveProperty("eula_document_url");
      expect(body.documents).toHaveProperty("sms_document_url");
    });
  });

  describe("PUT response includes nested documents object", () => {
    it("returns documents in PUT response", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValue([]);

      const res = await PUT(makeRequest({ eula_accepted: true }));
      const body = await json(res);
      expect(body.documents).toBeDefined();
      expect(body.documents).toHaveProperty("eula_document_url");
      expect(body.documents).toHaveProperty("sms_document_url");
    });
  });

  describe("PUT - accepts document URLs via theirs-style field names", () => {
    it("accepts eula_document_url and sms_document_url in PUT body", async () => {
      setupAdminGate();
      sqlMock.mockResolvedValue([]);

      const res = await PUT(
        makeRequest({
          eula_document_url: "https://example.com/eula.pdf",
          sms_document_url: "https://example.com/sms.pdf",
        }),
      );
      const body = await json(res);
      expect(body.success).toBe(true);
    });
  });

  describe("page - uses documents.eula_document_url from server data", () => {
    it("page references data?.documents?.eula_document_url", () => {
      expect(pageSource).toMatch(/documents\?\.eula_document_url/);
    });

    it("page references data?.documents?.sms_document_url", () => {
      expect(pageSource).toMatch(/documents\?\.sms_document_url/);
    });
  });

  describe("page - AgreementCard receives docUrl prop from documents", () => {
    it("passes docUrl prop to AgreementCard", () => {
      expect(pageSource).toMatch(/docUrl=/);
    });
  });

  describe("page - document section has Link2 icon", () => {
    it("imports Link2 from lucide-react", () => {
      expect(pageSource).toMatch(/Link2/);
    });
  });
});
