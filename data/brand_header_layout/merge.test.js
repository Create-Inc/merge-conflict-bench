import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('brand_header_layout', () => {
  describe('base behaviors', () => {
    it('mobile brand.js exports BRAND_NAME, BRAND_WORDMARK_URL, BRAND_LOGO_URL', () => {
      const src = readResolved('apps/mobile/src/utils/brand.js');
      expect(src).toMatch(/export\s+const\s+BRAND_NAME\b/);
      expect(src).toMatch(/export\s+const\s+BRAND_WORDMARK_URL\b/);
      expect(src).toMatch(/export\s+const\s+BRAND_LOGO_URL\b/);
    });

    it('web brand.js exports BRAND_NAME, BRAND_WORDMARK_URL, BRAND_LOGO_URL', () => {
      const src = readResolved('apps/web/src/utils/brand.js');
      expect(src).toMatch(/export\s+const\s+BRAND_NAME\b/);
      expect(src).toMatch(/export\s+const\s+BRAND_WORDMARK_URL\b/);
      expect(src).toMatch(/export\s+const\s+BRAND_LOGO_URL\b/);
    });

    it('mobile brand.js exports applyTrademark function', () => {
      const src = readResolved('apps/mobile/src/utils/brand.js');
      expect(src).toMatch(/export\s+function\s+applyTrademark/);
    });

    it('web brand.js exports applyTrademark function', () => {
      const src = readResolved('apps/web/src/utils/brand.js');
      expect(src).toMatch(/export\s+function\s+applyTrademark/);
    });

    it('AppHeader imports BRAND_WORDMARK_URL and BRAND_LOGO_URL', () => {
      const src = readResolved('apps/mobile/src/components/AppHeader.jsx');
      expect(src).toMatch(/BRAND_WORDMARK_URL/);
      expect(src).toMatch(/BRAND_LOGO_URL/);
    });

    it('ScribeHeader imports BRAND_WORDMARK_URL and BRAND_LOGO_URL', () => {
      const src = readResolved('apps/mobile/src/components/ScribeScreen/ScribeHeader.jsx');
      expect(src).toMatch(/BRAND_WORDMARK_URL/);
      expect(src).toMatch(/BRAND_LOGO_URL/);
    });

    it('web Header imports BRAND_WORDMARK_URL and BRAND_LOGO_URL', () => {
      const src = readResolved('apps/web/src/components/Layout/Header.jsx');
      expect(src).toMatch(/BRAND_WORDMARK_URL/);
      expect(src).toMatch(/BRAND_LOGO_URL/);
    });
  });

  describe('ours behaviors', () => {
    it('mobile and web brand.js use the same BRAND_WORDMARK_URL (d3dcc884 asset)', () => {
      const mobileSrc = readResolved('apps/mobile/src/utils/brand.js');
      const webSrc = readResolved('apps/web/src/utils/brand.js');
      expect(mobileSrc).toMatch(/d3dcc884-5dc2-4db3-969f-b819f4705205/);
      expect(webSrc).toMatch(/d3dcc884-5dc2-4db3-969f-b819f4705205/);
    });

    it('AppHeader uses wordmark dimensions 225x30 (larger for readability)', () => {
      const src = readResolved('apps/mobile/src/components/AppHeader.jsx');
      expect(src).toMatch(/width:\s*225/);
      expect(src).toMatch(/height:\s*30/);
    });

    it('ScribeHeader uses wordmark dimensions 225x30 (larger for readability)', () => {
      const src = readResolved('apps/mobile/src/components/ScribeScreen/ScribeHeader.jsx');
      expect(src).toMatch(/width:\s*225/);
      expect(src).toMatch(/height:\s*30/);
    });

    it('web Header uses larger wordmark height (h-10 or h-12)', () => {
      const src = readResolved('apps/web/src/components/Layout/Header.jsx');
      expect(src).toMatch(/h-10|h-12/);
    });
  });

  describe('theirs behaviors', () => {
    it('AppHeader has wordmark fallback with onError handler', () => {
      const src = readResolved('apps/mobile/src/components/AppHeader.jsx');
      expect(src).toMatch(/onError/);
      expect(src).toMatch(/setWordmarkFailed/);
    });

    it('AppHeader renders BRAND_NAME as text when wordmark fails', () => {
      const src = readResolved('apps/mobile/src/components/AppHeader.jsx');
      expect(src).toMatch(/wordmarkFailed/);
      expect(src).toMatch(/BRAND_NAME/);
    });

    it('ScribeHeader has wordmark fallback with onError handler', () => {
      const src = readResolved('apps/mobile/src/components/ScribeScreen/ScribeHeader.jsx');
      expect(src).toMatch(/onError/);
      expect(src).toMatch(/setWordmarkFailed/);
    });

    it('ScribeHeader renders BRAND_NAME as text when wordmark fails', () => {
      const src = readResolved('apps/mobile/src/components/ScribeScreen/ScribeHeader.jsx');
      expect(src).toMatch(/wordmarkFailed/);
      expect(src).toMatch(/BRAND_NAME/);
    });

    it('web Header has wordmark fallback with onError handler', () => {
      const src = readResolved('apps/web/src/components/Layout/Header.jsx');
      expect(src).toMatch(/onError/);
      expect(src).toMatch(/setWordmarkFailed/);
    });

    it('web Header renders brandName text as fallback when wordmark fails', () => {
      const src = readResolved('apps/web/src/components/Layout/Header.jsx');
      expect(src).toMatch(/wordmarkFailed/);
      expect(src).toMatch(/brandName/);
    });
  });
});
