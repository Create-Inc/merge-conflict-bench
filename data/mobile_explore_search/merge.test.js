import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("mobile_explore_search", () => {
  describe("base behaviors", () => {
    it("FilterBar exports a named FilterBar component", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/FilterBar.jsx",
      );
      expect(src).toMatch(/export\s+function\s+FilterBar/);
    });

    it("FilterBar contains withAlpha helper function", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/FilterBar.jsx",
      );
      expect(src).toMatch(/function\s+withAlpha\s*\(/);
    });

    it("SearchResultItem exports a named SearchResultItem component", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/export\s+function\s+SearchResultItem/);
    });

    it("SearchResultItem has canSave logic for saveable kinds", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      // Must include the array of saveable kinds
      expect(src).toMatch(/["']PLACES["']/);
      expect(src).toMatch(/["']PLACE["']/);
      expect(src).toMatch(/["']ITINERARY["']/);
      expect(src).toMatch(/["']LIST["']/);
      expect(src).toMatch(/["']DESTINATION["']/);
      expect(src).toMatch(/["']DISCOVERY["']/);
    });

    it("SearchResultItem renders Bookmark icon from lucide-react-native", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/Bookmark/);
      expect(src).toMatch(/lucide-react-native/);
    });
  });

  describe("ours behaviors", () => {
    it("FilterBar imports FILTERS from @/utils/explore/search/constants", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/FilterBar.jsx",
      );
      expect(src).toMatch(/@\/utils\/explore\/search\/constants/);
    });

    it("SearchResultItem imports helpers from @/utils/explore/search/helpers", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/@\/utils\/explore\/search\/helpers/);
    });

    it("SearchResultItem imports EXPLORATION_YELLOW from @/utils/explore/search/constants", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/@\/utils\/explore\/search\/constants/);
    });

    it("SearchResultItem uses optional chaining for item properties (item?.kind, item?.title, etc)", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/item\?\.kind/);
      expect(src).toMatch(/item\?\.title/);
      expect(src).toMatch(/item\?\.subtitle/);
    });

    it("SearchResultItem uses Array.isArray guard for tripDraft", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/Array\.isArray\(tripDraft\)/);
    });

    it("SearchResultItem shows title || Untitled fallback", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/title\s*\|\|\s*["']Untitled["']/);
    });
  });

  describe("theirs behaviors", () => {
    it("SearchResultItem computes showMemberTag from item?.isPremium", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/showMemberTag/);
      expect(src).toMatch(/isPremium/);
    });

    it("SearchResultItem renders Member badge with color #FDE68A when showMemberTag is true", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/Member/);
      expect(src).toMatch(/#FDE68A/);
    });

    it("SearchResultItem renders Perk badge for PERKS kind", () => {
      const src = readResolved(
        "apps/mobile/src/components/explore/search/SearchResultItem.jsx",
      );
      expect(src).toMatch(/PERKS/);
      expect(src).toMatch(/Perk/);
    });
  });
});
