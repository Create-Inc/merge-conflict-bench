import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function read(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('listing_watchlist', () => {
  describe('base behaviors', () => {
    it('listing.jsx: query key includes auth?.id for watchlist', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/queryKey.*watchlist.*auth\?\.id/s);
    });

    it('listing.jsx: uses optimistic update pattern for remove mutation', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/setQueryData/);
      expect(src).toMatch(/previousWatchlist/);
      expect(src).toMatch(/cancelQueries/);
    });

    it('listing.jsx: shows sign-in prompt when no auth', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/Sign in to save items/);
    });

    it('listing.jsx: shows empty state when no items in watchlist', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/No saved items yet/);
    });

    it('[id].jsx: shows SOLD badge when listing is sold', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/SOLD/);
      expect(src).toMatch(/soldBadge/);
    });

    it('[id].jsx: has Mark as Sold button for owners', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/Mark as Sold/);
    });

    it('[id].jsx: has Sold Somewhere Else option', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/Sold Somewhere Else/);
    });

    it('route.js: validates listing exists before adding to watchlist', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      expect(src).toMatch(/Listing not found/);
      expect(src).toMatch(/deleted_at IS NULL/);
    });

    it('route.js: uses ON CONFLICT DO NOTHING for duplicate watchlist entries', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      expect(src).toMatch(/ON CONFLICT.*DO NOTHING/i);
    });

    it('route.js: returns 400 when listing_id is missing', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      expect(src).toMatch(/listing_id is required/);
    });
  });

  describe('ours behaviors (multi-source token extraction)', () => {
    it('route.js: has a getTokenFromRequest helper that checks multiple sources', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      expect(src).toMatch(/getTokenFromRequest/);
      // Should check authorization header
      expect(src).toMatch(/authorization/i);
      // Should check x-session-token fallback
      expect(src).toMatch(/x-session-token/);
    });

    it('route.js: has a requireUserIdFromToken function that validates session', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      expect(src).toMatch(/requireUserIdFromToken/);
      expect(src).toMatch(/Invalid or expired token/);
    });

    it('route.js: GET handler uses getTokenFromRequest for auth', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      // The GET function should call getTokenFromRequest
      const getStart = src.indexOf('export async function GET');
      const postStart = src.indexOf('export async function POST');
      const getBody = src.slice(getStart, postStart);
      expect(getBody).toMatch(/getTokenFromRequest/);
    });

    it('listing.jsx: sends x-session-token header alongside authorization', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/x-session-token/);
    });

    it('[id].jsx: sends x-session-token header alongside authorization', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/x-session-token/);
    });
  });

  describe('theirs behaviors (strict token type checking)', () => {
    it('listing.jsx: uses typeof check for token validation', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/typeof token.*string/);
      expect(src).toMatch(/token\.length.*0/);
    });

    it('[id].jsx: uses typeof check for token validation', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/typeof token.*string/);
    });

    it('[id].jsx: handleToggleWatchlist shows Sign In button in alert', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/Sign in required/);
      expect(src).toMatch(/Sign In/);
      expect(src).toMatch(/auth-landing/);
    });

    it('[id].jsx: watchlist error handler detects expired token and offers sign-in', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      expect(src).toMatch(/Session Expired/);
      expect(src).toMatch(/sign in again/i);
    });

    it('route.js: POST handler reads body for listing_id', () => {
      const src = read('apps/web/src/app/api/watchlist/route.js');
      const postStart = src.indexOf('export async function POST');
      const deleteStart = src.indexOf('export async function DELETE');
      const postBody = src.slice(postStart, deleteStart);
      expect(postBody).toMatch(/listing_id/);
    });
  });

  describe('ours behaviors (response body parsing with fallback)', () => {
    it('[id].jsx: toggleWatchlistMutation response parsed with .catch fallback', () => {
      const src = read('apps/mobile/src/app/listing/[id].jsx');
      // Should have safe json parsing with catch
      expect(src).toMatch(/\.json\(\)\.catch/);
    });

    it('listing.jsx: remove mutation parses response safely with catch', () => {
      const src = read('apps/mobile/src/app/(tabs)/listing.jsx');
      expect(src).toMatch(/\.json\(\)\.catch/);
    });
  });
});
