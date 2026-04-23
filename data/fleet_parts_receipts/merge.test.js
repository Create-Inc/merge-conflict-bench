import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('fleet_parts_receipts', () => {
  describe('base behaviors (receipts route.js)', () => {
    it('route.js: exports GET and POST handlers', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('GET: requires workshop_coordinator or workshop_manager role', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/workshop_coordinator/);
      expect(src).toMatch(/workshop_manager/);
    });

    it('GET: supports search, status, and branch_id filters', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/branch_id/);
      expect(src).toMatch(/status/);
      expect(src).toMatch(/search/);
    });

    it('GET: returns pagination with limit, offset, total', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/pagination/);
      expect(src).toMatch(/limit/);
      expect(src).toMatch(/offset/);
      expect(src).toMatch(/total/);
    });

    it('GET: clamps limit between 1 and 200', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/clampInt/);
      expect(src).toMatch(/200/);
    });

    it('POST: requires workshop_manager role', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      // The POST specifically requires workshop_manager (not coordinator)
      const postSection = src.slice(src.indexOf('export async function POST'));
      expect(postSection).toMatch(/workshop_manager/);
    });

    it('POST: validates branch_id is required', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Missing branch_id/);
    });

    it('POST: requires at least one line with quantity', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/at least one line with quantity/);
    });

    it('POST: requires part_id for each receipt line', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Each receipt line must include part_id/);
    });

    it('POST: validates part_ids belong to the branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Invalid part_id for this branch/);
    });

    it('POST: creates receipt with draft status', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/'draft'/);
    });

    it('POST: uses CTE for atomic receipt + lines insert', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/WITH/);
      expect(src).toMatch(/fleet_parts_receipts/);
      expect(src).toMatch(/fleet_parts_receipt_lines/);
    });
  });

  describe('theirs behaviors (PO validation)', () => {
    it('POST: validates PO is not cancelled before receipt', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/cancelled/);
      expect(src).toMatch(/Cannot receive against a cancelled purchase order/);
    });

    it('POST: validates PO is in selected branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/PO is not in selected branch/);
    });

    it('POST: derives vendor from PO if not provided', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/resolvedVendorId/);
      expect(src).toMatch(/po\.vendor_id/);
    });
  });

  describe('base behaviors (receipt posting [id]/post/route.js)', () => {
    it('post/route.js: exports POST handler', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('post/route.js: validates receipt exists', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/Receipt not found/);
    });

    it('post/route.js: only allows posting draft receipts', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/Only draft receipts can be posted/);
    });

    it('post/route.js: validates receipt has lines before posting', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/No receipt lines found/);
    });

    it('post/route.js: updates inventory on_hand quantity', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/quantity_on_hand/);
    });

    it('post/route.js: creates cost layers', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/fleet_parts_cost_layers/);
    });

    it('post/route.js: creates inventory movement records', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/fleet_parts_inventory_movements/);
    });

    it('post/route.js: recomputes weighted average cost', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/avg_recompute|avg_cost/);
    });

    it('post/route.js: updates PO line received quantities', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/po_line_update|quantity_received/);
    });

    it('post/route.js: updates PO status (received, partially_received)', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/partially_received/);
    });
  });

  describe('theirs behaviors (atomic CTE posting)', () => {
    it('post/route.js: uses a single atomic CTE for the entire posting flow', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/WITH locked AS/);
      expect(src).toMatch(/lines AS/);
      expect(src).toMatch(/inv_update AS/);
      expect(src).toMatch(/cost_layers AS/);
      expect(src).toMatch(/movements AS/);
    });

    it('post/route.js: receipt status is updated to posted atomically in the CTE', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      // The status update to 'posted' happens in the CTE, not separately
      expect(src).toMatch(/SET status = 'posted'/);
    });

    it('post/route.js: returns 409 if atomic update finds receipt is no longer draft', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      // After the atomic CTE, if no rows returned, it means the receipt changed
      expect(src).toMatch(/if\s*\(!posted\)/);
    });
  });

  describe('base behaviors (transfer receive)', () => {
    it('receive/route.js: validates transfer exists', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/Transfer not found/);
    });

    it('receive/route.js: only allows receiving in-transit transfers', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/Only in-transit transfers can be received/);
    });

    it('receive/route.js: finds or creates matching part in target branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/part_number/);
      expect(src).toMatch(/to_branch_id/);
    });

    it('receive/route.js: updates quantity_on_hand in target branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/quantity_on_hand.*\+/);
    });

    it('receive/route.js: calls receiptWithCost for inventory costing', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/receiptWithCost/);
      expect(src).toMatch(/stock_transfer/);
    });

    it('receive/route.js: guards against double-receive with status check in UPDATE', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      // The UPDATE should include AND status = 'in_transit' to prevent double-receive
      expect(src).toMatch(/AND\s+status\s*=\s*'in_transit'/);
    });
  });
});
