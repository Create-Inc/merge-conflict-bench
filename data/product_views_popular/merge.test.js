import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

function readResolved(relPath) {
  return readFileSync(join(__dirname, "resolved", relPath), "utf-8");
}

describe("product_views_popular", () => {
  describe("base behaviors", () => {
    it("product-views route exports POST handler", () => {
      const src = readResolved("apps/web/src/app/api/product-views/route.js");
      expect(src).toMatch(/export\s+async\s+function\s+POST/);
    });

    it("product-views route validates slug is present", () => {
      const src = readResolved("apps/web/src/app/api/product-views/route.js");
      expect(src).toMatch(/Missing slug/);
    });

    it("product-views route inserts into product_view_events", () => {
      const src = readResolved("apps/web/src/app/api/product-views/route.js");
      expect(src).toMatch(/product_view_events/);
    });

    it("popular-products route exports GET handler", () => {
      const src = readResolved("apps/web/src/app/api/popular-products/route.js");
      expect(src).toMatch(/export\s+async\s+function\s+GET/);
    });

    it("popular-products route supports most_viewed and most_ordered modes", () => {
      const src = readResolved("apps/web/src/app/api/popular-products/route.js");
      expect(src).toMatch(/most_viewed/);
      expect(src).toMatch(/most_ordered/);
    });

    it("product page has view tracking with 30-minute throttle via localStorage", () => {
      const src = readResolved("apps/web/src/app/products/[productId]/page.jsx");
      expect(src).toMatch(/localStorage/);
      expect(src).toMatch(/30\s*\*\s*60\s*\*\s*1000/);
    });
  });

  describe("ours behaviors", () => {
    it("product page checks typeof window !== 'undefined' before accessing localStorage", () => {
      const src = readResolved("apps/web/src/app/products/[productId]/page.jsx");
      expect(src).toMatch(/typeof\s+window/);
    });
  });

  describe("theirs behaviors", () => {
    it("product-views route has safeInt utility function", () => {
      const src = readResolved("apps/web/src/app/api/product-views/route.js");
      expect(src).toMatch(/function\s+safeInt/);
      expect(src).toMatch(/Math\.floor/);
    });

    it("product-views route queries only active products (active = true in WHERE)", () => {
      const src = readResolved("apps/web/src/app/api/product-views/route.js");
      expect(src).toMatch(/active\s*=\s*true/);
    });

    it("product-views route does not leak inactive products (returns ok: true, skipped: true)", () => {
      const src = readResolved("apps/web/src/app/api/product-views/route.js");
      expect(src).toMatch(/skipped:\s*true/);
    });

    it("popular-products route returns mode value in response (not hardcoded string)", () => {
      const src = readResolved("apps/web/src/app/api/popular-products/route.js");
      // Should use the mode variable, not a hardcoded string
      const mostViewedReturn = src.match(
        /return\s+Response\.json\(\s*\{\s*popularProducts.*mode\s*\}/s,
      );
      expect(mostViewedReturn).not.toBeNull();
    });

    it("product page uses recordProductView function for tracking", () => {
      const src = readResolved("apps/web/src/app/products/[productId]/page.jsx");
      expect(src).toMatch(/recordProductView/);
    });

    it("product page uses productId-based localStorage key", () => {
      const src = readResolved("apps/web/src/app/products/[productId]/page.jsx");
      expect(src).toMatch(/productView:last:/);
    });

    it("product page falls back to calling recordProductView when localStorage is blocked", () => {
      const src = readResolved("apps/web/src/app/products/[productId]/page.jsx");
      // The outer try/catch should call recordProductView even when localStorage throws
      // There should be at least 2 recordProductView calls in the view-tracking useEffect
      const viewTrackingSection = src.slice(
        src.indexOf("productView:last:"),
      );
      const matches = viewTrackingSection.match(/recordProductView/g) || [];
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });
});
