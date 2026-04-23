import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('crm_dashboard_modules', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('CustomerHeader accepts both onNewTicket and setTicketOpen props', () => {
      const src = readResolved('apps/web/src/components/CustomerDetail/CustomerHeader.jsx');
      expect(src).toContain('onNewTicket');
      expect(src).toContain('setTicketOpen');
    });

    it('CustomerHeader renders New ticket button with LifeBuoy icon', () => {
      const src = readResolved('apps/web/src/components/CustomerDetail/CustomerHeader.jsx');
      expect(src).toContain('LifeBuoy');
      expect(src).toContain('New ticket');
    });

    it('CustomerHeader renders Quote and Sales order links', () => {
      const src = readResolved('apps/web/src/components/CustomerDetail/CustomerHeader.jsx');
      expect(src).toContain('Quote');
      expect(src).toContain('Sales order');
    });

    it('all CRM pages import CreateTicketModal', () => {
      const pages = [
        'apps/web/src/app/modules/crm/tasks/page.jsx',
        'apps/web/src/app/modules/crm/deals/page.jsx',
        'apps/web/src/app/modules/crm/dashboard/page.jsx',
        'apps/web/src/app/modules/crm/[id]/page.jsx',
      ];
      for (const p of pages) {
        const src = readResolved(p);
        expect(src).toContain('CreateTicketModal');
      }
    });

    it('all CRM pages have DEFAULT_TICKET_DRAFT with priority medium', () => {
      const pages = [
        'apps/web/src/app/modules/crm/tasks/page.jsx',
        'apps/web/src/app/modules/crm/deals/page.jsx',
        'apps/web/src/app/modules/crm/dashboard/page.jsx',
        'apps/web/src/app/modules/crm/[id]/page.jsx',
      ];
      for (const p of pages) {
        const src = readResolved(p);
        expect(src).toContain('DEFAULT_TICKET_DRAFT');
        expect(src).toContain('priority: "medium"');
      }
    });

    it('all CRM pages createTicketMutation posts to /api/helpdesk/tickets', () => {
      const pages = [
        'apps/web/src/app/modules/crm/tasks/page.jsx',
        'apps/web/src/app/modules/crm/deals/page.jsx',
        'apps/web/src/app/modules/crm/dashboard/page.jsx',
        'apps/web/src/app/modules/crm/[id]/page.jsx',
      ];
      for (const p of pages) {
        const src = readResolved(p);
        expect(src).toContain('/api/helpdesk/tickets');
        expect(src).toContain('createTicketMutation');
      }
    });

    it('ticket creation validates subject is required', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      expect(src).toContain('Subject is required');
    });

    it('ticket creation formats subject with area tag prefix', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      // subject = tag ? `[${tag}] ${subjectRaw}` : subjectRaw
      expect(src).toMatch(/\[.*\$\{tag\}/);
    });

    it('ticket creation detects field work tags', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      expect(src).toContain('FIELD');
      expect(src).toContain('FSM');
      expect(src).toContain('FIELDWORK');
      expect(src).toContain('autoCreateJobCard');
    });

    it('tasks page has status filter (open/done) and due filter', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      expect(src).toContain('statusFilter');
      expect(src).toContain('dueFilter');
      expect(src).toContain('"open"');
      expect(src).toContain('"done"');
    });

    it('tasks page has mineOnly toggle', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      expect(src).toContain('mineOnly');
      expect(src).toContain('My tasks');
      expect(src).toContain('All tasks');
    });

    it('deals page has pipeline and list view toggle', () => {
      const src = readResolved('apps/web/src/app/modules/crm/deals/page.jsx');
      expect(src).toContain('pipeline');
      expect(src).toContain('Pipeline');
      expect(src).toContain('"list"');
    });

    it('dashboard page has pipeline and wins charts', () => {
      const src = readResolved('apps/web/src/app/modules/crm/dashboard/page.jsx');
      expect(src).toContain('BarChart');
      expect(src).toContain('LineChart');
      expect(src).toContain('pipelineData');
      expect(src).toContain('winsData');
    });

    it('dashboard page shows overdue tasks and open tasks cards', () => {
      const src = readResolved('apps/web/src/app/modules/crm/dashboard/page.jsx');
      expect(src).toContain('Overdue tasks');
      expect(src).toContain('Open tasks');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('CustomerHeader accepts onNewTicket as preferred callback (ours)', () => {
      const src = readResolved('apps/web/src/components/CustomerDetail/CustomerHeader.jsx');
      // ours used onNewTicket prop; theirs used setTicketOpen
      // Resolved should have onNewTicket preferred
      expect(src).toContain('onNewTicket');
      // onTicketClick should prefer onNewTicket over setTicketOpen
      expect(src).toMatch(/if\s*\(\s*onNewTicket\s*\)/);
    });

    it('customer detail [id] page passes onNewTicket to CustomerHeader (ours)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/[id]/page.jsx');
      expect(src).toContain('onNewTicket');
    });

    it('customer detail [id] page imports useCallback (ours)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/[id]/page.jsx');
      expect(src).toContain('useCallback');
    });

    it('dashboard page imports useCallback (ours)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/dashboard/page.jsx');
      expect(src).toContain('useCallback');
    });

    it('dashboard isLoading checks dashboardQuery.isLoading (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/dashboard/page.jsx');
      expect(src).toContain('dashboardQuery.isLoading');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('CustomerHeader also accepts setTicketOpen for backwards-compatibility (theirs)', () => {
      const src = readResolved('apps/web/src/components/CustomerDetail/CustomerHeader.jsx');
      // theirs used setTicketOpen directly
      expect(src).toContain('setTicketOpen');
      // Resolved merges both approaches
      expect(src).toMatch(/setTicketOpen\(\s*true\s*\)/);
    });

    it('tasks page imports LifeBuoy from lucide-react (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      expect(src).toContain('LifeBuoy');
    });

    it('deals page imports LifeBuoy and Search from lucide-react (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/deals/page.jsx');
      expect(src).toContain('LifeBuoy');
      expect(src).toContain('Search');
    });

    it('tasks page has New ticket button with LifeBuoy icon (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/tasks/page.jsx');
      expect(src).toContain('New ticket');
      expect(src).toContain('LifeBuoy');
    });

    it('deals page has New ticket button with LifeBuoy icon (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/deals/page.jsx');
      expect(src).toContain('New ticket');
      expect(src).toContain('LifeBuoy');
    });

    it('dashboard page imports LifeBuoy (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/dashboard/page.jsx');
      expect(src).toContain('LifeBuoy');
    });

    it('dashboard page has New ticket button (theirs)', () => {
      const src = readResolved('apps/web/src/app/modules/crm/dashboard/page.jsx');
      expect(src).toContain('New ticket');
    });
  });
});
