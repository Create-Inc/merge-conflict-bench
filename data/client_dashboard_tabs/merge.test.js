import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('client_dashboard_tabs merge', () => {
  describe('base behaviors', () => {
    it('page.jsx renders ClientHeader and DashboardContent', () => {
      const src = readResolved('apps/web/src/app/dashboard/client/[id]/page.jsx');
      expect(src).toMatch(/<ClientHeader/);
      expect(src).toMatch(/<DashboardContent/);
    });

    it('ClientSummaryPanel has delete confirmation modal with name typing requirement', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      expect(src).toMatch(/delete-client-title/);
      expect(src).toMatch(/Confirm delete/);
      expect(src).toMatch(/Permanently Delete/);
    });

    it('ClientSummaryPanel has client file modal', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      expect(src).toMatch(/client-file-title/);
      expect(src).toMatch(/Client File/);
    });

    it('TabNavigation renders all tab keys', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/TabNavigation.jsx');
      expect(src).toContain('"setup"');
      expect(src).toContain('"overview"');
      expect(src).toContain('"services"');
      expect(src).toContain('"related"');
      expect(src).toContain('"deadlines"');
      expect(src).toContain('"aml"');
      expect(src).toContain('"notes"');
      expect(src).toContain('"jafa-ai"');
    });

    it('ClientSummaryPanel has View Client File button', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      expect(src).toContain('View Client File');
    });

    it('ClientSummaryPanel has Mark as Active/Inactive buttons', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      expect(src).toContain('Mark as Active');
      expect(src).toContain('Mark as Inactive');
    });
  });

  describe('ours behaviors', () => {
    it('page.jsx does NOT pass actions prop to TabNavigation (ours removed inline actions from tab header)', () => {
      const src = readResolved('apps/web/src/app/dashboard/client/[id]/page.jsx');
      // Ours moved actions out of the tab header, so TabNavigation should not receive actions
      // The page should not render TabNavigation with actions prop inline
      // Instead ClientHeader handles the summary panel
      expect(src).not.toMatch(/actions=\s*\{/);
    });
  });

  describe('theirs behaviors', () => {
    it('ClientSummaryPanel accepts variant prop for inline mode', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      // Theirs introduced a "variant" prop (rather than ours "mode")
      expect(src).toMatch(/variant/);
    });

    it('ClientSummaryPanel determines inline mode from variant prop', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      expect(src).toMatch(/variant\s*===\s*["']inline["']/);
    });

    it('TabNavigation accepts padClassName and showBorder props', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/TabNavigation.jsx');
      expect(src).toMatch(/padClassName/);
      expect(src).toMatch(/showBorder/);
    });

    it('TabNavigation uses wrapperClassName for conditional border', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/TabNavigation.jsx');
      expect(src).toMatch(/wrapperClassName/);
    });

    it('ClientSummaryPanel renders actionsRow as a reusable variable', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      // Theirs extracted actions into a const actionsRow for reuse
      expect(src).toMatch(/const\s+actionsRow/);
    });

    it('ClientSummaryPanel inline branch renders actionsRow plus modals', () => {
      const src = readResolved('apps/web/src/components/ClientDashboard/ClientSummaryPanel.jsx');
      // When isInline is true, it should render actionsRow and modals
      expect(src).toMatch(/if\s*\(\s*isInline\s*\)/);
    });
  });
});
