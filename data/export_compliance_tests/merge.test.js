import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('export_compliance_tests', () => {
  describe('base behaviors', () => {
    it('autonomy-decisions test file imports vi from vitest', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/autonomy-decisions.route.test.js');
      expect(src).toMatch(/from\s+["']vitest["']/);
    });

    it('compliance-blocks test file imports vi from vitest', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/compliance-blocks.route.test.js');
      expect(src).toMatch(/from\s+["']vitest["']/);
    });

    it('executions test file imports vi from vitest', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/executions.route.test.js');
      expect(src).toMatch(/from\s+["']vitest["']/);
    });

    it('access report test file imports vi from vitest', () => {
      const src = readResolved('apps/web/src/app/api/reports/__tests__/access.route.test.js');
      expect(src).toMatch(/from\s+["']vitest["']/);
    });

    it('retention test file imports vi from vitest', () => {
      const src = readResolved('apps/web/src/app/api/settings/__tests__/retention.route.test.js');
      expect(src).toMatch(/from\s+["']vitest["']/);
    });

    it('all test files mock requireActiveWorkspace', () => {
      const files = [
        'apps/web/src/app/api/exports/__tests__/autonomy-decisions.route.test.js',
        'apps/web/src/app/api/exports/__tests__/compliance-blocks.route.test.js',
        'apps/web/src/app/api/exports/__tests__/executions.route.test.js',
        'apps/web/src/app/api/reports/__tests__/access.route.test.js',
        'apps/web/src/app/api/settings/__tests__/retention.route.test.js',
      ];
      for (const f of files) {
        const src = readResolved(f);
        expect(src).toMatch(/mockRequireActiveWorkspace/);
      }
    });
  });

  describe('ours behaviors', () => {
    it('autonomy-decisions test requires owner role for export', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/autonomy-decisions.route.test.js');
      expect(src).toMatch(/minRoleKey.*owner/);
    });

    it('executions test checks Content-Disposition header contains filename with workspace id', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/executions.route.test.js');
      expect(src).toMatch(/Content-Disposition/);
      expect(src).toMatch(/executions_ws_1/);
    });

    it('autonomy-decisions test verifies emitTimeline is called', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/autonomy-decisions.route.test.js');
      expect(src).toMatch(/mockEmitTimeline.*toHaveBeenCalled/s);
    });

    it('executions test verifies emitTimeline is called', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/executions.route.test.js');
      expect(src).toMatch(/mockEmitTimeline.*toHaveBeenCalled/s);
    });

    it('access report test verifies can_export_audit is true for owners', () => {
      const src = readResolved('apps/web/src/app/api/reports/__tests__/access.route.test.js');
      expect(src).toMatch(/can_export_audit.*true/);
    });
  });

  describe('theirs behaviors', () => {
    it('compliance-blocks test verifies decision field is "blocked"', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/compliance-blocks.route.test.js');
      expect(src).toMatch(/decision.*blocked/);
    });

    it('compliance-blocks test verifies CSV contains reason_code value', () => {
      const src = readResolved('apps/web/src/app/api/exports/__tests__/compliance-blocks.route.test.js');
      expect(src).toMatch(/no_consent/);
    });

    it('retention test verifies PATCH clamps values (3650 max, 0 min, integer)', () => {
      const src = readResolved('apps/web/src/app/api/settings/__tests__/retention.route.test.js');
      expect(src).toMatch(/transcripts_days.*3650/);
      expect(src).toMatch(/logs_days.*0/);
      expect(src).toMatch(/diagnostics_days.*1/);
    });

    it('retention test verifies GET creates policy if missing (two dbOne calls)', () => {
      const src = readResolved('apps/web/src/app/api/settings/__tests__/retention.route.test.js');
      expect(src).toMatch(/creates policy if missing/);
      expect(src).toMatch(/mockDbOne.*toHaveBeenCalledTimes\s*\(\s*2\s*\)/);
    });

    it('access report test has CSV format test with membership_id header', () => {
      const src = readResolved('apps/web/src/app/api/reports/__tests__/access.route.test.js');
      expect(src).toMatch(/format=csv/);
      expect(src).toMatch(/membership_id/);
    });
  });
});
