import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('meta_oauth_connect merge', () => {
  describe('base behaviors', () => {
    it('MetaConnectSection handles "connected" meta param', () => {
      const src = readResolved('apps/web/src/components/Dashboard/ProfileTab/components/MetaConnectSection.jsx');
      expect(src).toContain('"connected"');
      expect(src).toMatch(/Meta connected/);
    });

    it('MetaConnectSection handles "forbidden" meta param', () => {
      const src = readResolved('apps/web/src/components/Dashboard/ProfileTab/components/MetaConnectSection.jsx');
      expect(src).toContain('"forbidden"');
    });

    it('MetaConnectSection handles "config_error" meta param', () => {
      const src = readResolved('apps/web/src/components/Dashboard/ProfileTab/components/MetaConnectSection.jsx');
      expect(src).toContain('"config_error"');
    });

    it('callback route validates code and state params', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/callback/route.js');
      expect(src).toMatch(/Missing code or state/);
    });

    it('callback route verifies state signature', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/callback/route.js');
      expect(src).toMatch(/signState/);
      expect(src).toMatch(/Invalid state signature/);
    });

    it('start route requires businessId parameter', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/start/route.js');
      expect(src).toMatch(/businessId is required/);
    });

    it('start route checks META_APP_ID and META_APP_SECRET', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/start/route.js');
      expect(src).toMatch(/META_APP_ID/);
      expect(src).toMatch(/META_APP_SECRET/);
    });

    it('callback route redirects to dashboard with config_error when Meta app config is missing', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/callback/route.js');
      expect(src).toMatch(/config_error/);
    });
  });

  describe('ours behaviors', () => {
    it('callback route checks Accept header for HTML-friendly redirects', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/callback/route.js');
      // Ours added Accept header checking to decide between JSON API and HTML redirects
      expect(src).toMatch(/accept.*text\/html|text\/html.*accept/i);
    });

    it('callback route redirects to signin on 401 with callback URL preservation', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/callback/route.js');
      // Ours: redirect to /account/signin with callbackUrl preserving code+state
      expect(src).toMatch(/\/account\/signin\?callbackUrl/);
    });

    it('start route redirects to signin on 401 with callbackUrl', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/start/route.js');
      expect(src).toMatch(/\/account\/signin\?callbackUrl/);
    });

    it('start route checks Accept header for HTML-friendly redirects', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/start/route.js');
      expect(src).toMatch(/accept.*text\/html|text\/html.*accept/i);
    });
  });

  describe('theirs behaviors', () => {
    it('MetaConnectSection handles "signin_required" meta param', () => {
      const src = readResolved('apps/web/src/components/Dashboard/ProfileTab/components/MetaConnectSection.jsx');
      expect(src).toContain('"signin_required"');
      expect(src).toMatch(/sign in to connect Meta/i);
    });

    it('callback route redirects to forbidden on 403 status', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/callback/route.js');
      // Both branches handle 403 -> forbidden redirect
      expect(src).toMatch(/status\s*===\s*403/);
      expect(src).toMatch(/forbidden/);
    });

    it('start route redirects to dashboard with error as catch-all', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/start/route.js');
      // Theirs added a catch-all redirect to dashboard with error
      expect(src).toMatch(/safeDashboardRedirect.*error/);
    });

    it('start route uses safeDashboardRedirect helper', () => {
      const src = readResolved('apps/web/src/app/api/meta/oauth/start/route.js');
      expect(src).toMatch(/function\s+safeDashboardRedirect/);
    });
  });
});
