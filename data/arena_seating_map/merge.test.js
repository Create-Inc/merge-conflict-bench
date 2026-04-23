import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('arena_seating_map merge', () => {
  describe('base behaviors', () => {
    it('SeatingMap component exports a named function', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/export\s+function\s+SeatingMap/);
    });

    it('SeatingMap accepts homeColor and awayColor props', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/homeColor/);
      expect(src).toMatch(/awayColor/);
    });

    it('SeatingMap renders SVG with sections and tiers', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/<svg/);
      expect(src).toMatch(/viewBox/);
      expect(src).toMatch(/tierCount/);
    });

    it('SeatingMap renders a court area inside the bowl', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/Court/i);
      expect(src).toMatch(/<rect/);
      expect(src).toMatch(/<circle/);
    });

    it('SeatingMap uses energyByUserId for heat coloring', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/energyByUserId/);
      expect(src).toMatch(/getEnergyColor/);
    });

    it('SeatingMap sections are rendered using arcWedgePath', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/arcWedgePath/);
      expect(src).toMatch(/<path/);
    });
  });

  describe('ours behaviors', () => {
    it('SeatingMap accepts a variant prop with "card" and "fullscreen" modes', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/variant\s*=\s*["']card["']/);
      expect(src).toMatch(/isFullscreen/);
      expect(src).toMatch(/fullscreen/);
    });

    it('SeatingMap hides title/legend in fullscreen mode', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      // In fullscreen mode, the header/legend is hidden
      expect(src).toMatch(/!isFullscreen/);
    });

    it('SeatingMap adjusts outerWrapStyle and cardStyle based on variant', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/outerWrapStyle/);
      expect(src).toMatch(/cardStyle/);
      // Fullscreen should have no border radius
      expect(src).toMatch(/borderRadius:\s*0/);
    });

    it('SeatingMap adjusts SVG height based on variant (100% for fullscreen)', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/svgHeight/);
      expect(src).toMatch(/isFullscreen\s*\?\s*["']100%["']/);
    });

    it('arena-preview page uses SeatingMap with variant="fullscreen"', () => {
      const src = readResolved('apps/web/src/app/arena-preview/page.jsx');
      expect(src).toMatch(/variant\s*=\s*["']fullscreen["']/);
      expect(src).toMatch(/SeatingMap/);
    });

    it('game page uses SeatingMap with variant="fullscreen"', () => {
      const src = readResolved('apps/web/src/app/arena/[gameId]/page.jsx');
      expect(src).toMatch(/variant\s*=\s*["']fullscreen["']/);
      expect(src).toMatch(/SeatingMap/);
    });

    it('arena-preview page renders SponsorRing', () => {
      const src = readResolved('apps/web/src/app/arena-preview/page.jsx');
      expect(src).toMatch(/SponsorRing/);
    });

    it('game page renders SponsorRing', () => {
      const src = readResolved('apps/web/src/app/arena/[gameId]/page.jsx');
      expect(src).toMatch(/SponsorRing/);
    });
  });

  describe('theirs behaviors', () => {
    it('SeatingMap sections use 3 tiers with 18 sections per tier', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/tierCount\s*=\s*3/);
      expect(src).toMatch(/perTier\s*=\s*18/);
    });

    it('SeatingMap header shows capacity and occupied count', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/capacity/);
      expect(src).toMatch(/occupiedCount/);
      expect(src).toMatch(/in seats/);
    });

    it('SeatingMap renders Home and Away legends with colored dots', () => {
      const src = readResolved('apps/web/src/components/Arena/SeatingMap.jsx');
      expect(src).toMatch(/Home/);
      expect(src).toMatch(/Away/);
      // Legend dots with team colors
      expect(src).toMatch(/homeColor.*0\.7[0-9]*/);
      expect(src).toMatch(/awayColor.*0\.7[0-9]*/);
    });
  });
});
