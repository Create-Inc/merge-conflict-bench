import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('report_filters_shows merge', () => {
  describe('base behaviors', () => {
    it('useReportFilters initializes dateStart and dateEnd to empty strings', () => {
      const src = readResolved('apps/web/src/hooks/useReportFilters.js');
      // Both sides agreed: default to no date filter (empty strings)
      expect(src).toMatch(/useState\s*\(\s*["']["']\s*\)/);
      const dateStartMatch = src.match(/\[\s*dateStart\s*,\s*setDateStart\s*\]\s*=\s*useState\s*\(\s*["']([^"']*)["']\s*\)/);
      expect(dateStartMatch).not.toBeNull();
      expect(dateStartMatch[1]).toBe('');
      const dateEndMatch = src.match(/\[\s*dateEnd\s*,\s*setDateEnd\s*\]\s*=\s*useState\s*\(\s*["']([^"']*)["']\s*\)/);
      expect(dateEndMatch).not.toBeNull();
      expect(dateEndMatch[1]).toBe('');
    });

    it('useReportFilters returns all expected filter state', () => {
      const src = readResolved('apps/web/src/hooks/useReportFilters.js');
      expect(src).toMatch(/selectedShowIds/);
      expect(src).toMatch(/reportType/);
      expect(src).toMatch(/dateStart/);
      expect(src).toMatch(/dateEnd/);
      expect(src).toMatch(/eventType/);
    });

    it('fetchAccessibleShows checks for explicit show IDs', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      expect(src).toMatch(/hasExplicitShow/);
    });

    it('fetchAccessibleShows uses parameterized SQL queries', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      expect(src).toMatch(/\$\{idx\}/);
      expect(src).toMatch(/values\.push/);
      expect(src).toMatch(/where\.push/);
    });
  });

  describe('ours behaviors', () => {
    it('fetchAccessibleShows bypasses date/type filters when explicit shows are selected', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      // When hasExplicitShows is true, only filter by show IDs, not dates
      // The date filters should be inside an else block (not applied when explicit shows exist)
      expect(src).toMatch(/if\s*\(\s*hasExplicit/);
      // The ANY filter for explicit show IDs
      expect(src).toMatch(/ANY\s*\(\s*\$/);
    });

    it('ReportControls mentions that filters never hide explicitly selected events', () => {
      const src = readResolved('apps/web/src/components/Reports/ReportControls.jsx');
      // Ours wording: "Filters never hide explicitly selected events"
      expect(src).toMatch(/[Ff]ilters\s+never\s+hide/i);
    });
  });

  describe('theirs behaviors', () => {
    it('fetchAccessibleShows applies start date filter independently', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      // Theirs: start and end date filters can be applied independently
      // Check for individual if(start) and if(end) blocks
      expect(src).toMatch(/if\s*\(\s*start\s*\)/);
      expect(src).toMatch(/if\s*\(\s*end\s*\)/);
    });

    it('fetchAccessibleShows uses event date overlap logic (end_date >= start, start_date <= end)', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      // Date overlap: show's end_date must be >= query start, show's start_date must be <= query end
      expect(src).toMatch(/ts\.end_date\s*>=\s*\$/);
      expect(src).toMatch(/ts\.start_date\s*<=\s*\$/);
    });

    it('fetchAccessibleShows filters by event type when not "all"', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      expect(src).toMatch(/exhibit_type/);
      expect(src).toMatch(/!==\s*["']all["']/);
    });

    it('fetchAccessibleShows checks RBAC for viewAll permissions', () => {
      const src = readResolved('apps/web/src/app/api/reports/advanced/data/fetchAccessibleShows.js');
      expect(src).toMatch(/canViewAllTradeShows/);
      expect(src).toMatch(/viewAll/);
    });
  });
});
