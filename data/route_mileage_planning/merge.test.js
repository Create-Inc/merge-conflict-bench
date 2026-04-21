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
// Mock SQL + company-context + app-settings used by the API route
// ---------------------------------------------------------------------------
const sqlMock = vi.fn();
const requireCompanyUserMock = vi.fn();
const getStaffUserMock = vi.fn();
const ensureSettingsTableMock = vi.fn();
const getAppSettingMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/company-context", () => ({
  requireCompanyUser: requireCompanyUserMock,
  getStaffUser: getStaffUserMock,
}));
vi.mock("@/app/api/utils/app-settings", () => ({
  ensureSettingsTable: ensureSettingsTableMock,
  getAppSetting: getAppSettingMock,
}));

// ---------------------------------------------------------------------------
// Import the resolved API route handler
// ---------------------------------------------------------------------------
const { POST } = await import(
  "./resolved/apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js"
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

function defaultGateOk() {
  requireCompanyUserMock.mockResolvedValue({
    ok: true,
    ctx: { company: { id: 1 }, role: "Admin" },
  });
  getStaffUserMock.mockResolvedValue({ id: 10 });
  ensureSettingsTableMock.mockResolvedValue(undefined);
  getAppSettingMock.mockResolvedValue("123 Main St");
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.HEIGIT_API = "test-key";
});

// =====================================================================
// API ROUTE TESTS
// =====================================================================
describe("POST /api/splash-drive/estimate-plan-miles", () => {
  // =================================================================
  // BASE BEHAVIORS
  // =================================================================
  describe("base behaviors", () => {
    it("returns 403 when requireCompanyUser rejects", async () => {
      requireCompanyUserMock.mockResolvedValue({
        ok: false,
        response: Response.json({ error: "Unauthorized" }, { status: 403 }),
      });

      const res = await POST(makeRequest({ plan_id: 1 }));
      expect(res.status).toBe(403);
    });

    it("returns 403 for users without edit permission", async () => {
      requireCompanyUserMock.mockResolvedValue({
        ok: true,
        ctx: { company: { id: 1 }, role: "Viewer" },
      });

      const res = await POST(makeRequest({ plan_id: 1 }));
      expect(res.status).toBe(403);
      const body = await json(res);
      expect(body.error).toMatch(/forbidden/i);
    });

    it("returns 400 when plan_id is missing", async () => {
      defaultGateOk();
      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/plan_id/i);
    });

    it("returns 404 when plan is not found", async () => {
      defaultGateOk();
      // ensureMileageColumns calls sql
      sqlMock.mockResolvedValue([]);
      const res = await POST(makeRequest({ plan_id: 999 }));
      expect(res.status).toBe(404);
    });

    it("returns 400 when office address is not set", async () => {
      defaultGateOk();
      getAppSettingMock.mockResolvedValue(null);
      // plan found
      sqlMock
        .mockResolvedValueOnce(undefined) // ensureMileageColumns #1
        .mockResolvedValueOnce(undefined) // ensureMileageColumns #2
        .mockResolvedValueOnce(undefined) // ensureMileageColumns #3
        .mockResolvedValueOnce([{ id: 1, company_id: 1, status: "draft" }]); // getPlan

      const res = await POST(makeRequest({ plan_id: 1 }));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/office address/i);
    });

    it("clamps max_routes between 1 and 5", async () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      // Verify clamp logic exists
      expect(src).toMatch(/Math\.max\(1,\s*Math\.min\(5/);
    });
  });

  // =================================================================
  // THEIRS BEHAVIORS: mileage_status, mileage_error, skipped, too-many-stops
  // =================================================================
  describe("theirs behaviors", () => {
    it("uses mileage_status and mileage_error fields in proposed route output", async () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      // The resolved code should output mileage_status and mileage_error
      expect(src).toMatch(/mileage_status:\s*status/);
      expect(src).toMatch(/mileage_error:/);
    });

    it("has a normalizeMileageStatus function that maps to estimated/skipped/pending", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/function normalizeMileageStatus/);
      expect(src).toMatch(/"estimated"/);
      expect(src).toMatch(/"skipped"/);
      expect(src).toMatch(/"pending"/);
    });

    it("reports skipped_routes in response meta", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/skipped_routes/);
    });

    it("skips routes when normalizedStops + 1 > 50 (too many stops)", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/normalizedStops\.length\s*\+\s*1\s*>\s*50/);
      expect(src).toMatch(/Too many stops/);
    });

    it("has a markSkipped helper that sets mileage_status to skipped", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/markSkipped/);
      expect(src).toMatch(/mileage_status\s*=\s*'skipped'/);
    });

    it("has a markEstimated helper that sets mileage_status to estimated", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/markEstimated/);
      expect(src).toMatch(/mileage_status\s*=\s*'estimated'/);
    });

    it("filters remaining routes excluding skipped ones", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      // Remaining routes filter: must exclude skipped status
      expect(src).toMatch(
        /normalizeMileageStatus\(r\.mileage_status\)\s*!==\s*"skipped"/,
      );
    });

    it("calls ensureMileageColumns which adds mileage_status and mileage_error columns", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/ensureMileageColumns/);
      expect(src).toMatch(/ADD COLUMN IF NOT EXISTS mileage_status/);
      expect(src).toMatch(/ADD COLUMN IF NOT EXISTS mileage_error/);
    });
  });

  // =================================================================
  // OURS BEHAVIORS: truncateError, helper functions
  // =================================================================
  describe("ours behaviors", () => {
    it("has a truncateError function that truncates at 220 characters", () => {
      const src = readResolved(
        "apps/web/src/app/api/splash-drive/estimate-plan-miles/route.js",
      );
      expect(src).toMatch(/function truncateError/);
      expect(src).toMatch(/220/);
    });
  });
});

// =====================================================================
// HOOK TESTS: useSplashDrivePlanner
// =====================================================================
describe("useSplashDrivePlanner (source structure)", () => {
  const hookSrc = readResolved("apps/web/src/hooks/useSplashDrivePlanner.js");

  describe("theirs behaviors: mileage_status and milesSkippedRoutes", () => {
    it("normalizes route with mileage_status and mileage_error properties", () => {
      expect(hookSrc).toMatch(/mileage_status:\s*route\.mileage_status/);
      expect(hookSrc).toMatch(/mileage_error:\s*route\.mileage_error/);
    });

    it("tracks milesSkippedRoutes in proposedWeekSummary", () => {
      expect(hookSrc).toMatch(/milesSkippedRoutes/);
      // Skipped logic: routes with status === 'skipped'
      expect(hookSrc).toMatch(/status\s*===\s*["']skipped["']/);
    });

    it("returns milesSkippedRoutes from proposedWeekSummary (not milesFailedRoutes)", () => {
      expect(hookSrc).toMatch(/milesSkippedRoutes/);
      // Should NOT have the old ours-only field name
      expect(hookSrc).not.toMatch(/milesFailedRoutes/);
    });

    it("tracks milesSkippedRoutes per tech in proposedTotalsByTech", () => {
      // tech object initialization should include milesSkippedRoutes
      expect(hookSrc).toMatch(/milesSkippedRoutes:\s*0/);
    });

    it("computeClientRemaining filters by mileage_status not skipped", () => {
      // The computeClientRemaining function should check for skipped
      expect(hookSrc).toMatch(/mileage_status/);
      expect(hookSrc).toMatch(/skipped/);
    });
  });

  describe("base behaviors", () => {
    it("exports useSplashDrivePlanner as a named export", () => {
      expect(hookSrc).toMatch(
        /export\s+function\s+useSplashDrivePlanner/,
      );
    });

    it("returns all expected fields from the hook", () => {
      expect(hookSrc).toMatch(/plannerError/);
      expect(hookSrc).toMatch(/weekStart/);
      expect(hookSrc).toMatch(/setWeekStart/);
      expect(hookSrc).toMatch(/estimateMiles/);
      expect(hookSrc).toMatch(/mileageEstimateState/);
      expect(hookSrc).toMatch(/onEstimateMilesNow/);
      expect(hookSrc).toMatch(/proposedWeekSummary/);
      expect(hookSrc).toMatch(/proposedScheduleByDay/);
      expect(hookSrc).toMatch(/proposedTotalsByTech/);
      expect(hookSrc).toMatch(/planCanBeApproved/);
    });

    it("runs a miles loop with a max of 60 iterations", () => {
      expect(hookSrc).toMatch(/loopCount\s*<\s*60/);
    });
  });
});

// =====================================================================
// COMPONENT TESTS: ProposedRoutesSection
// =====================================================================
describe("ProposedRoutesSection (source structure)", () => {
  const compSrc = readResolved(
    "apps/web/src/components/SplashDrive/ProposedRoutesSection.jsx",
  );

  describe("theirs behaviors: skipped routes in UI", () => {
    it("uses milesSkippedRoutes from proposedWeekSummary", () => {
      expect(compSrc).toMatch(/milesSkippedRoutes/);
    });

    it("shows status pills with mileage_status (skipped or pending)", () => {
      expect(compSrc).toMatch(/mileageStatus/);
      expect(compSrc).toMatch(/Miles skipped/);
      expect(compSrc).toMatch(/Miles pending/);
    });

    it("shows the skipped pill with red styling", () => {
      expect(compSrc).toMatch(/skipped.*bg-red/s);
    });

    it("shows mileage_error for skipped routes", () => {
      expect(compSrc).toMatch(/mileage_error/);
    });

    it("renders a note about skipped routes when partialMiles", () => {
      expect(compSrc).toMatch(/routes were skipped/);
    });
  });

  describe("ours behaviors: milesLabel with est. so far", () => {
    it("shows 'Travel miles (est. so far)' when some but not all miles estimated", () => {
      expect(compSrc).toMatch(/Travel miles \(est\. so far\)/);
    });
  });

  describe("base behaviors", () => {
    it("exports ProposedRoutesSection function", () => {
      expect(compSrc).toMatch(
        /export\s+function\s+ProposedRoutesSection/,
      );
    });

    it("renders all 7 weekday columns", () => {
      expect(compSrc).toMatch(/Mon/);
      expect(compSrc).toMatch(/Tue/);
      expect(compSrc).toMatch(/Wed/);
      expect(compSrc).toMatch(/Thu/);
      expect(compSrc).toMatch(/Fri/);
      expect(compSrc).toMatch(/Sat/);
      expect(compSrc).toMatch(/Sun/);
    });

    it("renders Estimate miles button", () => {
      expect(compSrc).toMatch(/Estimate miles/);
    });

    it("renders Print button", () => {
      expect(compSrc).toMatch(/Print/);
    });

    it("renders the Week totals by tech table", () => {
      expect(compSrc).toMatch(/Week totals by tech/);
    });
  });
});
