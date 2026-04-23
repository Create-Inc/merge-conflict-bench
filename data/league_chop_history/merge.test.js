import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("league_chop_history", () => {
  describe("base behaviors", () => {
    it("route.js exports a GET handler that checks auth and league type", () => {
      const src = readResolved(
        "apps/web/src/app/api/leagues/[id]/chopped/history/route.js",
      );
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
      expect(src).toMatch(/auth\(\)/);
      expect(src).toMatch(/Unauthorized/);
      expect(src).toMatch(/chopped/);
    });

    it("route.js validates leagueId is a finite number", () => {
      const src = readResolved(
        "apps/web/src/app/api/leagues/[id]/chopped/history/route.js",
      );
      expect(src).toMatch(/Number\.isFinite\(leagueId\)/);
      expect(src).toMatch(/Invalid league id/);
    });

    it("route.js returns 404 when league not found", () => {
      const src = readResolved(
        "apps/web/src/app/api/leagues/[id]/chopped/history/route.js",
      );
      expect(src).toMatch(/League not found/);
      expect(src).toMatch(/404/);
    });

    it("route.js returns 400 for non-chopped leagues", () => {
      const src = readResolved(
        "apps/web/src/app/api/leagues/[id]/chopped/history/route.js",
      );
      expect(src).toMatch(/not a chopped league/);
      expect(src).toMatch(/400/);
    });

    it("ChopTab exports a named ChopTab component", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/export\s+function\s+ChopTab/);
    });

    it("ChopTab has historyQuery fetching from /api/leagues/.../chopped/history", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/historyQuery/);
      expect(src).toMatch(/chopped-history/);
      expect(src).toMatch(/\/chopped\/history/);
    });
  });

  describe("ours behaviors", () => {
    it("ChopTab imports Users and Crosshair icons from lucide-react", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/Users/);
      expect(src).toMatch(/Crosshair/);
    });

    it("ChopTab shows teams remaining and chop target labels", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/teamsRemainingLabel/);
      expect(src).toMatch(/chopTargetLabel/);
      expect(src).toMatch(/team.*remaining/);
      expect(src).toMatch(/Chop target/);
    });

    it("ChopTab historyQuery has enabled: Boolean(leagueId)", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/enabled:\s*Boolean\(leagueId\)/);
    });
  });

  describe("theirs behaviors", () => {
    it("ChopTab imports History icon from lucide-react", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/History/);
      expect(src).toMatch(/lucide-react/);
    });

    it("route.js selects only id, league_type from leagues table (not SELECT *)", () => {
      const src = readResolved(
        "apps/web/src/app/api/leagues/[id]/chopped/history/route.js",
      );
      expect(src).toMatch(/SELECT\s+id,\s*league_type/);
      expect(src).not.toMatch(/SELECT\s+\*/);
    });

    it("route.js returns history with fallback to empty array", () => {
      const src = readResolved(
        "apps/web/src/app/api/leagues/[id]/chopped/history/route.js",
      );
      expect(src).toMatch(/history\s*:\s*history\s*\|\|\s*\[\]/);
    });

    it("ChopTab Chop History section uses History icon (not Scissors)", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      // The Chop History header should use History icon
      expect(src).toMatch(/<History\s/);
    });

    it("ChopTab shows choppedAt timestamp from created_at in history rows", () => {
      const src = readResolved(
        "apps/web/src/components/LeaguePage/ChopTab.jsx",
      );
      expect(src).toMatch(/choppedAt/);
      expect(src).toMatch(/created_at/);
      expect(src).toMatch(/toLocaleString/);
    });
  });
});
