import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf8');
}

describe('explore_featured_places', () => {
  describe('base behaviors', () => {
    it('PlaceCard imports from react-native and expo-image', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/from\s+["']react-native["']/);
      expect(src).toMatch(/from\s+["']expo-image["']/);
    });

    it('PlaceCard imports SEMANTIC_COLORS from ExploreScreen constants', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/SEMANTIC_COLORS.*from.*ExploreScreen\/constants/);
    });

    it('PlaceCard defines normalizeText, normalizeStringList, pickFirstGalleryUrl, pickSecondaryContext, pickOperationalFlag helpers', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/function\s+normalizeText/);
      expect(src).toMatch(/function\s+normalizeStringList/);
      expect(src).toMatch(/function\s+pickFirstGalleryUrl/);
      expect(src).toMatch(/function\s+pickSecondaryContext/);
      expect(src).toMatch(/function\s+pickOperationalFlag/);
    });

    it('PlaceCard renders perk badge with Member Perk text', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/Member Perk/);
    });

    it('PlaceCard reads hasActivePerk from both camelCase and snake_case fields', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/place\?\.hasActivePerk/);
      expect(src).toMatch(/place\?\.has_active_perk/);
    });

    it('FeaturedPlacesSection renders Featured Places title', () => {
      const src = readResolved('apps/mobile/src/components/consumer/ExploreScreen/components/FeaturedPlacesSection.jsx');
      expect(src).toMatch(/Featured Places/);
    });

    it('perksHandler imports and uses isUserProMember and getFamilyContext', () => {
      const src = readResolved('apps/web/src/app/api/content/itineraries/handlers/perksHandler.js');
      expect(src).toMatch(/isUserProMember/);
      expect(src).toMatch(/getFamilyContext/);
    });

    it('perksHandler filters restricted vibes for junior explorers', () => {
      const src = readResolved('apps/web/src/app/api/content/itineraries/handlers/perksHandler.js');
      expect(src).toMatch(/isRestrictedForJunior/);
      expect(src).toMatch(/late night|adult-only|adult only/i);
    });
  });

  describe('ours behaviors', () => {
    it('perksHandler freeStateBoostSql uses trailing comma before CASE (or leading comma pattern)', () => {
      const src = readResolved('apps/web/src/app/api/content/itineraries/handlers/perksHandler.js');
      // ours put a comma before the state-boost CASE expression in the ORDER BY
      // The resolved version should have the state boost SQL expression integrated in orderBySql
      expect(src).toMatch(/freeStateBoostSql|stateBoostSql/);
    });
  });

  describe('theirs behaviors', () => {
    it('PlaceCard is a named export (not default)', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/export\s+function\s+PlaceCard/);
      expect(src).not.toMatch(/export\s+default\s+function\s+PlaceCard/);
    });

    it('PlaceCardSkeleton is exported from PlaceCard file', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/export\s+function\s+PlaceCardSkeleton/);
    });

    it('FeaturedPlacesSection imports PlaceCardSkeleton from PlaceCard', () => {
      const src = readResolved('apps/mobile/src/components/consumer/ExploreScreen/components/FeaturedPlacesSection.jsx');
      expect(src).toMatch(/PlaceCardSkeleton/);
      expect(src).toMatch(/from\s+["']@\/components\/shared\/PlaceCard["']/);
    });

    it('FeaturedPlacesSection uses PlaceCardSkeleton (not inline SkeletonCard)', () => {
      const src = readResolved('apps/mobile/src/components/consumer/ExploreScreen/components/FeaturedPlacesSection.jsx');
      // Should use imported PlaceCardSkeleton, not define its own SkeletonCard
      expect(src).toMatch(/<PlaceCardSkeleton/);
      expect(src).not.toMatch(/function\s+SkeletonCard/);
    });

    it('PlaceCard uses perkGold variable for perk badge color', () => {
      const src = readResolved('apps/mobile/src/components/shared/PlaceCard.jsx');
      expect(src).toMatch(/perkGold/);
    });

    it('perksHandler stateBoost SQL expression is conditionally included', () => {
      const src = readResolved('apps/web/src/app/api/content/itineraries/handlers/perksHandler.js');
      // The state boost expression must be conditional on stateParamProvided
      expect(src).toMatch(/stateParamProvided[\s\S]*?LOWER\s*\(\s*COALESCE\s*\(\s*pick\.state/);
    });
  });
});
