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
// Mock dependencies used by the API routes
// ---------------------------------------------------------------------------
const sqlMock = vi.fn();
const requirePermissionMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/rbac", () => ({
  requirePermission: requirePermissionMock,
  PERMISSIONS: { MANAGE_PRODUCTS: "manage_products" },
}));

// ---------------------------------------------------------------------------
// Import the resolved route handlers
// ---------------------------------------------------------------------------
const previewMod = await import(
  "./resolved/apps/web/src/app/api/admin/products/bulk-status/preview/route.js"
);
const applyMod = await import(
  "./resolved/apps/web/src/app/api/admin/products/bulk-status/route.js"
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

beforeEach(() => {
  vi.clearAllMocks();
});

// =====================================================================
// PREVIEW ROUTE TESTS
// =====================================================================
describe("POST /api/admin/products/bulk-status/preview", () => {
  describe("base behaviors", () => {
    it("returns permission error when user lacks MANAGE_PRODUCTS", async () => {
      requirePermissionMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Forbidden" }, { status: 403 }),
      });

      const res = await previewMod.POST(
        makeRequest({ product_ids: [1], target: "active" }),
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid target status", async () => {
      requirePermissionMock.mockResolvedValue({ ok: true, userId: 1 });

      const res = await previewMod.POST(
        makeRequest({ product_ids: [1], target: "invalid_status" }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/invalid target/i);
    });

    it("returns 400 when no product ids provided", async () => {
      requirePermissionMock.mockResolvedValue({ ok: true, userId: 1 });

      const res = await previewMod.POST(
        makeRequest({ product_ids: [], target: "active" }),
      );
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/no product/i);
    });
  });

  describe("theirs behaviors: legacy alias 'hidden' accepted", () => {
    it("includes 'hidden' in ALLOWED_TARGETS", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/preview/route.js",
      );
      expect(src).toMatch(/["']hidden["']/);
    });

    it("normalizeTarget maps 'hidden' to 'draft'", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/preview/route.js",
      );
      expect(src).toMatch(/hidden.*draft/s);
    });

    it("normalizeTarget maps 'pending' to 'pending_review'", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/preview/route.js",
      );
      expect(src).toMatch(/pending.*pending_review/s);
    });

    it("currentStatus uses normalizeTarget for status normalization", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/preview/route.js",
      );
      // currentStatus should use normalizeTarget when converting raw product_status
      expect(src).toMatch(/function currentStatus/);
      expect(src).toMatch(/normalizeTarget/);
    });
  });
});

// =====================================================================
// APPLY ROUTE TESTS
// =====================================================================
describe("POST /api/admin/products/bulk-status (apply)", () => {
  describe("base behaviors", () => {
    it("returns permission error when user lacks MANAGE_PRODUCTS", async () => {
      requirePermissionMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Forbidden" }, { status: 403 }),
      });

      const res = await applyMod.POST(
        makeRequest({ product_ids: [1], target: "active" }),
      );
      expect(res.status).toBe(403);
    });

    it("returns 400 for invalid target status", async () => {
      requirePermissionMock.mockResolvedValue({ ok: true, userId: 1 });

      const res = await applyMod.POST(
        makeRequest({ product_ids: [1], target: "garbage" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when no product ids provided", async () => {
      requirePermissionMock.mockResolvedValue({ ok: true, userId: 1 });

      const res = await applyMod.POST(
        makeRequest({ product_ids: [], target: "active" }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("theirs behaviors: hidden alias and normalizeTarget", () => {
    it("includes 'hidden' in ALLOWED_TARGETS for apply route", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      expect(src).toMatch(/["']hidden["']/);
    });

    it("uses normalizeTarget function", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      expect(src).toMatch(/function normalizeTarget/);
      expect(src).toMatch(/normalizeTarget\(rawTarget\)/);
    });

    it("uses COALESCE+NULLIF+BTRIM for product_status in SQL from_status CASE", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      // Theirs added more robust empty-string handling in SQL
      expect(src).toMatch(/COALESCE\(NULLIF\(BTRIM\(p\.product_status\)/);
    });
  });

  describe("mapTargetToFields", () => {
    it("maps active to is_active=true, pending_review=false", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      expect(src).toMatch(/function mapTargetToFields/);
      // active target should set is_active: true
      expect(src).toMatch(/active.*is_active:\s*true/s);
    });

    it("maps pending_review to is_active=false, pending_review=true", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      expect(src).toMatch(/pending_review.*pending_review:\s*true/s);
    });

    it("maps quarantine to is_active=false, pending_review=false", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      expect(src).toMatch(/quarantine.*is_active:\s*false/s);
    });

    it("defaults to draft with is_active=false, pending_review=false", () => {
      const src = readResolved(
        "apps/web/src/app/api/admin/products/bulk-status/route.js",
      );
      expect(src).toMatch(/product_status:\s*["']draft["']/);
    });
  });
});

// =====================================================================
// MODAL COMPONENT TESTS
// =====================================================================
describe("BulkStatusModal (source structure)", () => {
  const modalSrc = readResolved(
    "apps/web/src/components/AdminProducts/BulkStatusModal.jsx",
  );

  describe("base behaviors", () => {
    it("exports BulkStatusModal as default", () => {
      expect(modalSrc).toMatch(
        /export\s+default\s+function\s+BulkStatusModal/,
      );
    });

    it("includes all five standard STATUS_OPTIONS", () => {
      expect(modalSrc).toMatch(/value:\s*["']draft["']/);
      expect(modalSrc).toMatch(/value:\s*["']pending_review["']/);
      expect(modalSrc).toMatch(/value:\s*["']active["']/);
      expect(modalSrc).toMatch(/value:\s*["']inactive["']/);
      expect(modalSrc).toMatch(/value:\s*["']quarantine["']/);
    });

    it("has no duplicate STATUS_OPTIONS entries for pending_review", () => {
      // After merge, there should not be two pending_review entries
      const matches = modalSrc.match(/value:\s*["']pending_review["']/g);
      expect(matches).toHaveLength(1);
    });

    it("renders preview and apply buttons", () => {
      expect(modalSrc).toMatch(/Refresh preview/);
      expect(modalSrc).toMatch(/Apply/);
    });

    it("has a reason input field", () => {
      expect(modalSrc).toMatch(/Reason \(optional\)/);
    });

    it("clamps product IDs with a 20000 cap", () => {
      expect(modalSrc).toMatch(/20000/);
    });

    it("auto-previews when modal opens or target changes", () => {
      expect(modalSrc).toMatch(/isOpen, target/);
    });

    it("shows blocked and warnings panels in preview", () => {
      expect(modalSrc).toMatch(/Blocked/);
      expect(modalSrc).toMatch(/Warnings/);
    });
  });

  describe("theirs behaviors: confirmation table with product history", () => {
    it("queries confirmation history after successful apply via useQuery", () => {
      expect(modalSrc).toMatch(/confirmationQuery/);
      expect(modalSrc).toMatch(/adminProductHistoryByBulkOp/);
    });

    it("shows product history entries table in success state", () => {
      expect(modalSrc).toMatch(/Product history entries/);
    });

    it("renders table columns: History id, Product, Prior status, Changed at", () => {
      expect(modalSrc).toMatch(/History id/);
      expect(modalSrc).toMatch(/Product/);
      expect(modalSrc).toMatch(/Prior status/);
      expect(modalSrc).toMatch(/Changed at/);
    });

    it("includes a Copy button for bulk operation ID", () => {
      expect(modalSrc).toMatch(/navigator\.clipboard\.writeText/);
      expect(modalSrc).toMatch(/Copy/);
    });

    it("renders a Done button in success state in the footer", () => {
      expect(modalSrc).toMatch(/onDone\?\.\(success\)/);
      expect(modalSrc).toMatch(/Done/);
    });

    it("uses separate Done and Close buttons instead of a single dual-purpose button", () => {
      // Theirs pattern: conditional rendering of Done vs Close in footer
      expect(modalSrc).toMatch(/success\s*\?\s*\(/);
    });
  });

  describe("ours behaviors: bulkOperationId display", () => {
    it("shows bulk operation ID with font-mono styling", () => {
      expect(modalSrc).toMatch(/font-mono/);
      expect(modalSrc).toMatch(/bulk_operation_id/);
    });
  });
});
