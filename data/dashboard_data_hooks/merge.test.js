import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const mobileDashSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/hooks/useDashboardData.js"),
  "utf-8"
);
const webDashSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/hooks/useDashboardData.js"),
  "utf-8"
);
const routeSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/api/dashboard-data/route.js"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("API route: preview for unauthenticated users", () => {
    it("returns preview accounts when no session exists", () => {
      expect(routeSrc).toMatch(/buildPreviewAccounts/);
      expect(routeSrc).toMatch(/preview/);
    });

    it("returns preview transactions for unauthenticated users", () => {
      expect(routeSrc).toMatch(/buildPreviewTransactions/);
    });

    it("preview accounts include Checking and Savings types", () => {
      expect(routeSrc).toMatch(/account_type.*Checking/);
      expect(routeSrc).toMatch(/account_type.*Savings/);
    });
  });

  describe("API route: session and identity resolution", () => {
    it("imports resolveSession", () => {
      expect(routeSrc).toMatch(/import.*resolveSession/);
    });

    it("imports resolveEffectiveUserIdentity", () => {
      expect(routeSrc).toMatch(/resolveEffectiveUserIdentity/);
    });

    it("returns 401 when identity is missing", () => {
      expect(routeSrc).toMatch(/Unauthorized/);
      expect(routeSrc).toMatch(/status:\s*401/);
    });
  });

  describe("API route: two-factor verification", () => {
    it("imports and calls requireTwoFactorVerified", () => {
      expect(routeSrc).toMatch(/import.*requireTwoFactorVerified/);
      expect(routeSrc).toMatch(/requireTwoFactorVerified\(/);
    });
  });

  describe("API route: ensureDefaultAccountsForUser", () => {
    it("creates Checking and Savings accounts for new users", () => {
      expect(routeSrc).toMatch(/Checking.*Personal/);
      expect(routeSrc).toMatch(/Savings.*Personal/);
    });

    it("retries up to 5 times on account_number collisions", () => {
      expect(routeSrc).toMatch(/attempt\s*<\s*5/);
    });
  });

  describe("API route: unfunded zeroing", () => {
    it("zeros balance for unfunded accounts", () => {
      expect(routeSrc).toMatch(/SET\s+balance\s*=\s*0/);
      expect(routeSrc).toMatch(/funded_by_admin\s+IS\s+NOT\s+TRUE/i);
    });
  });

  describe("API route: queries accounts, transactions, goals", () => {
    it("selects from accounts table", () => {
      expect(routeSrc).toMatch(/FROM\s+accounts/);
    });

    it("selects from transactions table with LIMIT 50", () => {
      expect(routeSrc).toMatch(/FROM\s+transactions/);
      expect(routeSrc).toMatch(/LIMIT\s+50/);
    });

    it("selects from goals table", () => {
      expect(routeSrc).toMatch(/FROM\s+goals/);
    });
  });

  describe("API route: error handling", () => {
    it("returns 500 with Internal Server Error message on catch", () => {
      expect(routeSrc).toMatch(/Internal Server Error/);
      expect(routeSrc).toMatch(/status:\s*500/);
    });
  });

  describe("API route: no-store cache headers", () => {
    it("sets cache-control to private, no-store", () => {
      expect(routeSrc).toMatch(/private,\s*no-store/);
    });

    it("sets x-anything-api header to dashboard-data", () => {
      expect(routeSrc).toMatch(/x-anything-api.*dashboard-data/);
    });
  });

  describe("mobile hook: retry logic", () => {
    it("implements retry logic for dashboard fetch", () => {
      expect(mobileDashSrc).toMatch(/shouldRetryDashboardFetch|retry/);
    });

    it("returns accounts, accountOptions, recentTransactions", () => {
      expect(mobileDashSrc).toMatch(/accounts/);
      expect(mobileDashSrc).toMatch(/accountOptions/);
      expect(mobileDashSrc).toMatch(/recentTransactions/);
    });
  });

  describe("web hook: bootstrap mutation", () => {
    it("posts to /api/bootstrap", () => {
      expect(webDashSrc).toMatch(/\/api\/bootstrap/);
      expect(webDashSrc).toMatch(/method:\s*["']POST["']/);
    });

    it("invalidates dashboard-data queries on success", () => {
      expect(webDashSrc).toMatch(/invalidateQueries.*dashboard-data/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("mobile hook: includes goals in query response", () => {
    it("parses goals from the API response", () => {
      expect(mobileDashSrc).toMatch(/goals/);
    });

    it("includes preview flag in return value", () => {
      expect(mobileDashSrc).toMatch(/preview.*Boolean/);
    });
  });

  describe("web hook: includes preview flag", () => {
    it("includes preview: Boolean(data?.preview) in returned data", () => {
      expect(webDashSrc).toMatch(/preview.*Boolean/);
    });
  });

  describe("web hook: validates all three data arrays", () => {
    it("logs console.error for unexpected accounts payload", () => {
      expect(webDashSrc).toMatch(/console\.error.*accounts/);
    });

    it("logs console.error for unexpected transactions payload", () => {
      expect(webDashSrc).toMatch(/console\.error.*transactions/);
    });

    it("logs console.error for unexpected goals payload", () => {
      expect(webDashSrc).toMatch(/console\.error.*goals/);
    });
  });

  describe("web hook: skips bootstrap when preview data", () => {
    it("checks for preview flag before triggering bootstrap", () => {
      expect(webDashSrc).toMatch(/preview/);
    });
  });

  describe("API route: admin debug endpoint", () => {
    it("imports isAdminEmail", () => {
      expect(routeSrc).toMatch(/import.*isAdminEmail/);
    });

    it("returns debug info when debug=1 and user is admin", () => {
      expect(routeSrc).toMatch(/debug/);
      expect(routeSrc).toMatch(/wantsDebug/);
    });
  });

  describe("web hook: invalidates accounts, transactions, goals on bootstrap", () => {
    it("invalidates accounts queries", () => {
      expect(webDashSrc).toMatch(/invalidateQueries.*accounts/);
    });

    it("invalidates transactions queries", () => {
      expect(webDashSrc).toMatch(/invalidateQueries.*transactions/);
    });

    it("invalidates goals queries", () => {
      expect(webDashSrc).toMatch(/invalidateQueries.*goals/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("API route: returns arrays defensively", () => {
    it("wraps return values with Array.isArray checks", () => {
      // Both sides do this, but theirs is more explicit about safe arrays
      expect(routeSrc).toMatch(/Array\.isArray/);
    });
  });

  describe("web hook: single endpoint comment pattern", () => {
    it("uses dashboard-data as single endpoint", () => {
      expect(webDashSrc).toMatch(/dashboard-data/);
    });
  });

  describe("no conflict markers in resolved files", () => {
    it("mobile hook has no conflict markers", () => {
      expect(mobileDashSrc).not.toMatch(/<<<<<<</);
    });

    it("web hook has no conflict markers", () => {
      expect(webDashSrc).not.toMatch(/<<<<<<</);
    });

    it("API route has no conflict markers", () => {
      expect(routeSrc).not.toMatch(/<<<<<<</);
    });
  });
});
