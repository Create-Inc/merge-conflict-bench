import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('telephony_voice_test', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('telephony-test page imports lucide icons and has test connection button', () => {
      const src = readResolved('apps/web/src/app/admin/telephony-test/page.jsx');
      expect(src).toContain('"use client"');
      expect(src).toContain('CheckCircle');
      expect(src).toContain('XCircle');
      expect(src).toContain('Test Configuration');
    });

    it('telephony-test page calls /api/telephony/test endpoint', () => {
      const src = readResolved('apps/web/src/app/admin/telephony-test/page.jsx');
      expect(src).toContain('/api/telephony/test');
    });

    it('telephony-test page has send test SMS section', () => {
      const src = readResolved('apps/web/src/app/admin/telephony-test/page.jsx');
      expect(src).toContain('Send Test SMS');
      expect(src).toContain('/api/sms/send');
    });

    it('telephony-test page shows Flagman Telecom secrets status', () => {
      const src = readResolved('apps/web/src/app/admin/telephony-test/page.jsx');
      expect(src).toContain('FLAGMAN_SMS_URL');
      expect(src).toContain('FLAGMAN_FROM_NUMBER');
      expect(src).toContain('FLAGMAN_API_TOKEN_ID');
      expect(src).toContain('FLAGMAN_API_GENERATE_TOKEN');
    });

    it('telephony/test route imports getTelephonyStatus', () => {
      const src = readResolved('apps/web/src/app/api/telephony/test/route.js');
      expect(src).toContain('getTelephonyStatus');
    });

    it('telephony/test route returns success false when provider is not configured', () => {
      const src = readResolved('apps/web/src/app/api/telephony/test/route.js');
      expect(src).toContain('success: false');
      expect(src).toContain('Flagman Telecom is not configured');
    });

    it('telephony/test route returns instructions when not configured', () => {
      const src = readResolved('apps/web/src/app/api/telephony/test/route.js');
      expect(src).toContain('Set Flagman secrets');
    });

    it('telephony/test route returns success true when configured', () => {
      const src = readResolved('apps/web/src/app/api/telephony/test/route.js');
      expect(src).toMatch(/success:\s*true/);
      expect(src).toContain('Telephony is configured');
    });

    it('outbound-twiml route returns XML with Say element', () => {
      const src = readResolved('apps/web/src/app/api/voice/outbound-twiml/route.js');
      expect(src).toContain('<Say voice="alice">');
      expect(src).toContain('Content-Type');
      expect(src).toContain('application/xml');
    });

    it('outbound-twiml route has Pause element for 60 seconds', () => {
      const src = readResolved('apps/web/src/app/api/voice/outbound-twiml/route.js');
      expect(src).toContain('<Pause length="60"/>');
    });

    it('outbound-twiml route reads message from searchParams', () => {
      const src = readResolved('apps/web/src/app/api/voice/outbound-twiml/route.js');
      expect(src).toContain('searchParams');
      expect(src).toContain('message');
    });

    it('outbound-twiml route returns Hangup on error', () => {
      const src = readResolved('apps/web/src/app/api/voice/outbound-twiml/route.js');
      expect(src).toContain('<Hangup/>');
    });

    it('integrations page has telephony/stripe/google/sendgrid/slack/zapier', () => {
      const src = readResolved('apps/web/src/app/admin/settings/integrations/page.jsx');
      expect(src).toContain('telephony');
      expect(src).toContain('stripe');
      expect(src).toContain('googleCalendar');
      expect(src).toContain('sendgrid');
      expect(src).toContain('slack');
      expect(src).toContain('zapier');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('telephony-test page imports useMemo (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/telephony-test/page.jsx');
      expect(src).toContain('useMemo');
    });

    it('telephony-test page derives activeProvider from result using useMemo (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/telephony-test/page.jsx');
      expect(src).toContain('activeProvider');
      expect(src).toMatch(/result\?\.data\?\.status\?\.provider/);
    });

    it('twilio-test page re-exports from telephony-test (theirs pattern)', () => {
      const src = readResolved('apps/web/src/app/admin/twilio-test/page.jsx');
      // theirs used export { default } from pattern
      expect(src).toContain('telephony-test');
    });

    it('voice-test page fetches /api/voice/outbound for calls (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/voice-test/page.jsx');
      expect(src).toContain('/api/voice/outbound');
      expect(src).toContain('to_number');
    });

    it('voice-test page has message textarea (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/voice-test/page.jsx');
      expect(src).toContain('textarea');
      expect(src).toContain('message');
    });

    it('voice-test page title is Outbound Call Tester (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/voice-test/page.jsx');
      expect(src).toContain('Outbound Call Tester');
    });

    it('voice-test page shows result with JSON.stringify (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/voice-test/page.jsx');
      expect(src).toContain('JSON.stringify(result.data, null, 2)');
    });

    it('voice-test page notes section mentions E.164 format (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/voice-test/page.jsx');
      expect(src).toContain('E.164');
    });

    it('voice-test page notes mention FLAGMAN_CALL_URL (theirs)', () => {
      const src = readResolved('apps/web/src/app/admin/voice-test/page.jsx');
      expect(src).toContain('FLAGMAN_CALL_URL');
    });

    it('twilio/test route re-exports from telephony/test (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/twilio/test/route.js');
      expect(src).toContain('@/app/api/telephony/test/route');
    });

    it('outbound-twiml error message uses theirs wording', () => {
      const src = readResolved('apps/web/src/app/api/voice/outbound-twiml/route.js');
      expect(src).toContain('Error generating outbound voice XML');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('integrations page includes Phone icon import (ours)', () => {
      const src = readResolved('apps/web/src/app/admin/settings/integrations/page.jsx');
      expect(src).toContain('Phone');
    });

    it('integrations page includes telephony config with Flagman Telecom name (ours)', () => {
      const src = readResolved('apps/web/src/app/admin/settings/integrations/page.jsx');
      expect(src).toContain('Flagman Telecom');
      expect(src).toContain('SMS and calling');
    });

    it('integrations page telephony section links to /admin/telephony-test (ours)', () => {
      const src = readResolved('apps/web/src/app/admin/settings/integrations/page.jsx');
      expect(src).toContain('/admin/telephony-test');
      expect(src).toContain('Open Telephony Test');
    });

    it('integrations page has telephony enabled true by default (ours)', () => {
      const src = readResolved('apps/web/src/app/admin/settings/integrations/page.jsx');
      // telephony: { enabled: true, configured: false }
      expect(src).toMatch(/telephony:\s*\{[^}]*enabled:\s*true/);
    });
  });
});
