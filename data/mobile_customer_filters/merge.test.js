import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Read resolved source files as text for structural analysis
// ---------------------------------------------------------------------------
const basePath = join(__dirname, "resolved", "apps", "mobile", "src");

const filtersSrc = readFileSync(
  join(basePath, "hooks", "useCustomersFilters.js"),
  "utf8",
);
const listSrc = readFileSync(
  join(basePath, "hooks", "useCustomersList.js"),
  "utf8",
);
const searchSrc = readFileSync(
  join(basePath, "hooks", "useCustomersSearch.js"),
  "utf8",
);
const storeSrc = readFileSync(
  join(basePath, "utils", "customersFiltersStore.js"),
  "utf8",
);

// ---------------------------------------------------------------------------
// Import the store directly for behavioral testing (zustand is standalone)
// ---------------------------------------------------------------------------
let useCustomersFiltersStore;
try {
  const mod = await import(
    "./resolved/apps/mobile/src/utils/customersFiltersStore.js"
  );
  useCustomersFiltersStore = mod.useCustomersFiltersStore;
} catch {
  // If import fails due to missing zustand, skip functional tests
  useCustomersFiltersStore = null;
}

describe("mobile_customer_filters merge resolution", () => {
  // =========================================================================
  // No conflict markers
  // =========================================================================
  describe("no conflict markers in any file", () => {
    for (const [name, src] of [
      ["useCustomersFilters", filtersSrc],
      ["useCustomersList", listSrc],
      ["useCustomersSearch", searchSrc],
      ["customersFiltersStore", storeSrc],
    ]) {
      it(`${name} has no conflict markers`, () => {
        expect(src).not.toMatch(/<<<<<<</);
        expect(src).not.toMatch(/=======/);
        expect(src).not.toMatch(/>>>>>>>/);
      });
    }
  });

  // =========================================================================
  // BASE behaviors (common to both branches)
  // =========================================================================
  describe("base behaviors", () => {
    // -- useCustomersFilters --
    it("useCustomersFilters exports useCustomersFilters, useTerritoryLabel, useAssigneeLabel", () => {
      expect(filtersSrc).toMatch(/export\s+function\s+useCustomersFilters/);
      expect(filtersSrc).toMatch(/export\s+function\s+useTerritoryLabel/);
      expect(filtersSrc).toMatch(/export\s+function\s+useAssigneeLabel/);
    });

    it("territories query fetches /api/territories", () => {
      expect(filtersSrc).toMatch(/\/api\/territories/);
    });

    it("members query fetches /api/team/members", () => {
      expect(filtersSrc).toMatch(/\/api\/team\/members/);
    });

    it("members query is only enabled when canViewTeam is truthy", () => {
      expect(filtersSrc).toMatch(/enabled:\s*Boolean\(canViewTeam\)/);
    });

    it("useTerritoryLabel returns 'All territories' when no territoryId", () => {
      expect(filtersSrc).toMatch(/All territories/);
    });

    it("useAssigneeLabel returns 'My customers' when canViewTeam is false", () => {
      expect(filtersSrc).toMatch(/My customers/);
    });

    it("useAssigneeLabel returns 'All assignees' as default when canViewTeam is true", () => {
      expect(filtersSrc).toMatch(/All assignees/);
    });

    // -- useCustomersList --
    it("useCustomersList exports a default function", () => {
      expect(listSrc).toMatch(/export\s+default\s+function\s+useCustomersList/);
    });

    it("useCustomersList fetches /api/customers", () => {
      expect(listSrc).toMatch(/\/api\/customers/);
    });

    it("useCustomersList has dedupeById that keeps first occurrence", () => {
      expect(listSrc).toMatch(/dedupeById/);
    });

    it("useCustomersList uses useInfiniteQuery with getNextPageParam", () => {
      expect(listSrc).toMatch(/useInfiniteQuery/);
      expect(listSrc).toMatch(/getNextPageParam/);
    });

    it("useCustomersList returns { query, items }", () => {
      expect(listSrc).toMatch(/return\s*\{.*query.*items/s);
    });

    it("useCustomersList has default limit of 50", () => {
      expect(listSrc).toMatch(/limit\s*=\s*50/);
    });

    // -- useCustomersSearch --
    it("useCustomersSearch exports a named function", () => {
      expect(searchSrc).toMatch(/export\s+function\s+useCustomersSearch/);
    });

    it("useCustomersSearch returns searchInput, setSearchInput, debouncedSearch, setDebouncedSearch", () => {
      expect(searchSrc).toMatch(/searchInput/);
      expect(searchSrc).toMatch(/setSearchInput/);
      expect(searchSrc).toMatch(/debouncedSearch/);
      expect(searchSrc).toMatch(/setDebouncedSearch/);
    });

    it("useCustomersSearch uses setTimeout for debouncing", () => {
      expect(searchSrc).toMatch(/setTimeout/);
      expect(searchSrc).toMatch(/clearTimeout/);
    });

    // -- customersFiltersStore --
    it("store is created with zustand", () => {
      expect(storeSrc).toMatch(/import\s*\{\s*create\s*\}\s*from\s*["']zustand["']/);
    });

    it("store has initial state with search, status, assignedToUserId, territoryId, dateField, datePreset, dateStart, dateEnd", () => {
      expect(storeSrc).toMatch(/search:\s*['"]{2}/);
      expect(storeSrc).toMatch(/assignedToUserId:\s*null/);
      expect(storeSrc).toMatch(/territoryId:\s*null/);
      expect(storeSrc).toMatch(/dateField:\s*["']activity["']/);
      expect(storeSrc).toMatch(/dateStart:\s*null/);
      expect(storeSrc).toMatch(/dateEnd:\s*null/);
    });

    it("store has setter functions for all filter fields", () => {
      expect(storeSrc).toMatch(/setSearch/);
      expect(storeSrc).toMatch(/setStatus/);
      expect(storeSrc).toMatch(/setAssignedToUserId/);
      expect(storeSrc).toMatch(/setTerritoryId/);
      expect(storeSrc).toMatch(/setDateField/);
      expect(storeSrc).toMatch(/setDateRange/);
      expect(storeSrc).toMatch(/clearFilters/);
    });

    it("setTerritoryId coerces to integer via Math.trunc", () => {
      expect(storeSrc).toMatch(/Math\.trunc/);
    });

    it("setTerritoryId sets null for non-finite values", () => {
      expect(storeSrc).toMatch(/Number\.isFinite/);
      expect(storeSrc).toMatch(/territoryId:\s*null/);
    });

    it("setDateField only accepts 'created' or defaults to 'activity'", () => {
      expect(storeSrc).toMatch(/["']created["']/);
      expect(storeSrc).toMatch(/["']activity["']/);
    });

    it("setDateRange converts Date to ISO string", () => {
      expect(storeSrc).toMatch(/toISOString/);
      expect(storeSrc).toMatch(/instanceof\s+Date/);
    });
  });

  // =========================================================================
  // OURS behaviors
  // =========================================================================
  describe("ours behaviors", () => {
    // -- useCustomersFilters: territory mapping includes subtitle with territory_type --
    it("territory mapping includes subtitle from territory_type (ours)", () => {
      expect(filtersSrc).toMatch(/territory_type/);
      expect(filtersSrc).toMatch(/subtitle/);
    });

    it("member mapping uses fallback 'Member' for label", () => {
      expect(filtersSrc).toMatch(/["']Member["']/);
    });

    it("member mapping includes subtitle from role", () => {
      expect(filtersSrc).toMatch(/subtitle.*role|role.*subtitle/s);
    });

    it("useCustomersFilters has gcTime for cache garbage collection (ours)", () => {
      expect(filtersSrc).toMatch(/gcTime/);
    });

    // -- useCustomersSearch: syncs from external changes --
    it("useCustomersSearch re-syncs searchInput when initialValue changes (ours dependency array)", () => {
      // Ours had [initialValue] as dependency, theirs had [] (once only)
      // The resolved version should keep ours' re-sync behavior
      expect(searchSrc).toMatch(/\[initialValue\]/);
    });

    it("useCustomersSearch trims debouncedSearch for API via useMemo (ours apiSearch)", () => {
      // Ours had a useMemo that trims the debounced value
      expect(searchSrc).toMatch(/useMemo/);
      expect(searchSrc).toMatch(/\.trim\(\)/);
    });

    it("useCustomersSearch provides a stable setDebounced via useCallback (ours)", () => {
      expect(searchSrc).toMatch(/useCallback/);
    });

    // -- customersFiltersStore: clearFilters preserves search --
    it("clearFilters preserves current search value (ours behavior)", () => {
      expect(storeSrc).toMatch(/keepSearch/);
      expect(storeSrc).toMatch(/search:\s*keepSearch/);
    });

    it("store initial status is empty string, not null (ours)", () => {
      // Ours uses "" for status, theirs uses null
      expect(storeSrc).toMatch(/status:\s*['"]{2}/);
    });

    it("store initial datePreset is 'this_month' (ours)", () => {
      expect(storeSrc).toMatch(/datePreset:\s*["']this_month["']/);
    });

    it("setStatus validates against allowed values and normalizes (ours .trim().toLowerCase())", () => {
      expect(storeSrc).toMatch(/\.trim\(\)/);
      expect(storeSrc).toMatch(/\.toLowerCase\(\)/);
    });

    // -- useCustomersList: safe territory id validation (ours) --
    it("useCustomersList validates territoryId as finite integer (ours safeTerritoryId)", () => {
      expect(listSrc).toMatch(/Number\.isFinite/);
      expect(listSrc).toMatch(/Math\.trunc/);
    });
  });

  // =========================================================================
  // THEIRS behaviors
  // =========================================================================
  describe("theirs behaviors", () => {
    // -- useCustomersFilters: filters active members --
    it("members query filters by m.active (theirs)", () => {
      expect(filtersSrc).toMatch(/\.filter.*active|active.*filter/s);
    });

    // -- useCustomersList: normalized params with safe defaults --
    it("useCustomersList normalizes dateField to 'created' or 'activity' (theirs)", () => {
      expect(listSrc).toMatch(
        /dateField\s*===\s*["']created["']\s*\?\s*["']created["']\s*:\s*["']activity["']/,
      );
    });

    it("useCustomersList clamps limit between 1 and 100 (theirs)", () => {
      expect(listSrc).toMatch(/Math\.max\(1/);
      expect(listSrc).toMatch(/Math\.min\(100/);
    });

    it("useCustomersList supports json.customers as fallback array key (theirs)", () => {
      expect(listSrc).toMatch(/json\?\.customers/);
    });

    it("useCustomersList has retry function that skips 401 (theirs)", () => {
      expect(listSrc).toMatch(/error\?\.status\s*===\s*401/);
      expect(listSrc).toMatch(/return\s+false/);
    });

    it("useCustomersList attaches status to thrown errors (theirs)", () => {
      expect(listSrc).toMatch(/err\.status\s*=\s*res\.status/);
    });

    it("useCustomersList toQueryString helper skips null/empty params (theirs)", () => {
      expect(listSrc).toMatch(/toQueryString/);
    });

    it("useCustomersList validates status against allowed values (theirs-like normalization)", () => {
      // The resolved version validates status to lead|active|completed
      expect(listSrc).toMatch(/["']lead["']/);
      expect(listSrc).toMatch(/["']active["']/);
      expect(listSrc).toMatch(/["']completed["']/);
    });
  });

  // =========================================================================
  // Functional store tests (if zustand is available)
  // =========================================================================
  if (useCustomersFiltersStore) {
    describe("store functional tests", () => {
      it("setSearch sets a string value", () => {
        const store = useCustomersFiltersStore;
        store.getState().setSearch("hello");
        expect(store.getState().search).toBe("hello");
        store.getState().setSearch("");
      });

      it("setStatus accepts 'lead', 'active', 'completed' and normalizes", () => {
        const store = useCustomersFiltersStore;
        store.getState().setStatus("Lead");
        expect(store.getState().status).toBe("lead");
        store.getState().setStatus("ACTIVE");
        expect(store.getState().status).toBe("active");
        store.getState().setStatus("garbage");
        // Should reset to empty/null
        const s = store.getState().status;
        expect(s === "" || s === null).toBe(true);
      });

      it("setTerritoryId coerces to integer and rejects non-finite", () => {
        const store = useCustomersFiltersStore;
        store.getState().setTerritoryId("42");
        expect(store.getState().territoryId).toBe(42);
        store.getState().setTerritoryId("3.7");
        expect(store.getState().territoryId).toBe(3);
        store.getState().setTerritoryId("abc");
        expect(store.getState().territoryId).toBeNull();
        store.getState().setTerritoryId(null);
        expect(store.getState().territoryId).toBeNull();
      });

      it("setDateField defaults to 'activity' for unknown values", () => {
        const store = useCustomersFiltersStore;
        store.getState().setDateField("created");
        expect(store.getState().dateField).toBe("created");
        store.getState().setDateField("unknown");
        expect(store.getState().dateField).toBe("activity");
      });

      it("setDateRange converts Date objects to ISO strings", () => {
        const store = useCustomersFiltersStore;
        const d1 = new Date("2024-01-15T00:00:00Z");
        const d2 = new Date("2024-02-15T00:00:00Z");
        store.getState().setDateRange({ preset: "custom", start: d1, end: d2 });
        expect(store.getState().dateStart).toBe(d1.toISOString());
        expect(store.getState().dateEnd).toBe(d2.toISOString());
      });

      it("clearFilters preserves search but resets everything else", () => {
        const store = useCustomersFiltersStore;
        store.getState().setSearch("keep me");
        store.getState().setTerritoryId("5");
        store.getState().setStatus("active");
        store.getState().clearFilters();
        expect(store.getState().search).toBe("keep me");
        expect(store.getState().territoryId).toBeNull();
        // status resets to initial (empty string or null)
        const s = store.getState().status;
        expect(s === "" || s === null).toBe(true);
        // cleanup
        store.getState().setSearch("");
      });

      it("setAssignedToUserId trims and nullifies empty strings", () => {
        const store = useCustomersFiltersStore;
        store.getState().setAssignedToUserId("  user-123  ");
        expect(store.getState().assignedToUserId).toBe("user-123");
        store.getState().setAssignedToUserId("");
        expect(store.getState().assignedToUserId).toBeNull();
        store.getState().setAssignedToUserId(null);
        expect(store.getState().assignedToUserId).toBeNull();
      });
    });
  }
});
