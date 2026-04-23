import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('admin_manual_docs', () => {
  describe('base behaviors', () => {
    it('PageContent exports a named function PageContent', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageContent.jsx');
      expect(src).toMatch(/export\s+function\s+PageContent/);
    });

    it('PageContent renders Section components for each section', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageContent.jsx');
      expect(src).toMatch(/<Section/);
    });

    it('PageNotFound exports a named function PageNotFound', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageNotFound.jsx');
      expect(src).toMatch(/export\s+function\s+PageNotFound/);
    });

    it('PageNotFound renders "Page not found" heading', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageNotFound.jsx');
      expect(src).toMatch(/Page not found/);
    });

    it('PageHeader exports a named function PageHeader', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/export\s+function\s+PageHeader/);
    });

    it('PageHeader renders the page title and summary', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/page\.title/);
      expect(src).toMatch(/page\.summary/);
    });

    it('pagesContent exports ADMIN_MANUAL_PAGES array', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/data/pagesContent.jsx');
      expect(src).toMatch(/export\s+const\s+ADMIN_MANUAL_PAGES/);
    });

    it('pageHelpers exports getOrderedPages and getNavSlugs', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/utils/pageHelpers.js');
      expect(src).toMatch(/export\s+function\s+getOrderedPages/);
      expect(src).toMatch(/export\s+function\s+getNavSlugs/);
    });
  });

  describe('ours behaviors', () => {
    it('PageContent shows "Content coming soon" when sections are empty', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageContent.jsx');
      expect(src).toMatch(/Content coming soon/);
    });

    it('PageContent receives backToTopOnClick prop and passes it to Section', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageContent.jsx');
      expect(src).toMatch(/backToTopOnClick/);
    });

    it('PageNotFound renders navigation links from orderedPages', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageNotFound.jsx');
      expect(src).toMatch(/orderedPages/);
      expect(src).toMatch(/\/documentation\/admin-manual\//);
    });

    it('PageHeader imports LAST_UPDATED and WHO_FOR from constants', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/LAST_UPDATED/);
      expect(src).toMatch(/WHO_FOR/);
    });

    it('PageHeader renders "Who this is for" and "Last updated" info', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/Who this is for/);
      expect(src).toMatch(/Last updated/);
    });
  });

  describe('theirs behaviors', () => {
    it('PageHeader renders "Back to Admin Manual" link', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/Back to Admin Manual/);
    });

    it('PageHeader renders Documentation breadcrumb link with ArrowRight', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/Documentation/);
      expect(src).toMatch(/ArrowRight/);
    });

    it('PageHeader uses ICON_MAP to resolve page icon by name', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/components/PageHeader.jsx');
      expect(src).toMatch(/ICON_MAP/);
      expect(src).toMatch(/page\.icon/);
    });

    it('pageHelpers exports ADMIN_MANUAL_PAGE_MAP as a Map', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/utils/pageHelpers.js');
      expect(src).toMatch(/ADMIN_MANUAL_PAGE_MAP\s*=\s*new\s+Map/);
    });

    it('pageHelpers getNavSlugs returns prevSlug and nextSlug', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/utils/pageHelpers.js');
      expect(src).toMatch(/prevSlug/);
      expect(src).toMatch(/nextSlug/);
    });

    it('pagesContent includes pages for core admin topics', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/data/pagesContent.jsx');
      expect(src).toMatch(/admin-overview/);
      expect(src).toMatch(/roles-and-permissions/);
      expect(src).toMatch(/user-management/);
      expect(src).toMatch(/system-health/);
      expect(src).toMatch(/audit-logs/);
    });

    it('pagesContent includes ai-governance and incident-response pages', () => {
      const src = readResolved('apps/web/src/app/documentation/admin-manual/[slug]/data/pagesContent.jsx');
      expect(src).toMatch(/ai-governance/);
      expect(src).toMatch(/incident-response/);
    });
  });
});
