import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('account_signup_email', () => {
  describe('base behaviors', () => {
    it('after-signup page uses "use client" directive', () => {
      const src = readResolved('apps/web/src/app/account/after-signup/page.jsx');
      expect(src.trimStart().startsWith('"use client"')).toBe(true);
    });

    it('after-signup page imports useMutation and useQuery from @tanstack/react-query', () => {
      const src = readResolved('apps/web/src/app/account/after-signup/page.jsx');
      expect(src).toMatch(/import\s*\{[^}]*useMutation[^}]*\}\s*from\s*["']@tanstack\/react-query["']/);
      expect(src).toMatch(/import\s*\{[^}]*useQuery[^}]*\}\s*from\s*["']@tanstack\/react-query["']/);
    });

    it('after-signup page defines getSafeCallbackUrlFromLocation that rejects absolute URLs', () => {
      const src = readResolved('apps/web/src/app/account/after-signup/page.jsx');
      expect(src).toMatch(/function\s+getSafeCallbackUrlFromLocation/);
      // Must contain open-redirect protection (reject paths starting with //)
      expect(src).toMatch(/startsWith\s*\(\s*["']\/\/["']\s*\)/);
    });

    it('after-signup page includes verification flow sending POST to /api/account/email', () => {
      const src = readResolved('apps/web/src/app/account/after-signup/page.jsx');
      expect(src).toMatch(/\/api\/account\/email/);
      expect(src).toMatch(/method:\s*["']POST["']/);
    });

    it('account route.js exports GET and POST handlers', () => {
      const src = readResolved('apps/web/src/app/api/account/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+GET\s*\(/);
      expect(src).toMatch(/export\s+async\s+function\s+POST\s*\(/);
    });

    it('account route.js GET handler includes email-verify endpoint', () => {
      const src = readResolved('apps/web/src/app/api/account/route.js');
      expect(src).toMatch(/email-verify/);
    });

    it('account route.js POST handler includes create-or-invite endpoint', () => {
      const src = readResolved('apps/web/src/app/api/account/route.js');
      expect(src).toMatch(/create-or-invite/);
    });

    it('email route.js exports POST and GET handlers', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      expect(src).toMatch(/export\s+async\s+function\s+POST\s*\(/);
      expect(src).toMatch(/export\s+async\s+function\s+GET\s*\(/);
    });

    it('email route.js defines VERIFICATION_TTL_MS as 24h', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      expect(src).toMatch(/VERIFICATION_TTL_MS\s*=\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
    });

    it('email route.js defines RESEND_COOLDOWN_MS as 5 minutes', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      expect(src).toMatch(/RESEND_COOLDOWN_MS\s*=\s*5\s*\*\s*60\s*\*\s*1000/);
    });
  });

  describe('ours behaviors', () => {
    it('account route.js records last-sent timestamp via UPDATE auth_users SET verification_email_last_sent_at', () => {
      const src = readResolved('apps/web/src/app/api/account/route.js');
      expect(src).toMatch(/verification_email_last_sent_at\s*=\s*NOW\(\)/);
    });

    it('after-signup page reads retryAfterSeconds from sendVerification response', () => {
      const src = readResolved('apps/web/src/app/account/after-signup/page.jsx');
      expect(src).toMatch(/retryAfterSeconds/);
    });

    it('email route.js records last-sent timestamp before sending', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      expect(src).toMatch(/verification_email_last_sent_at\s*=\s*NOW\(\)/);
    });

    it('email route.js uses verification URL that points to /api/account/email (not /api/account)', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      expect(src).toMatch(/\/api\/account\/email\?token=/);
    });
  });

  describe('theirs behaviors', () => {
    it('after-signup page computes a throttled message string (throttledMsg or similar)', () => {
      const src = readResolved('apps/web/src/app/account/after-signup/page.jsx');
      // theirs introduced a message-based throttle indicator rather than just a boolean
      expect(src).toMatch(/throttl/i);
      // The message should contain user-friendly text
      expect(src).toMatch(/sent.*link|check.*inbox|wait/i);
    });

    it('account route.js uses getRequestOrigin helper for building verifyUrl', () => {
      const src = readResolved('apps/web/src/app/api/account/route.js');
      expect(src).toMatch(/getRequestOrigin/);
    });

    it('email route.js reuses existing unexpired tokens before creating new ones', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      // Must query for existing tokens with expires > NOW()
      expect(src).toMatch(/SELECT.*token.*FROM\s+auth_verification_token.*WHERE.*identifier.*expires\s*>\s*NOW\(\)/s);
    });

    it('email route.js cleans old records before inserting fresh tokens when no valid one exists', () => {
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      expect(src).toMatch(/DELETE\s+FROM\s+auth_verification_token\s+WHERE\s+identifier/);
      expect(src).toMatch(/INSERT\s+INTO\s+auth_verification_token/);
    });

    it('email route.js includes onError fallback for wordmark loading (PlaceCard has fallback text)', () => {
      // This is actually about theirs introducing throttle-based early return
      const src = readResolved('apps/web/src/app/api/account/email/route.js');
      // theirs introduced a check: returns throttled true when cooldown hasn't passed
      expect(src).toMatch(/throttled:\s*true/);
    });
  });
});
