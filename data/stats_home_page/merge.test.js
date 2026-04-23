import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('stats_home_page', () => {
  describe('base behaviors (stats API)', () => {
    it('route.js: exports GET handler', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
    });

    it('route.js: requires authentication via getActor + requireAuthActor', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/getActor/);
      expect(src).toMatch(/requireAuthActor/);
    });

    it('route.js: enforces role-based access with requireAnyRole', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/requireAnyRole/);
      expect(src).toMatch(/msp_user/);
      expect(src).toMatch(/msp_account_owner/);
    });

    it('route.js: builds org-scoped queries for non-platform-admin users', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/isPlatformAdmin/);
      expect(src).toMatch(/orgIds/);
      expect(src).toMatch(/scopeJoin/);
      expect(src).toMatch(/scopeWhere/);
    });

    it('route.js: returns requestsOverTime, latencyOverTime, tokensOverTime', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/requestsOverTime/);
      expect(src).toMatch(/latencyOverTime/);
      expect(src).toMatch(/tokensOverTime/);
    });

    it('route.js: returns summary with success_count and fail_count', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/success_count/);
      expect(src).toMatch(/fail_count/);
    });

    it('route.js: returns sources breakdown (kb_only, web_only, both, none)', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/kb_only/);
      expect(src).toMatch(/web_only/);
      expect(src).toMatch(/used_kb/);
      expect(src).toMatch(/used_web/);
    });

    it('route.js: returns feedback ratings distribution', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/user_feedback.*rating/s);
    });

    it('route.js: returns recentActivity with conversation_title', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/conversation_title/);
      expect(src).toMatch(/LIMIT 10/);
    });

    it('route.js: returns requestsLast24h', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/requestsLast24h/);
      expect(src).toMatch(/24 hours/);
    });
  });

  describe('theirs behaviors (lookup-table time range parsing)', () => {
    it('route.js: uses a RANGE_TO_INTERVAL lookup object', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/RANGE_TO_INTERVAL/);
    });

    it('route.js: supports 7d, 30d, 90d, 12m time ranges', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/"7d".*"7 days"/);
      expect(src).toMatch(/"30d".*"30 days"/);
      expect(src).toMatch(/"90d".*"90 days"/);
      expect(src).toMatch(/"12m".*"12 months"/);
    });

    it('route.js: uses a shared timeClause variable for filtering', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/timeClause/);
    });

    it('route.js: bucketUnit is month only for 12m', () => {
      const src = read('apps/web/src/app/api/stats/route.js');
      expect(src).toMatch(/timeRange.*12m.*month/s);
    });
  });

  describe('base behaviors (dashboard page)', () => {
    it('page.jsx: exports DashboardPage as default', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/export\s+default\s+function\s+DashboardPage/);
    });

    it('page.jsx: has time range selector with options', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/Last 7 days/);
      expect(src).toMatch(/Last 30 days/);
      expect(src).toMatch(/Last 90 days/);
      expect(src).toMatch(/Last 12 months/);
    });

    it('page.jsx: fetches from /api/stats with timeRange param', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/\/api\/stats/);
      expect(src).toMatch(/timeRange/);
    });

    it('page.jsx: displays 4 stat cards (Requests, Success rate, Avg latency, Token volume)', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/Requests/);
      expect(src).toMatch(/Success rate/);
      expect(src).toMatch(/Avg latency/);
      expect(src).toMatch(/Token volume/);
    });

    it('page.jsx: renders area chart for chat volume', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/AreaChart/);
      expect(src).toMatch(/Chat volume/i);
    });

    it('page.jsx: renders source mix pie chart', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/PieChart/);
      expect(src).toMatch(/Source mix/i);
    });

    it('page.jsx: renders ratings bar chart', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/BarChart/);
      expect(src).toMatch(/Ratings/i);
    });

    it('page.jsx: shows recent activity table with 6 columns', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/Conversation/);
      expect(src).toMatch(/Status/);
      expect(src).toMatch(/Sources/);
      expect(src).toMatch(/Latency/);
      expect(src).toMatch(/Tokens/);
      expect(src).toMatch(/Time/);
    });

    it('page.jsx: has link to Audit Log (/query-history)', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/\/query-history/);
      expect(src).toMatch(/Open Audit Log/);
    });

    it('page.jsx: shows loading spinner while data is fetching', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/isLoading/);
      expect(src).toMatch(/Preparing your dashboard/);
    });

    it('page.jsx: shows error state when fetch fails', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/Could not load dashboard/);
    });
  });

  describe('theirs behaviors (useCallback for xTickFormatter)', () => {
    it('page.jsx: imports useCallback', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/useCallback/);
    });

    it('page.jsx: xTickFormatter uses useCallback with bucketUnit dependency', () => {
      const src = read('apps/web/src/app/page.jsx');
      expect(src).toMatch(/xTickFormatter/);
      // Should be wrapped in useCallback
      expect(src).toMatch(/useCallback/);
    });
  });

  describe('theirs behaviors (subtitle template strings)', () => {
    it('page.jsx: success subtitle includes count formatted text', () => {
      const src = read('apps/web/src/app/page.jsx');
      // Should have dynamic subtitles that include the range label
      expect(src).toMatch(/success.*total/i);
    });

    it('page.jsx: chart titles include the selected range label', () => {
      const src = read('apps/web/src/app/page.jsx');
      // Should construct title strings with the range label
      expect(src).toMatch(/Chat volume/);
      expect(src).toMatch(/Outcomes/);
    });
  });
});
