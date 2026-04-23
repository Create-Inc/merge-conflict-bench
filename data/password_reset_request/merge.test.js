import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('password_reset_request merge', () => {
  describe('base behaviors', () => {
    it('forgot-password page has email input and submit button', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/type="email"/);
      expect(src).toMatch(/type="submit"/);
    });

    it('forgot-password page normalizes email input', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/normalizeEmail/);
    });

    it('forgot-password page shows success message without revealing account existence', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/If an account exists/);
    });

    it('API route always responds with ok:true to prevent email enumeration', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/ok:\s*true/);
    });

    it('API route generates random token and stores in database', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/crypto\.randomBytes/);
      expect(src).toMatch(/password_reset_tokens/);
    });

    it('API route invalidates previous tokens before creating new one', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/UPDATE password_reset_tokens SET used = true/);
    });

    it('API route sends email via sendEmail utility', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/sendEmail/);
    });
  });

  describe('ours behaviors', () => {
    it('forgot-password page has sendHint state for email delivery issues', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/sendHint/);
      expect(src).toMatch(/setSendHint/);
    });

    it('forgot-password page has devResetUrl state for development convenience', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/devResetUrl/);
      expect(src).toMatch(/setDevResetUrl/);
    });

    it('forgot-password page has devEmailError state', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/devEmailError/);
      expect(src).toMatch(/setDevEmailError/);
    });

    it('forgot-password page displays sendHint warning when email delivery fails', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/Email delivery issue/);
    });

    it('forgot-password page shows email_send_failed hint when sending fails in prod', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/email_send_failed/);
    });

    it('forgot-password page references RESEND_API_KEY in error message for unconfigured email', () => {
      const src = readResolved('apps/web/src/app/account/forgot-password/page.jsx');
      expect(src).toMatch(/RESEND_API_KEY/);
    });
  });

  describe('theirs behaviors', () => {
    it('API route returns devResetUrl in non-production environments', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/devResetUrl/);
      expect(src).toMatch(/isProd/);
    });

    it('API route returns devEmailError in non-production environments', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/devEmailError/);
    });

    it('API route returns hint "email_send_failed" in prod when email configured but send fails', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/email_send_failed/);
    });

    it('API route checks emailConfigured flag based on RESEND_API_KEY', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/RESEND_API_KEY/);
      expect(src).toMatch(/emailConfigured/);
    });

    it('API route uses getAppBaseUrl to construct reset URL matching request environment', () => {
      const src = readResolved('apps/web/src/app/api/password-reset/request/route.js');
      expect(src).toMatch(/getAppBaseUrl/);
    });
  });
});
