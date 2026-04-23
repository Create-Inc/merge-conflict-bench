import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readResolved(relPath) {
  return readFileSync(join(__dirname, 'resolved', relPath), 'utf-8');
}

describe('mobile_search_filters merge', () => {
  describe('base behaviors', () => {
    it('version.js exports APP_VERSION with correct version string', () => {
      const src = readResolved('apps/mobile/src/utils/version.js');
      expect(src).toMatch(/export\s+const\s+APP_VERSION\s*=/);
      expect(src).toMatch(/01\.01\.06\.005\.presentation_redesign\.032/);
    });

    it('decade.jsx imports and uses buildSongDetailParams', () => {
      const src = readResolved('apps/mobile/src/app/search/decade.jsx');
      expect(src).toMatch(/import.*buildSongDetailParams/);
      expect(src).toMatch(/buildSongDetailParams/);
    });

    it('year.jsx imports and uses buildSongDetailParams', () => {
      const src = readResolved('apps/mobile/src/app/search/year.jsx');
      expect(src).toMatch(/import.*buildSongDetailParams/);
      expect(src).toMatch(/buildSongDetailParams/);
    });

    it('generation.jsx imports and uses buildSongDetailParams', () => {
      const src = readResolved('apps/mobile/src/app/search/generation.jsx');
      expect(src).toMatch(/import.*buildSongDetailParams/);
      expect(src).toMatch(/buildSongDetailParams/);
    });

    it('genre.jsx imports and uses buildSongDetailParams', () => {
      const src = readResolved('apps/mobile/src/app/search/genre.jsx');
      expect(src).toMatch(/import.*buildSongDetailParams/);
      expect(src).toMatch(/buildSongDetailParams/);
    });

    it('all search screens navigate to /details/song with params from buildSongDetailParams', () => {
      for (const file of ['decade.jsx', 'year.jsx', 'generation.jsx', 'genre.jsx']) {
        const src = readResolved(`apps/mobile/src/app/search/${file}`);
        expect(src).toMatch(/pathname:\s*["']\/details\/song["']/);
        expect(src).toMatch(/buildSongDetailParams/);
      }
    });

    it('all search screens validate songParams identity before navigation', () => {
      for (const file of ['decade.jsx', 'year.jsx', 'generation.jsx', 'genre.jsx']) {
        const src = readResolved(`apps/mobile/src/app/search/${file}`);
        expect(src).toMatch(/songId.*songTitle|songTitle.*songId/);
        expect(src).toMatch(/console\.error/);
      }
    });

    it('all search screens navigate to /details/artist for artist items', () => {
      for (const file of ['decade.jsx', 'year.jsx', 'generation.jsx', 'genre.jsx']) {
        const src = readResolved(`apps/mobile/src/app/search/${file}`);
        expect(src).toMatch(/\/details\/artist/);
      }
    });
  });

  describe('ours behaviors', () => {
    it('all search screens include artist_name as an artist fallback', () => {
      for (const file of ['decade.jsx', 'year.jsx', 'generation.jsx', 'genre.jsx']) {
        const src = readResolved(`apps/mobile/src/app/search/${file}`);
        // ours adds item?.artist_name as a fallback
        expect(src).toMatch(/artist_name/);
      }
    });

    it('version.js comment mentions song-card taps fix', () => {
      const src = readResolved('apps/mobile/src/utils/version.js');
      expect(src).toMatch(/song-card\s+taps|song.*taps.*buildSongDetailParams/i);
    });
  });

  describe('theirs behaviors', () => {
    it('version.js comment mentions route path display for screen IDs in admin reports', () => {
      const src = readResolved('apps/mobile/src/utils/version.js');
      expect(src).toMatch(/route\s+path|Screen\s+ID|screen.*card.*report/i);
    });

    it('all search screens use variable named songParams or similar', () => {
      for (const file of ['decade.jsx', 'year.jsx', 'generation.jsx', 'genre.jsx']) {
        const src = readResolved(`apps/mobile/src/app/search/${file}`);
        expect(src).toMatch(/songParams/);
      }
    });
  });
});
