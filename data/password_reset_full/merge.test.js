import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('password_reset_full', () => {
  describe('base behaviors', () => {
    it('forgot-password page is a client component', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src.trimStart().startsWith('"use client"')).toBe(true);
    });

    it('forgot-password page has a form that POSTs to /api/password-reset/request', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/\/api\/password-reset\/request/);
      expect(src).toMatch(/method:\s*["']POST["']/);
    });

    it('reset-password page is a client component', () => {
      const src = readResolved('apps/web/src/app/account/reset-password/page.jsx');
      expect(src.trimStart().startsWith('"use client"')).toBe(true);
    });

    it('reset-password page has a form that POSTs to /api/password-reset/confirm', () => {
      const src = readResolved('apps/web/src/app/account/reset-password/page.jsx');
      expect(src).toMatch(/\/api\/password-reset\/confirm/);
      expect(src).toMatch(/method:\s*["']POST["']/);
    });

    it('signin page is a client component', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src.trimStart().startsWith('"use client"')).toBe(true);
    });

    it('signin page uses signInWithCredentials', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/signInWithCredentials/);
    });

    it('confirm route exports POST handler', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/confirm/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it('request route exports POST handler', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });
  });

  describe('ours behaviors', () => {
    it('forgot-password page uses normalizeEmail to clean input', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/function\s+normalizeEmail/);
      expect(src).toMatch(/normalizeEmail/);
    });

    it('forgot-password page displays devResetUrl in dev mode', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/devResetUrl/);
    });

    it('forgot-password page imports BrandLogo', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/BrandLogo/);
    });

    it('forgot-password page uses useTheme and getThemeClasses', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/useTheme/);
      expect(src).toMatch(/getThemeClasses/);
    });

    it('request route normalizes email with normalizeEmail helper', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/function\s+normalizeEmail/);
    });

    it('request route always responds 200 to avoid account enumeration', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      // Even in error/no-user cases, returns ok: true
      const okMatches = src.match(/\{\s*ok:\s*true\s*\}/g);
      expect(okMatches).not.toBeNull();
      expect(okMatches.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('theirs behaviors', () => {
    it('confirm route uses single-statement CTE to validate token, mark used, and update/insert password', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/confirm/route.js');
      expect(src).toMatch(/WITH\s+token_row\s+AS/);
      expect(src).toMatch(/mark_used\s+AS/);
      expect(src).toMatch(/updated\s+AS/);
      expect(src).toMatch(/inserted\s+AS/);
    });

    it('confirm route uses argon2 for password hashing', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/confirm/route.js');
      expect(src).toMatch(/from\s+["']argon2["']/);
      expect(src).toMatch(/hash\s*\(\s*password\s*\)/);
    });

    it('confirm route enforces minimum 8 character password', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/confirm/route.js');
      expect(src).toMatch(/password\.length\s*<\s*8/);
    });

    it('request route invalidates previous tokens before creating new one', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/SET\s+used\s*=\s*true/);
    });

    it('request route returns devResetUrl in non-production', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/devResetUrl/);
      expect(src).toMatch(/isProd/);
    });

    it('signin page has link to forgot-password page', () => {
      const src = readResolved('apps/web/src/app/account/signin/page.jsx');
      expect(src).toMatch(/forgot-password/);
    });

    it('reset-password page enforces 8 character minimum on client side', () => {
      const src = readResolved('apps/web/src/app/account/reset-password/page.jsx');
      expect(src).toMatch(/password\.length\s*<\s*8/);
    });

    it('reset-password page validates passwords match', () => {
      const src = readResolved('apps/web/src/app/account/reset-password/page.jsx');
      expect(src).toMatch(/password\s*!==\s*confirmPassword/);
    });
  });
});
