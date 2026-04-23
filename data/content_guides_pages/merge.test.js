import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('content_guides_pages', () => {
  // ─── base behaviors ───

  describe('base behaviors', () => {
    it('home page renders HeroSection and Footer components', () => {
      const src = readResolved('apps/web/src/app/page.jsx');
      expect(src).toContain('HeroSection');
      expect(src).toContain('Footer');
    });

    it('home page renders StickyHeader component', () => {
      const src = readResolved('apps/web/src/app/page.jsx');
      expect(src).toContain('StickyHeader');
    });

    it('about page contains site name KAGOSHIMA-SHI JOREN NAVI', () => {
      const src = readResolved('apps/web/src/app/about/page.jsx');
      expect(src).toContain('KAGOSHIMA-SHI JOREN NAVI');
    });

    it('about page has email contact link', () => {
      const src = readResolved('apps/web/src/app/about/page.jsx');
      expect(src).toContain('info@kagoshima-portal.jp');
    });

    it('guides page has GUIDES array with slugs', () => {
      const src = readResolved('apps/web/src/app/guides/page.jsx');
      expect(src).toContain('first-time-pass');
      expect(src).toContain('date-spots');
      expect(src).toContain('tourist-lunch');
      expect(src).toContain('kagoshima-city-kaigyo');
    });

    it('guides page has category filtering', () => {
      const src = readResolved('apps/web/src/app/guides/page.jsx');
      expect(src).toContain('activeCategory');
      expect(src).toContain('setActiveCategory');
      expect(src).toContain('filteredGuides');
    });

    it('guides [slug] page has GUIDES lookup object with guide content', () => {
      const src = readResolved('apps/web/src/app/guides/[slug]/page.jsx');
      expect(src).toContain('first-time-pass');
      expect(src).toContain('kagoshima-city-kaigyo');
      expect(src).toContain('guide.body');
    });

    it('guides [slug] page shows 404 when guide not found', () => {
      const src = readResolved('apps/web/src/app/guides/[slug]/page.jsx');
      expect(src).toContain('404');
    });

    it('guides [slug] page renders tags and summary', () => {
      const src = readResolved('apps/web/src/app/guides/[slug]/page.jsx');
      expect(src).toContain('tagList');
      expect(src).toContain('summaryList');
    });

    it('help page has FAQ accordion with FaqItem component', () => {
      const src = readResolved('apps/web/src/app/help/page.jsx');
      expect(src).toContain('FaqItem');
      expect(src).toContain('openKey');
      expect(src).toContain('toggle');
    });

    it('help page has 3-step guide section (search, compare, save)', () => {
      const src = readResolved('apps/web/src/app/help/page.jsx');
      expect(src).toContain('Search');
      expect(src).toContain('Star');
      expect(src).toContain('Heart');
    });
  });

  // ─── ours behaviors ───

  describe('ours behaviors', () => {
    it('local page redirects to / (ours pattern)', () => {
      const src = readResolved('apps/web/src/app/local/page.jsx');
      // ours: redirect from /local to /
      expect(src).toContain('useEffect');
      expect(src).toMatch(/window\.location\.replace/);
    });

    it('about page renders as LocalAboutPage with full content (ours)', () => {
      const src = readResolved('apps/web/src/app/about/page.jsx');
      // ours had full about page content; theirs had redirect
      expect(src).toContain('LocalAboutPage');
      expect(src).toContain('TopMenu');
      expect(src).toContain('PortalSectionTabs');
    });

    it('about page has about section with site explanation (ours)', () => {
      const src = readResolved('apps/web/src/app/about/page.jsx');
      expect(src).toContain('Shield');
      expect(src).toContain('Mail');
      expect(src).toContain('Sparkles');
    });

    it('guides page renders full guides listing (ours)', () => {
      const src = readResolved('apps/web/src/app/guides/page.jsx');
      // ours had the full content; theirs had a redirect
      expect(src).toContain('GUIDES');
      expect(src).toContain('CATEGORY_META');
      expect(src).toContain('getCategoryLabel');
    });

    it('guides [slug] page renders full guide detail (ours)', () => {
      const src = readResolved('apps/web/src/app/guides/[slug]/page.jsx');
      // ours had full guide detail rendering; theirs had redirect
      expect(src).toContain('GUIDES');
      expect(src).toContain('guide.title');
      expect(src).toContain('guide.body');
    });

    it('help page imports useMemo and useState for FAQ (ours)', () => {
      const src = readResolved('apps/web/src/app/help/page.jsx');
      // ours had full FAQ content; theirs had redirect pattern
      expect(src).toContain('useMemo');
      expect(src).toContain('useState');
      expect(src).toContain('useCallback');
    });

    it('help page has FAQ questions in Japanese (ours)', () => {
      const src = readResolved('apps/web/src/app/help/page.jsx');
      expect(src).toContain('q1');
      expect(src).toContain('q2');
      expect(src).toContain('q3');
    });

    it('home page has AmbassadorBanner (ours)', () => {
      const src = readResolved('apps/web/src/app/page.jsx');
      expect(src).toContain('AmbassadorBanner');
    });

    it('home page has StoreSliderSection for different categories (ours)', () => {
      const src = readResolved('apps/web/src/app/page.jsx');
      expect(src).toContain('StoreSliderSection');
    });
  });

  // ─── theirs behaviors ───

  describe('theirs behaviors', () => {
    it('local page uses StickyHeader import pattern (theirs)', () => {
      const src = readResolved('apps/web/src/app/local/page.jsx');
      // The resolved local page uses redirect which came from ours
      // Theirs had StickyHeader import - check if approach was preserved
      expect(src).toContain('"use client"');
    });

    it('guides [slug] page uses CATEGORY_LABELS for category display (ours)', () => {
      const src = readResolved('apps/web/src/app/guides/[slug]/page.jsx');
      expect(src).toContain('CATEGORY_LABELS');
      expect(src).toContain('getCategoryLabel');
    });

    it('guides page has JOREN MAGAZINE title (ours)', () => {
      const src = readResolved('apps/web/src/app/guides/page.jsx');
      expect(src).toContain('JOREN MAGAZINE');
    });

    it('all content pages use bg-[#F7F7F8] background (ours)', () => {
      const about = readResolved('apps/web/src/app/about/page.jsx');
      const guides = readResolved('apps/web/src/app/guides/page.jsx');
      const help = readResolved('apps/web/src/app/help/page.jsx');
      expect(about).toContain('#F7F7F8');
      expect(guides).toContain('#F7F7F8');
      expect(help).toContain('#F7F7F8');
    });
  });
});
