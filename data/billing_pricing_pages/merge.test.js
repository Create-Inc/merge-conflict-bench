import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('billing_pricing_pages merge', () => {
  describe('base behaviors', () => {
    it('landing page has 360 Assistant feature card', () => {
      const src = readResolved('apps/web/src/app/page.jsx');
      expect(src).toContain('360 Assistant');
    });

    it('billing page has assistantDescription array', () => {
      const src = readResolved('apps/web/src/app/billing/page.jsx');
      expect(src).toMatch(/assistantDescription/);
    });

    it('billing page has allAccessIncludes array', () => {
      const src = readResolved('apps/web/src/app/billing/page.jsx');
      expect(src).toMatch(/allAccessIncludes/);
    });

    it('pricing page has All-access and Concierge plan cards', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toContain('All-access');
      expect(src).toContain('Concierge add-on');
    });

    it('pricing page mentions unlimited seats/users', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/[Uu]nlimited.*seats|[Uu]nlimited.*users/);
    });

    it('pricing page lists standard support', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/Standard support/);
    });

    it('pricing page lists role-based permissions', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toContain('Role-based permissions');
    });
  });

  describe('ours behaviors', () => {
    it('landing page description mentions background and not a chatbot', () => {
      const src = readResolved('apps/web/src/app/page.jsx');
      // Ours: "works in the background" and "Not a chatbot" phrasing
      expect(src).toMatch(/background/i);
      expect(src).toMatch(/not a chatbot/i);
    });

    it('billing page assistant description mentions not a chatbot', () => {
      const src = readResolved('apps/web/src/app/billing/page.jsx');
      expect(src).toMatch(/not a chatbot/i);
    });

    it('pricing page mentions ROI + performance reports using + symbol', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/ROI.*performance reports/);
    });

    it('pricing page 360 Assistant section mentions background operation', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/background/i);
    });
  });

  describe('theirs behaviors', () => {
    it('pricing page mentions tasks and team management', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/Task and timeline management/);
      expect(src).toMatch(/Team assignments/);
    });

    it('pricing page mentions travel and logistics tracking', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/Travel.*logistics tracking/i);
    });

    it('pricing page mentions budget and expense tracking', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/Budget.*expense tracking/i);
    });

    it('billing page lists document review capabilities', () => {
      const src = readResolved('apps/web/src/app/billing/page.jsx');
      expect(src).toMatch(/[Rr]eview.*uploaded.*document/);
    });

    it('billing page mentions email forwarding support', () => {
      const src = readResolved('apps/web/src/app/billing/page.jsx');
      expect(src).toMatch(/forwarding via email/i);
    });

    it('pricing page 360 Assistant mentions helping with data entry', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/data entry/i);
    });

    it('pricing page mentions document review for invoices, receipts, etc.', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/invoices.*receipts/i);
    });
  });
});
