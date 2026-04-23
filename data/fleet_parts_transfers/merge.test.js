import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('fleet_parts_transfers', () => {
  describe('base behaviors (receipts route.js)', () => {
    it('exports GET and POST handlers', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('GET: requires fleet roles for authorization', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/requireFleetRoles/);
    });

    it('GET: supports pagination with limit and offset', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/pagination/);
      expect(src).toMatch(/clampInt/);
    });

    it('POST: validates branch_id is required', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Missing branch_id/);
    });

    it('POST: validates PO existence when provided', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Purchase order not found/);
    });

    it('POST: creates receipt with draft status using CTE', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/'draft'/);
      expect(src).toMatch(/WITH/);
    });
  });

  describe('theirs behaviors (PO cancelled check for receipts)', () => {
    it('POST: rejects receipt against cancelled PO', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Cannot receive against a cancelled purchase order/);
    });

    it('POST: validates PO branch matches scope', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/PO is not in selected branch/);
    });

    it('POST: checks null receipt and returns 500', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/route.js');
      expect(src).toMatch(/Failed to create receipt/);
    });
  });

  describe('base behaviors (receipt posting [id]/post)', () => {
    it('exports POST handler', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('validates receipt id is a valid number', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/Invalid id/);
    });

    it('only allows posting draft receipts', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/Only draft receipts can be posted/);
    });

    it('validates receipt has lines', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/No receipt lines found/);
    });
  });

  describe('theirs behaviors (atomic CTE for posting)', () => {
    it('uses single CTE for entire posting flow', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/WITH locked AS/);
      expect(src).toMatch(/inv_update AS/);
      expect(src).toMatch(/cost_layers AS/);
      expect(src).toMatch(/movements AS/);
      expect(src).toMatch(/avg_recompute AS/);
    });

    it('updates PO status in the same CTE', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/po_status AS/);
      expect(src).toMatch(/partially_received/);
    });

    it('returns 409 when atomic update produces no rows', () => {
      const src = read('apps/web/src/app/api/fleet/parts/receipts/[id]/post/route.js');
      expect(src).toMatch(/if\s*\(!posted\)/);
    });
  });

  describe('base behaviors (dispatch [id]/dispatch)', () => {
    it('exports POST handler', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('validates transfer exists', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/Transfer not found/);
    });

    it('only allows dispatching draft transfers', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/Only draft transfers can be dispatched/);
    });

    it('checks part exists and belongs to from_branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/Part not found/);
      expect(src).toMatch(/Part branch mismatch/);
    });

    it('prevents transferring reserved stock', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/Cannot transfer reserved stock/);
    });

    it('checks for insufficient stock', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/Insufficient stock to dispatch transfer/);
    });

    it('decreases inventory on_hand for dispatched parts', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/quantity_on_hand - /);
    });

    it('uses issueWithCost for cost accounting', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/issueWithCost/);
    });

    it('stores unit_cost on transfer lines for receiving side', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/UPDATE fleet_parts_stock_transfer_lines/);
      expect(src).toMatch(/SET unit_cost/);
    });

    it('sets transfer status to in_transit', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/status = 'in_transit'/);
      expect(src).toMatch(/dispatched_at = now/);
    });
  });

  describe('base behaviors (receive [id]/receive)', () => {
    it('exports POST handler', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('validates transfer exists', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/Transfer not found/);
    });

    it('only allows receiving in-transit transfers', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/Only in-transit transfers can be received/);
    });

    it('validates no transfer lines is an error', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/No transfer lines found/);
    });

    it('scopes auth to to_branch_id', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/t\.to_branch_id/);
      expect(src).toMatch(/scopeTo/);
    });

    it('creates part in target branch if not exists (by part_number)', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/part_number/);
      expect(src).toMatch(/INSERT INTO fleet_parts_inventory/);
    });

    it('copies part attributes when creating in target branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/fromPart\.part_name/);
      expect(src).toMatch(/fromPart\.description/);
      expect(src).toMatch(/fromPart\.category/);
      expect(src).toMatch(/fromPart\.unit_of_measure/);
    });

    it('increases inventory on_hand in target branch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/quantity_on_hand \+ /);
    });

    it('uses receiptWithCost for cost accounting', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/receiptWithCost/);
      expect(src).toMatch(/stock_transfer/);
    });

    it('sets transfer status to received', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/status = 'received'/);
      expect(src).toMatch(/received_at = now/);
    });
  });

  describe('theirs behaviors (double-receive guard)', () => {
    it('receive: UPDATE includes AND status = in_transit to guard against double-receive', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/AND\s+status\s*=\s*'in_transit'/);
    });

    it('receive: returns 409 if atomic update finds no matching row', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      // After the UPDATE, checks if received is null
      expect(src).toMatch(/if\s*\(!received\)/);
    });
  });

  describe('theirs behaviors (destructured array for SQL results)', () => {
    it('receive: uses destructured array for transfer fetch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/const \[t\] = await sql/);
    });

    it('receive: uses destructured array for fromPart fetch', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/const \[fromPart\] = await sql/);
    });

    it('receive: uses destructured array for toPartExisting', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/const \[toPartExisting\] = await sql/);
    });

    it('receive: uses destructured array for created part', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/const \[created\] = await sql/);
    });
  });

  describe('base behaviors (error handling)', () => {
    it('dispatch: includes error details in 500 response', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/dispatch/route.js');
      expect(src).toMatch(/Failed to dispatch transfer/);
      expect(src).toMatch(/details/);
    });

    it('receive: includes error details in 500 response', () => {
      const src = read('apps/web/src/app/api/fleet/parts/transfers/[id]/receive/route.js');
      expect(src).toMatch(/Failed to receive transfer/);
      expect(src).toMatch(/details/);
    });
  });
});
