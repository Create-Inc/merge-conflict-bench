import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('pricing_signout_cta merge', () => {
  describe('base behaviors', () => {
    it('FloatingDemoCTA links to /demo/access', () => {
      const src = readResolved('apps/web/src/components/HomePage/FloatingDemoCTA.jsx');
      expect(src).toMatch(/\/demo\/access/);
    });

    it('FloatingDemoCTA shows after scrolling past 240px', () => {
      const src = readResolved('apps/web/src/components/HomePage/FloatingDemoCTA.jsx');
      expect(src).toMatch(/240/);
      expect(src).toMatch(/scrollY/);
    });

    it('pricing page shows feature list with Check icons', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/features/);
      expect(src).toMatch(/Check/);
    });

    it('pricing page has Request Custom Pricing button', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      expect(src).toMatch(/Request Custom Pricing/);
    });

    it('platform-signout route exports a POST handler', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('platform-signout clears multiple cookie names including authjs and next-auth variants', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/authjs\.session-token/);
      expect(src).toMatch(/__Secure-authjs\.session-token/);
      expect(src).toMatch(/__Host-authjs\.session-token/);
      expect(src).toMatch(/next-auth\.session-token/);
    });

    it('platform-signout sets Clear-Site-Data header', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/Clear-Site-Data/);
    });

    it('platform-signout deletes auth_sessions from DB', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/DELETE\s+FROM\s+auth_sessions/);
    });
  });

  describe('ours behaviors', () => {
    it('FloatingDemoCTA uses inline style={{ color: "#ffffff" }} for forced white text', () => {
      const src = readResolved('apps/web/src/components/HomePage/FloatingDemoCTA.jsx');
      expect(src).toMatch(/style=\{\{\s*color:\s*["']#ffffff["']/);
    });

    it('FloatingDemoCTA spans also have style={{ color: "#ffffff" }}', () => {
      const src = readResolved('apps/web/src/components/HomePage/FloatingDemoCTA.jsx');
      // Multiple spans should have this inline style
      const matches = src.match(/style=\{\{\s*color:\s*["']#ffffff["']\s*\}\}/g);
      expect(matches).not.toBeNull();
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });

    it('platform-signout clearCookie function has domain parameter defaulting to null or undefined', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      // The clearCookie function should not require domain
      expect(src).toMatch(/function\s+clearCookie/);
      expect(src).toMatch(/domain/);
    });
  });

  describe('theirs behaviors', () => {
    it('FloatingDemoCTA uses text-white and !text-white classes for forced white text', () => {
      const src = readResolved('apps/web/src/components/HomePage/FloatingDemoCTA.jsx');
      expect(src).toMatch(/text-white/);
      expect(src).toMatch(/!text-white/);
    });

    it('pricing page has removed the Guided Setup box (only referenced in a removal comment)', () => {
      const src = readResolved('apps/web/src/app/pricing/page.jsx');
      // The "Guided Setup" text should only appear inside a comment, not as rendered content
      const lines = src.split('\n');
      const guidedSetupLines = lines.filter(l => /Guided Setup/i.test(l));
      expect(guidedSetupLines.length).toBeGreaterThan(0);
      // Every occurrence should be inside a comment
      for (const line of guidedSetupLines) {
        expect(line.trim()).toMatch(/^\/\/|^\{\/\*|^\*/);
      }
    });

    it('platform-signout uses getHostNameFromRequest to get hostname from request headers', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/getHostNameFromRequest/);
      expect(src).toMatch(/x-forwarded-host/);
    });

    it('platform-signout uses getCandidateDomains for domain variants', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/getCandidateDomains/);
    });

    it('platform-signout appendClearCookies takes request object (not hostHeader string)', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/appendClearCookies\(res,\s*name,\s*request\)/);
    });

    it('platform-signout handles __Host- cookies specially (no Domain, Secure only)', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/__Host-/);
      expect(src).toMatch(/isHostCookie/);
    });

    it('platform-signout clears cookies on both / and /api/auth paths', () => {
      const src = readResolved('apps/web/src/app/api/auth/platform-signout/route.js');
      expect(src).toMatch(/\/api\/auth/);
      // paths array
      expect(src).toMatch(/paths.*=.*\[.*["']\/["'].*["']\/api\/auth["']/s);
    });
  });
});
