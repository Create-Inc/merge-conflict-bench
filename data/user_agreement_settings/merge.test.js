import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('user_agreement_settings merge', () => {
  describe('base behaviors', () => {
    it('GlobalLayout renders UserAgreementGate component', () => {
      const src = readResolved('apps/web/src/components/GlobalLayout.jsx');
      expect(src).toMatch(/<UserAgreementGate/);
    });

    it('GlobalLayout skips agreement gate on auth routes', () => {
      const src = readResolved('apps/web/src/components/GlobalLayout.jsx');
      expect(src).toMatch(/\/account\/signin/);
      expect(src).toMatch(/\/account\/signup/);
      expect(src).toMatch(/\/account\/logout/);
    });

    it('settings/public route returns user_agreement_text and user_agreement_version', () => {
      const src = readResolved('apps/web/src/app/api/settings/public/route.js');
      expect(src).toMatch(/user_agreement_text/);
      expect(src).toMatch(/user_agreement_version/);
    });

    it('user-agreements/accept route validates user authentication', () => {
      const src = readResolved('apps/web/src/app/api/user-agreements/accept/route.js');
      expect(src).toMatch(/requireAuth2User/);
      expect(src).toMatch(/Unauthorized/);
    });

    it('user-agreements/accept route inserts agreement acceptance into database', () => {
      const src = readResolved('apps/web/src/app/api/user-agreements/accept/route.js');
      expect(src).toMatch(/INSERT INTO.*user_agreements/);
      expect(src).toMatch(/ON CONFLICT.*DO NOTHING/);
    });
  });

  describe('ours behaviors', () => {
    it('GlobalLayout does NOT memoize onAuthRoute check (no useMemo with empty deps)', () => {
      const src = readResolved('apps/web/src/components/GlobalLayout.jsx');
      // Ours: do NOT memoize because layout stays mounted across client-side navigation
      // Should use IIFE or inline computation, not useMemo with []
      const onAuthRouteSection = src.match(/onAuthRoute\s*=[\s\S]{0,200}/);
      expect(onAuthRouteSection).not.toBeNull();
      // Should NOT be useMemo(() => { ... }, [])
      expect(src).not.toMatch(/onAuthRoute\s*=\s*useMemo\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\}\s*,\s*\[\s*\]\s*\)/);
    });

    it('settings/public route treats agreement as configured when version is set', () => {
      const src = readResolved('apps/web/src/app/api/settings/public/route.js');
      // Ours: VERSION being set is enough to consider it configured
      expect(src).toMatch(/agreementVersionRaw/);
      expect(src).toMatch(/userAgreementVersion/);
    });

    it('settings/public route preserves formatting of agreement text', () => {
      const src = readResolved('apps/web/src/app/api/settings/public/route.js');
      // The agreement text should be passed through without stripping
      expect(src).toMatch(/user_agreement_text/);
    });
  });

  describe('theirs behaviors', () => {
    it('GlobalLayout also skips agreement gate on onboarding routes', () => {
      const src = readResolved('apps/web/src/components/GlobalLayout.jsx');
      expect(src).toMatch(/\/onboarding/);
    });

    it('user-agreements/accept route checks if agreement version exists before accepting', () => {
      const src = readResolved('apps/web/src/app/api/user-agreements/accept/route.js');
      // Theirs: check if agreement is enabled/has version before processing
      expect(src).toMatch(/hasCurrentVersion|enabled/);
      expect(src).toMatch(/No agreement configured/);
    });

    it('user-agreements/accept route returns 400 when no agreement is configured', () => {
      const src = readResolved('apps/web/src/app/api/user-agreements/accept/route.js');
      expect(src).toMatch(/status:\s*400/);
    });

    it('settings/public route returns null version when no agreement is configured', () => {
      const src = readResolved('apps/web/src/app/api/settings/public/route.js');
      // On error, version should be null (no gate)
      const errorBlock = src.match(/catch[\s\S]*?user_agreement_version:\s*(\w+)/);
      expect(errorBlock).not.toBeNull();
      expect(errorBlock[1]).toBe('null');
    });
  });
});
