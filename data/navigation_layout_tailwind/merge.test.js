import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('navigation_layout_tailwind', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('tailwind config has D&D retro gaming theme colors', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      expect(src).toContain('deep-forest');
      expect(src).toContain('dungeon-moss');
      expect(src).toContain('ancient-gold');
      expect(src).toContain('treasure-gold');
      expect(src).toContain('dragon-blood');
      expect(src).toContain('parchment');
      expect(src).toContain('void-black');
      expect(src).toContain('dungeon-stone');
    });

    it('tailwind config has font families for cinzel, inter, and press-start-2p', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      expect(src).toContain('cinzel');
      expect(src).toContain('inter');
      expect(src).toContain('press-start-2p');
    });

    it('tailwind config has box shadow definitions', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      expect(src).toContain('gold-glow');
      expect(src).toContain('forest-glow');
    });

    it('layout has metadata for Press A 2 Start', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      expect(src).toContain('Press A 2 Start');
      expect(src).toContain('thegamingguild.org');
    });

    it('layout imports ClientProviders', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      expect(src).toContain('ClientProviders');
    });

    it('layout has pixel-grid-bg and scrollbar styling', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      expect(src).toContain('pixel-grid-bg');
      expect(src).toContain('::-webkit-scrollbar');
    });

    it('Navigation component uses useUser hook', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('useUser');
    });

    it('Navigation has BetaBanner, DesktopNav, MobileNav, MobileMenu', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('BetaBanner');
      expect(src).toContain('DesktopNav');
      expect(src).toContain('MobileNav');
      expect(src).toContain('MobileMenu');
    });

    it('Navigation has notifications and messages state', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('notificationsOpen');
      expect(src).toContain('messagesOpen');
      expect(src).toContain('mobileMenuOpen');
    });

    it('Navigation uses useNotifications and useConversations hooks', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('useNotifications');
      expect(src).toContain('useConversations');
    });

    it('Navigation renders PressA2StartWordmark', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('PressA2StartWordmark');
    });

    it('Navigation has ReportModal for bug reports', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('ReportModal');
      expect(src).toContain('showBugReport');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('tailwind config has dreamcast-teal color (theirs)', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      expect(src).toContain('dreamcast-teal');
      expect(src).toContain('#00D1C1');
    });

    it('tailwind config remaps purple palette to Dreamcast teal range (theirs)', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      // theirs remapped purple to teal
      expect(src).toMatch(/purple:\s*\{/);
      expect(src).toContain('500: "#00D1C1"');
    });

    it('tailwind config has teal-glow box shadow (theirs)', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      expect(src).toContain('teal-glow');
    });

    it('layout body uses bg-[#07110F] background (theirs)', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      expect(src).toContain('bg-[#07110F]');
    });

    it('layout background uses Dreamcast teal gradient accents (theirs)', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      // theirs used rgba(0, 209, 193, ...) for teal accents
      expect(src).toContain('rgba(0, 209, 193');
    });

    it('layout has CRT scanlines effect (theirs)', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      expect(src).toContain('crt-scanlines');
    });

    it('layout pixel grid uses teal color (theirs)', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      // theirs: pixel grid uses rgba(0, 209, 193, ...)
      expect(src).toMatch(/rgba\(0,\s*209,\s*193/);
    });

    it('layout scrollbar uses dark teal colors (theirs)', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      // theirs used #0b1211 for track, #223330 for thumb, #00d1c1 for hover
      expect(src).toContain('#0b1211');
      expect(src).toContain('#223330');
      expect(src).toContain('#00d1c1');
    });

    it('Navigation uses BetaBanner component import (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      // ours imported BetaBanner as a component
      expect(src).toContain("import { BetaBanner }");
    });

    it('Navigation uses treasure-gold for wordmark (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      // ours used text-treasure-gold
      expect(src).toContain('text-treasure-gold');
    });

    it('Navigation uses DesktopNav component (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      // ours used the DesktopNav component
      expect(src).toContain('<DesktopNav');
    });

    it('Navigation uses MobileNav component (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      // ours used the MobileNav component
      expect(src).toContain('<MobileNav');
    });

    it('Navigation uses MobileNotificationsDropdown component (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('<MobileNotificationsDropdown');
    });

    it('Navigation uses MobileMenu component (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('<MobileMenu');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('tailwind config has ink-secondary and ink-muted text helpers (ours)', () => {
      const src = readResolved('apps/web/tailwind.config.js');
      expect(src).toContain('ink-secondary');
      expect(src).toContain('ink-muted');
    });

    it('layout uses text-cream-white and font-inter (ours preserved)', () => {
      const src = readResolved('apps/web/src/app/layout.jsx');
      expect(src).toContain('text-cream-white');
      expect(src).toContain('font-inter');
    });

    it('Navigation nav has bg-dungeon-stone/95 and border-pixel-border (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('bg-dungeon-stone/95');
      expect(src).toContain('border-pixel-border');
    });

    it('Navigation nav has sticky top-9 z-20 positioning (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('sticky');
      expect(src).toContain('top-9');
      expect(src).toContain('z-20');
    });

    it('Navigation nav uses pixel-grid-bg class (ours)', () => {
      const src = readResolved('apps/web/src/components/Navigation.jsx');
      expect(src).toContain('pixel-grid-bg');
    });
  });
});
