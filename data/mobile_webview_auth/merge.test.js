import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('mobile_webview_auth merge', () => {
  describe('base behaviors', () => {
    it('webViewHandlers exports createWebViewHandlers function', () => {
      const src = readResolved('apps/mobile/src/utils/auth/handlers/webViewHandlers.js');
      expect(src).toMatch(/export\s+function\s+createWebViewHandlers/);
    });

    it('webViewHandlers has isFinalStepUrl that recognizes auth token paths', () => {
      const src = readResolved('apps/mobile/src/utils/auth/handlers/webViewHandlers.js');
      expect(src).toMatch(/isFinalStepUrl/);
      expect(src).toContain('/api/auth/token');
      expect(src).toContain('/mobile-auth/callback');
      expect(src).toContain('/mobile-auth/complete');
    });

    it('webViewHandlers returns onNavigationStateChange, onLoadEnd, onError, onHttpError, onMessage handlers', () => {
      const src = readResolved('apps/mobile/src/utils/auth/handlers/webViewHandlers.js');
      expect(src).toMatch(/onNavigationStateChange/);
      expect(src).toMatch(/onLoadEnd/);
      expect(src).toMatch(/onError/);
      expect(src).toMatch(/onHttpError/);
      expect(src).toMatch(/onMessage/);
    });

    it('callback page redirects to /api/auth/token inside WebView', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/callback/page.jsx');
      expect(src).toMatch(/\/api\/auth\/token/);
    });

    it('complete page redirects to /api/auth/token inside WebView', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/complete/page.jsx');
      expect(src).toMatch(/\/api\/auth\/token/);
    });

    it('callback and complete pages have Try again and Back to sign in links', () => {
      const callbackSrc = readResolved('apps/web/src/app/mobile-auth/callback/page.jsx');
      const completeSrc = readResolved('apps/web/src/app/mobile-auth/complete/page.jsx');
      expect(callbackSrc).toContain('Try again');
      expect(callbackSrc).toContain('Back to sign in');
      expect(completeSrc).toContain('Try again');
      expect(completeSrc).toContain('Back to sign in');
    });
  });

  describe('ours behaviors', () => {
    it('webViewHandlers does NOT start native token exchange in onLoadEnd for final step URLs', () => {
      const src = readResolved('apps/mobile/src/utils/auth/handlers/webViewHandlers.js');
      // Ours: when on /api/auth/token, do NOT also run native POST exchange
      // The onLoadEnd should set isExchangingToken but NOT call exchangeTokenNative
      const onLoadEndMatch = src.match(/const\s+onLoadEnd\s*=[\s\S]*?(?=const\s+on(?:Error|Message|HttpError|Should)\s*=)/);
      if (onLoadEndMatch) {
        expect(onLoadEndMatch[0]).not.toMatch(/exchangeTokenNative\s*\(/);
      }
    });

    it('webViewHandlers keeps exchangeTokenNative as last-resort fallback', () => {
      const src = readResolved('apps/mobile/src/utils/auth/handlers/webViewHandlers.js');
      // The native exchange function should still exist as a fallback
      expect(src).toMatch(/exchangeTokenNative/);
    });
  });

  describe('theirs behaviors', () => {
    it('callback page imports useState', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/callback/page.jsx');
      expect(src).toMatch(/useState/);
    });

    it('complete page imports useState', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/complete/page.jsx');
      expect(src).toMatch(/useState/);
    });

    it('callback page has redirectError state and displays error UI', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/callback/page.jsx');
      expect(src).toMatch(/redirectError/);
      expect(src).toMatch(/setRedirectError/);
    });

    it('complete page has redirectError state and displays error UI', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/complete/page.jsx');
      expect(src).toMatch(/redirectError/);
      expect(src).toMatch(/setRedirectError/);
    });

    it('callback page describes the /api/auth/token GET -> postMessage flow', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/callback/page.jsx');
      // Theirs added IMPORTANT comment about the GET -> postMessage flow
      expect(src).toMatch(/\/api\/auth\/token/);
      expect(src).toMatch(/AUTH_SUCCESS/i);
    });

    it('complete page describes the /api/auth/token GET -> postMessage flow', () => {
      const src = readResolved('apps/web/src/app/mobile-auth/complete/page.jsx');
      expect(src).toMatch(/\/api\/auth\/token/);
      expect(src).toMatch(/AUTH_SUCCESS/i);
    });
  });
});
