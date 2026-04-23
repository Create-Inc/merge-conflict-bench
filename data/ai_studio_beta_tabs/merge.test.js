import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const aiStudioTabSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/(tabs)/ai-studio.jsx"),
  "utf-8"
);
const betaIndexSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/app/ai-studio-beta/index.jsx"),
  "utf-8"
);
const betaPageSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/ai-studio/beta/page.jsx"),
  "utf-8"
);
const aiStudioPageSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/app/ai-studio/page.jsx"),
  "utf-8"
);
const utilsSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/ai-studio/HairSystemTabBeta/utils.js"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("mobile ai-studio tab: redirects to beta", () => {
    it("redirects to /ai-studio-beta", () => {
      expect(aiStudioTabSrc).toMatch(/Redirect\s+href=["']\/ai-studio-beta["']/);
    });

    it("imports Redirect from expo-router", () => {
      expect(aiStudioTabSrc).toMatch(/import.*Redirect.*from\s*["']expo-router["']/);
    });
  });

  describe("web ai-studio page: redirects to beta", () => {
    it("calls window.location.replace with /ai-studio/beta", () => {
      expect(aiStudioPageSrc).toMatch(/window\.location\.replace\(["']\/ai-studio\/beta["']\)/);
    });

    it("has a fallback link to /ai-studio/beta", () => {
      expect(aiStudioPageSrc).toMatch(/href=["']\/ai-studio\/beta["']/);
    });
  });

  describe("beta hub page (web): tile structure", () => {
    it("defines tiles for virtual-try-on, eyelashes, and hair-system", () => {
      expect(betaPageSrc).toMatch(/virtual-try-on/);
      expect(betaPageSrc).toMatch(/eyelashes/);
      expect(betaPageSrc).toMatch(/hair-system/);
    });

    it("has a 'Start with a photo' button/link", () => {
      expect(betaPageSrc).toMatch(/Start with a photo/);
    });

    it("includes an AI Studio badge with Sparkles icon", () => {
      expect(betaPageSrc).toMatch(/AI Studio/);
      expect(betaPageSrc).toMatch(/Sparkles/);
    });
  });

  describe("beta hub mobile: tile structure", () => {
    it("defines tiles for virtual-try-on, eyelashes, and hair-system", () => {
      expect(betaIndexSrc).toMatch(/virtual-try-on/);
      expect(betaIndexSrc).toMatch(/eyelashes/);
      expect(betaIndexSrc).toMatch(/hair-system/);
    });

    it("has a 'Start with a photo' button", () => {
      expect(betaIndexSrc).toMatch(/Start with a photo/);
    });
  });

  describe("utils: normalizeEyeColor", () => {
    it("exports normalizeEyeColor function", () => {
      expect(utilsSrc).toMatch(/export\s+(const|function)\s+normalizeEyeColor/);
    });
  });

  describe("utils: SYSTEM_TYPES", () => {
    it("exports SYSTEM_TYPES array", () => {
      expect(utilsSrc).toMatch(/export\s+const\s+SYSTEM_TYPES/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("utils: SYSTEM_TYPES with wig/toupee/extensions keys", () => {
    it("includes a 'wig' system type", () => {
      expect(utilsSrc).toMatch(/key:\s*["']wig["']/);
    });

    it("includes a 'toupee' system type", () => {
      expect(utilsSrc).toMatch(/key:\s*["']toupee["']/);
    });

    it("includes an 'extensions' system type", () => {
      expect(utilsSrc).toMatch(/key:\s*["']extensions["']/);
    });
  });

  describe("utils: normalizeEyeColor handles grey/gray variant", () => {
    it("maps both grey and gray to the gray key", () => {
      expect(utilsSrc).toMatch(/grey/);
      expect(utilsSrc).toMatch(/gray/);
    });
  });

  describe("utils: getStyleSummary with switch/case by style.id", () => {
    it("exports getStyleSummary", () => {
      expect(utilsSrc).toMatch(/export\s+(const|function)\s+getStyleSummary/);
    });

    it("handles textured_bob style", () => {
      expect(utilsSrc).toMatch(/textured_bob/);
    });

    it("handles pixie_cut style", () => {
      expect(utilsSrc).toMatch(/pixie_cut/);
    });

    it("returns null for null/undefined style", () => {
      expect(utilsSrc).toMatch(/if\s*\(!style\)\s*return\s*null/);
    });
  });

  describe("utils: inferHairAttributes with category-based length maps", () => {
    it("exports inferHairAttributes", () => {
      expect(utilsSrc).toMatch(/export\s+(const|function)\s+inferHairAttributes/);
    });

    it("maps women_short category to short length", () => {
      expect(utilsSrc).toMatch(/women_short.*short/);
    });

    it("maps braided category to long length", () => {
      expect(utilsSrc).toMatch(/braided.*long/);
    });
  });

  describe("web ai-studio page: uses 'use client' directive", () => {
    it("has 'use client' at the top", () => {
      expect(aiStudioPageSrc).toMatch(/^["']use client["']/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("mobile ai-studio tab: uses View and Text wrapper", () => {
    it("imports View and Text from react-native", () => {
      expect(aiStudioTabSrc).toMatch(/import.*View.*Text.*from\s*["']react-native["']/);
    });

    it("imports StatusBar from expo-status-bar", () => {
      expect(aiStudioTabSrc).toMatch(/import.*StatusBar.*from\s*["']expo-status-bar["']/);
    });

    it("renders a loading text inside a View", () => {
      expect(aiStudioTabSrc).toMatch(/Loading AI Studio/);
    });
  });

  describe("web ai-studio page: theirs simpler redirect UI", () => {
    it("uses sm:p-8 responsive padding", () => {
      expect(aiStudioPageSrc).toMatch(/sm:p-8/);
    });
  });

  describe("beta hub mobile: Photo shortcut button from theirs", () => {
    it("has a shortcut button that navigates to start", () => {
      expect(betaIndexSrc).toMatch(/ai-studio-beta\/start/);
    });
  });

  describe("no conflict markers in resolved files", () => {
    it("ai-studio tab has no conflict markers", () => {
      expect(aiStudioTabSrc).not.toMatch(/<<<<<<</);
    });

    it("beta index has no conflict markers", () => {
      expect(betaIndexSrc).not.toMatch(/<<<<<<</);
    });

    it("utils has no conflict markers", () => {
      expect(utilsSrc).not.toMatch(/<<<<<<</);
    });
  });
});
