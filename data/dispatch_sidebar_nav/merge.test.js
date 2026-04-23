import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('dispatch_sidebar_nav', () => {
  describe('base behaviors', () => {
    it('DashboardSidebar: exports DashboardSidebar function', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/export\s+function\s+DashboardSidebar/);
    });

    it('Sidebar: exports Sidebar function', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/export\s+function\s+Sidebar/);
    });

    it('DashboardSidebar: renders sign out link to /account/logout', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/\/account\/logout/);
      expect(src).toMatch(/Sign Out/);
    });

    it('Sidebar: renders sign out link to /account/logout', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/\/account\/logout/);
      expect(src).toMatch(/Sign Out/);
    });

    it('DashboardSidebar: has organization settings link to /tenant', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/href="\/tenant"/);
      expect(src).toMatch(/Organization settings/);
    });

    it('Sidebar: has organization settings link to /tenant', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/href="\/tenant"/);
      expect(src).toMatch(/Organization settings/);
    });

    it('DashboardSidebar: renders mobile backdrop overlay', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/fixed inset-0.*bg-black\/50.*lg:hidden/);
    });

    it('Sidebar: renders mobile backdrop overlay', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/fixed inset-0.*bg-black\/50.*lg:hidden/);
    });

    it('DashboardSidebar: renders admin link when showAdmin is true', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/showAdmin/);
      expect(src).toMatch(/UserCog/);
    });

    it('Sidebar: renders admin link when showAdmin is true', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/showAdmin/);
      expect(src).toMatch(/UserCog/);
    });
  });

  describe('theirs behaviors (PanelLeftClose/PanelLeftOpen icons)', () => {
    it('DashboardSidebar: imports PanelLeftClose and PanelLeftOpen', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/PanelLeftClose/);
      expect(src).toMatch(/PanelLeftOpen/);
    });

    it('DashboardSidebar: does NOT import ChevronLeft/ChevronRight for collapse', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).not.toMatch(/ChevronLeft/);
      expect(src).not.toMatch(/ChevronRight/);
    });

    it('Sidebar: imports PanelLeftClose and PanelLeftOpen', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/PanelLeftClose/);
      expect(src).toMatch(/PanelLeftOpen/);
    });

    it('Sidebar: does NOT import ChevronLeft/ChevronRight', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).not.toMatch(/ChevronLeft/);
      expect(src).not.toMatch(/ChevronRight/);
    });
  });

  describe('theirs behaviors (collapsed mini-logo avatar)', () => {
    it('DashboardSidebar: shows a small logo avatar when collapsed on desktop', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/h-12 w-12/);
      expect(src).toMatch(/rounded-2xl/);
      expect(src).toMatch(/h-10 w-10 object-contain/);
    });

    it('Sidebar: shows a small logo avatar when collapsed on desktop', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/h-12 w-12/);
      expect(src).toMatch(/rounded-2xl/);
      expect(src).toMatch(/h-10 w-10 object-contain/);
    });
  });

  describe('theirs behaviors (safe array guards)', () => {
    it('DashboardSidebar: guards primaryModules with Array.isArray', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/Array\.isArray\(primaryModules\)/);
    });

    it('DashboardSidebar: guards secondaryModules with Array.isArray', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/Array\.isArray\(secondaryModules\)/);
    });

    it('Sidebar: guards primaryModules with Array.isArray', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/Array\.isArray\(primaryModules\)/);
    });

    it('Sidebar: guards secondaryModules with Array.isArray', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/Array\.isArray\(secondaryModules\)/);
    });
  });

  describe('theirs behaviors (aria-label on nav items and close button)', () => {
    it('DashboardSidebar: nav items have aria-label', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/aria-label=\{module\.name\}/);
    });

    it('DashboardSidebar: close button has aria-label', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/aria-label="Close menu"/);
    });

    it('Sidebar: nav items have aria-label', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/aria-label=\{module\.name\}/);
    });

    it('Sidebar: close button has aria-label', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/aria-label="Close menu"/);
    });
  });

  describe('merged behaviors (collapse state management)', () => {
    it('DashboardSidebar: uses useSidebarCollapsed hook', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/useSidebarCollapsed/);
    });

    it('Sidebar: uses useSidebarCollapsed hook', () => {
      const src = read('apps/web/src/components/Dispatch/Sidebar.jsx');
      expect(src).toMatch(/useSidebarCollapsed/);
    });

    it('DashboardSidebar: hides labels when collapsed with lg:hidden', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/lg:hidden/);
    });

    it('DashboardSidebar: sidebar width is lg:w-20 when collapsed', () => {
      const src = read('apps/web/src/components/Dashboard/DashboardSidebar.jsx');
      expect(src).toMatch(/lg:w-20/);
    });
  });
});
