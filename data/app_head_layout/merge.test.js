import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const headSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/head.jsx"),
  "utf8",
);

const layoutSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/layout.jsx"),
  "utf8",
);

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("head.jsx - page structure", () => {
    it("exports a default Head function", () => {
      expect(headSrc).toMatch(/export\s+default\s+function\s+Head\b/);
    });

    it("renders a title element with MINERSME", () => {
      expect(headSrc).toMatch(/<title>MINERSME<\/title>/);
    });

    it("includes a viewport meta tag", () => {
      expect(headSrc).toMatch(/name="viewport"/);
      expect(headSrc).toMatch(/width=device-width/);
    });

    it("includes a theme-color meta tag set to #0A0F1C", () => {
      expect(headSrc).toMatch(/name="theme-color"/);
      expect(headSrc).toMatch(/content="#0A0F1C"/);
    });

    it("renders multiple favicon link tags including shortcut icon and apple-touch-icon", () => {
      expect(headSrc).toMatch(/rel="shortcut icon"/);
      expect(headSrc).toMatch(/rel="apple-touch-icon"/);
      expect(headSrc).toMatch(/sizes="180x180"/);
    });

    it("renders link tags for 32x32 and 16x16 icons", () => {
      expect(headSrc).toMatch(/sizes="32x32"/);
      expect(headSrc).toMatch(/sizes="16x16"/);
    });
  });

  describe("layout.jsx - page structure", () => {
    it("exports a default RootLayout function", () => {
      expect(layoutSrc).toMatch(
        /export\s+default\s+function\s+RootLayout\b/,
      );
    });

    it("wraps children in QueryClientProvider", () => {
      expect(layoutSrc).toMatch(/QueryClientProvider/);
    });

    it("configures QueryClient with staleTime and cacheTime", () => {
      expect(layoutSrc).toMatch(/staleTime/);
      expect(layoutSrc).toMatch(/cacheTime/);
    });

    it("sets retry to 1 and refetchOnWindowFocus to false", () => {
      expect(layoutSrc).toMatch(/retry:\s*1/);
      expect(layoutSrc).toMatch(/refetchOnWindowFocus:\s*false/);
    });

    it("has a useEffect that sets favicon links client-side", () => {
      expect(layoutSrc).toMatch(/useEffect/);
      expect(layoutSrc).toMatch(/upsertLink/);
    });

    it("upsertLink creates or updates link elements in document.head", () => {
      expect(layoutSrc).toMatch(/document\.querySelector/);
      expect(layoutSrc).toMatch(/document\.createElement/);
      expect(layoutSrc).toMatch(/document\.head\.appendChild/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (versioned path approach)
// =====================================================================
describe("theirs behaviors", () => {
  describe("head.jsx - versioned path (not query param) for favicon", () => {
    it("uses a versioned path like /api/site-icon-v... instead of query params", () => {
      // The resolved version should use a versioned PATH, not ?v= query
      expect(headSrc).toMatch(/\/api\/site-icon-v\d+/);
    });

    it("does NOT use query-param-based cache busting (?v=)", () => {
      // Should not have ?v= pattern for favicon
      expect(headSrc).not.toMatch(/\?v=.*faviconVersion/);
      expect(headSrc).not.toMatch(/`\/api\/favicon\?v=\$\{/);
    });

    it("all favicon link hrefs reference the same versioned path variable", () => {
      // All link tags should use the same variable (faviconPath)
      const hrefMatches = headSrc.match(/href=\{(\w+)\}/g) || [];
      const varNames = hrefMatches.map((m) => m.replace(/href=\{|\}/g, ""));
      const uniqueVars = [...new Set(varNames)];
      expect(uniqueVars.length).toBe(1);
    });
  });

  describe("layout.jsx - versioned path for client-side favicon", () => {
    it("uses a versioned path for client-side favicon (same as head.jsx approach)", () => {
      expect(layoutSrc).toMatch(/\/api\/site-icon-v\d+/);
    });

    it("does NOT use ?v= query param for client-side favicon", () => {
      expect(layoutSrc).not.toMatch(/\/api\/favicon\?v=/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (cache-busting, explicit icon type)
// =====================================================================
describe("ours behaviors", () => {
  describe("head.jsx - untyped favicon link", () => {
    it("includes a plain icon link without explicit sizes (catch-all favicon)", () => {
      // Ours added an extra <link rel="icon" type="image/png" href=... /> without sizes
      // The resolved version should have this
      const iconLinks = headSrc.match(/<link\s+rel="icon"[^>]*>/g) || [];
      // There should be at least one icon link without a sizes attribute
      const withoutSizes = iconLinks.filter((l) => !l.includes("sizes="));
      expect(withoutSizes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("layout.jsx - same-origin API route for favicon", () => {
    it("uses an /api/ route path for the favicon (same-origin)", () => {
      expect(layoutSrc).toMatch(/\/api\//);
    });
  });
});
