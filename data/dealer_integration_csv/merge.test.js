import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('dealer_integration_csv', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('logout page uses useAuth hook for signOut', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      expect(src).toContain('useAuth');
      expect(src).toContain('signOut');
    });

    it('logout page has auto-logout support via query param', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      expect(src).toContain('auto');
      expect(src).toMatch(/params\.get\(\s*"auto"\s*\)/);
    });

    it('logout page reads final URL from query params', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      expect(src).toContain('finalUrl');
      expect(src).toMatch(/params\.get\(\s*"final"\s*\)/);
    });

    it('logout page has error state display', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      expect(src).toContain('setError');
      expect(src).toContain('bg-red-50');
    });

    it('useCsvHandlers validates CSV file type by name and mime', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('text/csv');
      expect(src).toContain('application/csv');
      expect(src).toContain('application/vnd.ms-excel');
      expect(src).toContain('text/plain');
    });

    it('useCsvHandlers validates file is not empty', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('file.size');
      expect(src).toMatch(/empty/i);
    });

    it('useCsvHandlers provides CSV URL and SFTP save functions', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('onSaveCsvUrl');
      expect(src).toContain('onClearCsvUrl');
      expect(src).toContain('onSaveSftp');
    });

    it('useCsvHandlers blocks inline:// placeholder from being saved as URL', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('inline://');
      expect(src).toMatch(/not a real URL/i);
    });

    it('IntegrationTab renders provider toggles and cards', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('IntegrationToggles');
      expect(src).toContain('IntegrationCard');
    });

    it('IntegrationTab has Add Integration button and modal', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('Add Integration');
      expect(src).toContain('AddIntegrationModal');
    });

    it('IntegrationTab has DMS request handling', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('DmsRequestBanner');
      expect(src).toContain('handleMarkDmsRequestHandled');
    });

    it('IntegrationTab supports frazer/dominion/autosoft editors', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('frazerEditor');
      expect(src).toContain('dominionEditor');
      expect(src).toContain('autosoftEditor');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('logout page handleSignOut is async (theirs)', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      // theirs made handleSignOut async with await signOut
      expect(src).toMatch(/handleSignOut\s*=\s*useCallback\(\s*async/);
    });

    it('logout page uses signOut with callbackUrl and redirect options (theirs)', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      expect(src).toContain('callbackUrl');
      expect(src).toContain('redirect: true');
    });

    it('logout page error message uses theirs wording', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      expect(src).toContain('Sign out failed');
    });

    it('useCsvHandlers has uploading = false (theirs inline pattern)', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      // theirs set uploading = false since we store inline
      expect(src).toMatch(/const\s+uploading\s*=\s*false/);
    });

    it('useCsvHandlers uses readFileAsText helper (theirs)', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('readFileAsText');
      expect(src).toContain('FileReader');
    });

    it('useCsvHandlers error on read failure uses theirs wording', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('Failed reading CSV file');
    });

    it('useCsvHandlers empty check uses theirs pattern', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      // theirs: if (!inlineText || !String(inlineText).trim())
      expect(src).toMatch(/!inlineText\s*\|\|\s*!String\(inlineText\)\.trim\(\)/);
    });

    it('useCsvHandlers size limit is 900_000 (theirs)', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('900_000');
    });

    it('useCsvHandlers stores csvInlineText as inlineText not trimmed (theirs)', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      // theirs: csvInlineText: inlineText (not trimmed)
      expect(src).toMatch(/csvInlineText:\s*inlineText/);
    });

    it('useCsvHandlers save failure message uses theirs wording', () => {
      const src = readResolved('apps/web/src/components/Settings/IntegrationsSection/useCsvHandlers.js');
      expect(src).toContain('We read your CSV file, but could not save it');
    });

    it('IntegrationTab success message uses theirs wording for enabled', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('Enabled. Setup opened below.');
    });

    it('IntegrationTab CRM refreshing message uses theirs wording', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('CRM is refreshing');
    });

    it('IntegrationTab imports useMemo (theirs)', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('useMemo');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('logout page navigates through /logout route first (ours)', () => {
      const src = readResolved('apps/web/src/app/account/logout/page.jsx');
      // ours preferred /logout route over signOut
      expect(src).toContain('/logout?final=');
      expect(src).toContain('bounce=1');
    });

    it('IntegrationTab imports useCallback (ours)', () => {
      const src = readResolved('apps/web/src/components/Platform/DealershipDetailModal/IntegrationTab.jsx');
      expect(src).toContain('useCallback');
    });
  });
});
