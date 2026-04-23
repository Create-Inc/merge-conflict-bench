import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("recurring_plan_modal", () => {
  describe("base behaviors", () => {
    it("useCustomerRecurringPlan hook returns upsertMutation", () => {
      const src = readResolved(
        "apps/mobile/src/hooks/useCustomerRecurringPlan.js",
      );
      expect(src).toMatch(
        /export\s+function\s+useCustomerRecurringPlan/,
      );
      expect(src).toMatch(/upsertMutation/);
    });

    it("useCustomerRecurringPlan posts to /api/customers/:id/recurring", () => {
      const src = readResolved(
        "apps/mobile/src/hooks/useCustomerRecurringPlan.js",
      );
      expect(src).toMatch(/\/api\/customers\/.*\/recurring/);
      expect(src).toMatch(/method:\s*["']POST["']/);
    });

    it("useCustomerRecurringPlan invalidates customer and scheduleJobs queries on success", () => {
      const src = readResolved(
        "apps/mobile/src/hooks/useCustomerRecurringPlan.js",
      );
      expect(src).toMatch(/invalidateQueries/);
      expect(src).toMatch(/["']customer["']/);
      expect(src).toMatch(/["']scheduleJobs["']/);
    });

    it("RecurringPlanModal exports a default component", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/export\s+default\s+function\s+RecurringPlanModal/);
    });

    it("RecurringPlanModal supports cadence options of 3, 6, 12 months", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/\[3,\s*6,\s*12\]/);
    });

    it("RecurringPlanModal supports AM/PM slot selection", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/["']am["']/);
      expect(src).toMatch(/["']pm["']/);
    });

    it("recurringPlans.js exports ensureRecurringJobsForAccount", () => {
      const src = readResolved("apps/web/src/app/api/utils/recurringPlans.js");
      expect(src).toMatch(
        /export\s+async\s+function\s+ensureRecurringJobsForAccount/,
      );
    });
  });

  describe("ours behaviors", () => {
    it("RecurringPlanModal supports tech assignment (canAssignTech prop)", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/canAssignTech/);
      expect(src).toMatch(/assignedTechId/);
      expect(src).toMatch(/techOptions/);
    });

    it("RecurringPlanModal has day-of-week selection with DOW_LABELS", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/DOW_LABELS/);
      expect(src).toMatch(/Sun/);
      expect(src).toMatch(/Mon/);
      expect(src).toMatch(/Sat/);
    });

    it("RecurringPlanModal has shiftDay and setSlotAndTime callbacks", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/shiftDay/);
      expect(src).toMatch(/setSlotAndTime/);
    });

    it("RecurringPlanModal includes preferred_day_of_week and assigned_tech_id in save payload", () => {
      const src = readResolved(
        "apps/mobile/src/components/Customers/RecurringPlanModal.jsx",
      );
      expect(src).toMatch(/preferred_day_of_week/);
      expect(src).toMatch(/assigned_tech_id/);
    });
  });

  describe("theirs behaviors", () => {
    it("recurringPlans.js has addMonths helper that handles month overflow", () => {
      const src = readResolved("apps/web/src/app/api/utils/recurringPlans.js");
      expect(src).toMatch(/function\s+addMonths/);
      // Handles overflow by checking if day changed
      expect(src).toMatch(/d\.getDate\(\)\s*!==\s*day/);
      expect(src).toMatch(/d\.setDate\(0\)/);
    });

    it("recurringPlans.js has computeNextOccurrence that validates cadence is 3, 6, or 12", () => {
      const src = readResolved("apps/web/src/app/api/utils/recurringPlans.js");
      expect(src).toMatch(/function\s+computeNextOccurrence/);
      expect(src).toMatch(/\[3,\s*6,\s*12\]\.includes\(cadence\)/);
    });

    it("recurringPlans.js ensureJobsForPlan inserts jobs with ON CONFLICT DO NOTHING", () => {
      const src = readResolved("apps/web/src/app/api/utils/recurringPlans.js");
      expect(src).toMatch(/ON CONFLICT DO NOTHING/);
    });

    it("recurringPlans.js updates next_run_at and last_ensured_at on the plan", () => {
      const src = readResolved("apps/web/src/app/api/utils/recurringPlans.js");
      expect(src).toMatch(/next_run_at/);
      expect(src).toMatch(/last_ensured_at/);
    });

    it("recurringPlans.js ensureRecurringJobsForAccount only processes active plans not ensured in last 6 hours", () => {
      const src = readResolved("apps/web/src/app/api/utils/recurringPlans.js");
      expect(src).toMatch(/status\s*=\s*['"]active['"]/);
      expect(src).toMatch(/6 hours/);
    });

    it("useCustomerRecurringPlan mutationFn accepts destructured payload with default", () => {
      const src = readResolved(
        "apps/mobile/src/hooks/useCustomerRecurringPlan.js",
      );
      // The theirs version uses = {} default for destructured param
      expect(src).toMatch(/\{\s*payload\s*\}\s*=\s*\{\}/);
    });
  });
});
