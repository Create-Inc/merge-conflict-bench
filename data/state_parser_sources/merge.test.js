import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

function readResolved(filePath) {
  return fs.readFileSync(path.join(__dirname, 'resolved', filePath), 'utf-8');
}

describe('state_parser_sources', () => {
  // ─── base behaviors (preserved from both sides) ───

  describe('base behaviors', () => {
    it('useRegisterFamilyRoot posts to /api/admin/state-parser/register-root', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toContain('/api/admin/state-parser/register-root');
      expect(src).toContain('method: "POST"');
      expect(src).toContain('"Content-Type": "application/json"');
    });

    it('useRegisterFamilyRoot invalidates state-parser-registry query key on success', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toMatch(/invalidateQueries/);
      expect(src).toContain('"state-parser-registry"');
    });

    it('useRegisterFamilyRoot throws on failed response', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toMatch(/if\s*\(\s*!res\.ok\s*\)/);
      expect(src).toContain('throw new Error');
    });

    it('useRegisterFamilyRoot always sets family_root to true in body', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toMatch(/family_root:\s*true/);
    });

    it('register-root route requires admin session', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('requireAdminSessionOrReturnResponse');
    });

    it('register-root route validates 2-letter state code', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('BAD_STATE');
      expect(src).toMatch(/state\.length\s*!==\s*2/);
    });

    it('register-root route requires url', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('URL_REQUIRED');
    });

    it('register-root route does upsert by jurisdiction_code and source_key or source_url', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('jurisdiction_code = $1');
      expect(src).toContain('source_key = $2');
      expect(src).toContain('source_url = $3');
    });

    it('register-root route always forces family_root = true, parent_source_id = NULL, source_depth = 0 on update', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('family_root = true');
      expect(src).toContain('parent_source_id = NULL');
      expect(src).toContain('source_depth = 0');
    });

    it('SourcesPanel resets local state when state changes', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel.jsx');
      // Should reset registered needles and root needles on state change
      expect(src).toMatch(/useEffect\(/);
      expect(src).toMatch(/setRegisteredNeedles\(\[\]\)/);
    });

    it('DiscoverySection infers family key from url/name', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      expect(src).toContain('inferFamilyKey');
      expect(src).toMatch(/local/);
      expect(src).toMatch(/ethics/);
      expect(src).toMatch(/appendix/);
      expect(src).toMatch(/primary/);
    });

    it('DiscoverySection defaults discover mode to html_index for non-pdf', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      expect(src).toContain('defaultDiscoverMode');
      expect(src).toContain('"html_index"');
    });

    it('discover route validates root_source_id', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/discover/route.js');
      expect(src).toContain('ROOT_SOURCE_REQUIRED');
    });

    it('discover route handles NJ and CA states specifically', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/discover/route.js');
      expect(src).toMatch(/state\s*===\s*"NJ"/);
      expect(src).toMatch(/state\s*===\s*"CA"/);
    });
  });

  // ─── theirs behaviors (adopted from theirs branch) ───

  describe('theirs behaviors', () => {
    it('useRegisterFamilyRoot has KNOWN_DISCOVER_MODES set with html_directory and pdf_directory', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toContain('KNOWN_DISCOVER_MODES');
      expect(src).toContain('html_directory');
      expect(src).toContain('pdf_directory');
    });

    it('useRegisterFamilyRoot has normalizeDiscoverMode function', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toContain('normalizeDiscoverMode');
    });

    it('useRegisterFamilyRoot returns useMutation directly instead of assigning to variable', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      // theirs returns directly; ours assigned to registerRootMutation
      expect(src).toMatch(/return\s+useMutation\(/);
    });

    it('useRegisterFamilyRoot uses source_class default "authoritative"', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toContain('"authoritative"');
    });

    it('useRegisterFamilyRoot also invalidates state-parser/state/registry query key', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toContain('"state-parser"');
      expect(src).toContain('"registry"');
    });

    it('useRegisterFamilyRoot uses optional chaining on registryQuery refetch', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toMatch(/registryQuery\?\.\s*refetch\?\.\(\)/);
    });

    it('SourcesTable priority th has min-w-[110px] (theirs)', () => {
      const src = readResolved('apps/web/src/components/RuleSources/SourcesTable.jsx');
      expect(src).toContain('min-w-[110px]');
    });

    it('SourceRow priority td has min-w-[110px] (theirs)', () => {
      const src = readResolved('apps/web/src/components/RuleSources/SourceRow.jsx');
      // The theirs version used w-[80px] min-w-[80px] for source row,
      // but resolved should have min-w on the priority td
      const hasPriorityMinW = src.includes('min-w-[110px]');
      expect(hasPriorityMinW).toBe(true);
    });

    it('SourcesPanel uses rootNeedles (theirs naming) for root needle state', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel.jsx');
      // theirs used rootNeedles; ours used rootRegisteredNeedles
      expect(src).toContain('rootNeedles');
    });

    it('SourcesPanel uses rootSet and has early return shortcut', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel.jsx');
      expect(src).toContain('rootSet');
      // theirs added shortcut: if (!needles.size && !rootSet.size) return discoveredRaw;
      expect(src).toContain('discoveredRaw');
    });

    it('SourcesPanel sets isRoot based on d?.already_root OR rootSet membership', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel.jsx');
      expect(src).toMatch(/already_root/);
      expect(src).toMatch(/rootSet\.has/);
    });

    it('DiscoverySection imports from @/data/ruleSourceUx (theirs)', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      expect(src).toContain('DISCOVERY_STRATEGY_OPTIONS');
      expect(src).toContain('RULE_SOURCE_FAMILY_VALUES');
      expect(src).toContain('getPatternOptionsForSourceClass');
    });

    it('DiscoverySection uses useState import only (not useEffect/useMemo from theirs)', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      // theirs removed useEffect and useMemo imports
      expect(src).toMatch(/import\s*\{[^}]*useState[^}]*\}\s*from\s*"react"/);
    });

    it('DiscoverySection has Family/Discover/Pattern select dropdowns (theirs UI)', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      expect(src).toContain('Family');
      expect(src).toContain('Discover');
      expect(src).toContain('Pattern');
      expect(src).toContain('DISCOVERY_STRATEGY_OPTIONS');
    });

    it('DiscoverySection disables root registration for PDF sources (theirs)', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      expect(src).toContain('isPdf');
      expect(src).toContain('PDF = leaf (cannot be root)');
    });

    it('register-root route has KNOWN_DISCOVER_MODES set (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('KNOWN_DISCOVER_MODES');
      expect(src).toContain('html_directory');
      expect(src).toContain('pdf_directory');
    });

    it('register-root route has normalizeDiscoverMode function (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('normalizeDiscoverMode');
    });

    it('register-root route has normalizeUrl function that strips trailing slash (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('normalizeUrl');
      // Should strip trailing slash
      expect(src).toMatch(/pathname/);
    });

    it('register-root route has loadRowById function (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('loadRowById');
    });

    it('register-root route returns row data on insert/update (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      // theirs returns { ok, action, id, row }
      expect(src).toMatch(/action:\s*"inserted"/);
      expect(src).toMatch(/action:\s*"updated"/);
      expect(src).toMatch(/\brow\b/);
    });

    it('register-root route sets parser_strategy to state_parser_v1 on insert (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/register-root/route.js');
      expect(src).toContain('state_parser_v1');
    });

    it('discover route uses Boolean(hit?.id) for already_registered (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/discover/route.js');
      expect(src).toMatch(/already_registered:\s*Boolean\(hit\?\.id\)/);
    });

    it('discover route uses Boolean(hit?.family_root) for already_root (theirs)', () => {
      const src = readResolved('apps/web/src/app/api/admin/state-parser/discover/route.js');
      expect(src).toMatch(/already_root:\s*Boolean\(hit\?\.family_root\)/);
    });
  });

  // ─── ours behaviors (adopted from ours branch) ───

  describe('ours behaviors', () => {
    it('useRegisterFamilyRoot validates url is not empty before sending', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      // ours added url validation: throw Error("Missing url")
      expect(src).toContain('Missing url');
    });

    it('useRegisterFamilyRoot resolves preferred_pattern from multiple fallbacks', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      // ours had pattern_hint and parser_pattern_hint fallbacks
      expect(src).toContain('pattern_hint');
      expect(src).toContain('parser_pattern_hint');
    });

    it('useRegisterFamilyRoot also reads authority from payload?.authority fallback', () => {
      const src = readResolved('apps/web/src/hooks/useRegisterFamilyRoot.js');
      expect(src).toContain('payload?.authority');
    });

    it('DiscoverySection inferFamilyKey includes "standard" check (theirs added it)', () => {
      const src = readResolved('apps/web/src/components/StateParser/SourcesPanel/DiscoverySection.jsx');
      // theirs added "standard" check while ours did not
      expect(src).toContain('"standard"');
    });
  });
});
