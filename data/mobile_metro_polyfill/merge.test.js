import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('mobile_metro_polyfill', () => {
  describe('base behaviors', () => {
    it('metroconfig.js forwards to src/metro.config.js', () => {
      const src = readResolved('apps/mobile/metroconfig.js');
      expect(src).toMatch(/require\s*\(\s*["']\.\/src\/metro\.config\.js["']\s*\)/);
    });

    it('reflectConstructPolyfill.js defines an IIFE that runs immediately', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/\(function\s+ensureReflectConstruct/);
    });

    it('reflectConstructPolyfill.js sets construct.sham = true', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/\.sham\s*=\s*true/);
    });

    it('reflectConstructPolyfill.js ensures .apply exists on construct', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/construct\.apply/);
    });

    it('reflectConstructPolyfill.js locks Reflect with Object.defineProperty', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/Object\.defineProperty\s*\(\s*reflectObj\s*,\s*["']construct["']/);
    });

    it('reflectConstructPrelude.js is a prelude IIFE for Metro', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/\(function\s+ensureReflectConstructPrelude/);
    });

    it('reflectConstructPrelude.js uses module.exports (CommonJS)', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/module\.exports/);
    });

    it('reflectConstructPrelude.js sets construct.sham = true', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/\.sham\s*=\s*true/);
    });

    it('reflectConstructPrelude.js ensures .apply exists on construct', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/construct\.apply/);
    });
  });

  describe('ours behaviors', () => {
    it('reflectConstructPolyfill.js checks needsReplacement based on typeof construct and typeof construct.apply', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/needsReplacement/);
      expect(src).toMatch(/typeof\s+existing\.construct\s*!==\s*["']function["']/);
      expect(src).toMatch(/typeof\s+existing\.construct\.apply\s*!==\s*["']function["']/);
    });

    it('reflectConstructPrelude.js checks needsReplacement based on typeof construct and typeof construct.apply', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/needsReplacement/);
      expect(src).toMatch(/typeof\s+existing\.construct\s*!==\s*["']function["']/);
      expect(src).toMatch(/typeof\s+existing\.construct\.apply\s*!==\s*["']function["']/);
    });
  });

  describe('theirs behaviors', () => {
    it('metroconfig.js comment references the Anything project context', () => {
      const src = readResolved('apps/mobile/metroconfig.js');
      expect(src).toMatch(/Anything\s+project/i);
    });

    it('reflectConstructPolyfill.js creates a next object and copies existing keys before replacing', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/const\s+next\s*=\s*\{\s*\}/);
      expect(src).toMatch(/for\s*\(\s*const\s+k\s+in\s+existing\)/);
    });

    it('reflectConstructPolyfill.js tries g.Reflect = next with fallback to existing.construct = next.construct', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/g\.Reflect\s*=\s*next/);
      expect(src).toMatch(/existing\.construct\s*=\s*next\.construct/);
    });

    it('reflectConstructPolyfill.js uses reflectObj variable to track the active Reflect reference', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPolyfill.js');
      expect(src).toMatch(/let\s+reflectObj\s*=\s*existing/);
    });

    it('reflectConstructPrelude.js creates a next object and copies existing keys before replacing', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/const\s+next\s*=\s*\{\s*\}/);
      expect(src).toMatch(/for\s*\(\s*const\s+k\s+in\s+existing\)/);
    });

    it('reflectConstructPrelude.js tries g.Reflect = next with fallback to existing.construct = next.construct', () => {
      const src = readResolved('apps/mobile/src/utils/reflectConstructPrelude.js');
      expect(src).toMatch(/g\.Reflect\s*=\s*next/);
      expect(src).toMatch(/existing\.construct\s*=\s*next\.construct/);
    });
  });
});
