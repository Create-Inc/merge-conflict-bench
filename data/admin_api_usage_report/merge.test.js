import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('admin_api_usage_report merge', () => {
  describe('base behaviors', () => {
    it('version.js exports APP_VERSION with the correct version string', () => {
      const src = readResolved('apps/mobile/src/utils/version.js');
      expect(src).toMatch(/export\s+const\s+APP_VERSION\s*=/);
      expect(src).toMatch(/01\.01\.06\.005\.presentation_redesign\.020/);
    });

    it('apiUsage handler exports GET and POST handlers', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('apiUsage handler has normalizeResetConfig function', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/function\s+normalizeResetConfig/);
    });

    it('apiUsage handler stores reset config in app_settings with UPSERT', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/app_settings/);
      expect(src).toMatch(/ON CONFLICT.*key.*DO UPDATE/s);
    });

    it('apiUsage handler supports three timezone options: EST, PST, UTC', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/America\/New_York/);
      expect(src).toMatch(/America\/Los_Angeles/);
      expect(src).toMatch(/UTC/);
    });

    it('apiUsage GET returns groups including youtube, spotify, tmdb', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/youtube/);
      expect(src).toMatch(/spotify/);
      expect(src).toMatch(/tmdb/);
    });

    it('ApiUsageReportSection component uses useQuery and useMutation', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/useQuery/);
      expect(src).toMatch(/useMutation/);
    });

    it('ApiUsageReportSection renders daily reset controls', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/Daily reset time/);
      expect(src).toMatch(/Save/);
    });
  });

  describe('ours behaviors', () => {
    it('version.js comment mentions daily reset time default is 3AM EST', () => {
      const src = readResolved('apps/mobile/src/utils/version.js');
      expect(src).toMatch(/3AM\s*EST|daily\s+reset\s+time\s+default/i);
    });

    it('ApiUsageReportSection imports useCallback', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/useCallback/);
    });

    it('ApiUsageReportSection defines RESET_DEFAULT with hour, ampm, timeZone, timeZoneLabel', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/RESET_DEFAULT/);
      expect(src).toMatch(/timeZoneLabel/);
    });

    it('ApiUsageReportSection defines TZ_OPTIONS array', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/TZ_OPTIONS/);
    });

    it('ApiUsageReportSection has picker modal for hour and timezone selection', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/pickerOpen/);
      expect(src).toMatch(/pickerKind/);
    });

    it('apiUsage handler returns todayTimeZoneLabel in the windows response', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/todayTimeZoneLabel/);
    });

    it('apiUsage handler DEFAULT_RESET includes timeZoneLabel', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/timeZoneLabel.*EST|EST.*timeZoneLabel/);
    });

    it('ApiUsageReportSection note text format includes todayTzLabel', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/todayTimeZoneLabel|todayTzLabel/);
    });
  });

  describe('theirs behaviors', () => {
    it('apiUsage handler has a computeTodayStart function', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/function\s+computeTodayStart/);
    });

    it('apiUsage handler computeTodayStart falls back to yesterday when now is before reset', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/yesterday/);
      expect(src).toMatch(/24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
    });

    it('apiUsage handler has hour12To24 conversion function', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/function\s+hour12To24/);
    });

    it('apiUsage handler normalizeResetConfig accepts hour12 field name', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/hour12/);
    });

    it('apiUsage handler normalizeResetConfig also accepts tz alias for timeZone', () => {
      const src = readResolved('apps/web/src/app/api/admin/reports/handlers/apiUsage.js');
      expect(src).toMatch(/r\.tz\s*\|\|/);
    });

    it('ApiUsageReportSection uses timeline modal for YouTube hourly breakdown', () => {
      const src = readResolved('apps/mobile/src/components/Admin/ApiUsageReportSection.jsx');
      expect(src).toMatch(/timelineOpen/);
      expect(src).toMatch(/timelineGroupKey/);
      expect(src).toMatch(/YouTube hourly/);
    });
  });
});
