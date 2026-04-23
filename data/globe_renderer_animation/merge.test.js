import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const animHelpersSrc = readFileSync(
  join(__dirname, "resolved/apps/mobile/src/utils/globe/animationHelpers.js"),
  "utf-8"
);
const animLoopSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/GlobalUnityMap/animationLoop.js"),
  "utf-8"
);
const continentSparksSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/GlobalUnityMap/continentSparks.js"),
  "utf-8"
);
const globeRendererSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/GlobalUnityMap/GlobeRenderer.jsx"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("animationHelpers: exports core animation functions", () => {
    it("exports animateLiveUsers function", () => {
      expect(animHelpersSrc).toMatch(/export\s+function\s+animateLiveUsers/);
    });

    it("exports animateGroupHalos function", () => {
      expect(animHelpersSrc).toMatch(/export\s+function\s+animateGroupHalos/);
    });

    it("exports animateContinentSparks function", () => {
      expect(animHelpersSrc).toMatch(/export\s+function\s+animateContinentSparks/);
    });

    it("exports animateVisitorSparks function", () => {
      expect(animHelpersSrc).toMatch(/export\s+function\s+animateVisitorSparks/);
    });
  });

  describe("animationLoop: core structure", () => {
    it("exports createAnimationLoop function", () => {
      expect(animLoopSrc).toMatch(/export\s+function\s+createAnimationLoop/);
    });

    it("returns start and stop functions", () => {
      expect(animLoopSrc).toMatch(/return\s*\{\s*start\s*,\s*stop\s*\}/);
    });

    it("implements auto-rotation based on drag state", () => {
      expect(animLoopSrc).toMatch(/shouldAutoRotate/);
      expect(animLoopSrc).toMatch(/drag\.isDown/);
    });
  });

  describe("continentSparks: creates 6 continent sparks", () => {
    it("exports createContinentSparks function", () => {
      expect(continentSparksSrc).toMatch(/export\s+function\s+createContinentSparks/);
    });

    it("handles all 6 continent keys", () => {
      expect(continentSparksSrc).toMatch(/north-america/);
      expect(continentSparksSrc).toMatch(/south-america/);
      expect(continentSparksSrc).toMatch(/europe/);
      expect(continentSparksSrc).toMatch(/africa/);
      expect(continentSparksSrc).toMatch(/asia/);
      expect(continentSparksSrc).toMatch(/oceania/);
    });
  });

  describe("GlobeRenderer: component structure", () => {
    it("exports GlobeRenderer function component", () => {
      expect(globeRendererSrc).toMatch(/export\s+function\s+GlobeRenderer/);
    });

    it("accepts data, height, mode, and onOpen props", () => {
      expect(globeRendererSrc).toMatch(/data/);
      expect(globeRendererSrc).toMatch(/height\s*=\s*360/);
      expect(globeRendererSrc).toMatch(/mode\s*=\s*["']preview["']/);
      expect(globeRendererSrc).toMatch(/onOpen/);
    });

    it("renders a canvas element", () => {
      expect(globeRendererSrc).toMatch(/<canvas/);
    });

    it("has aria-label for accessibility", () => {
      expect(globeRendererSrc).toMatch(/aria-label/);
    });
  });

  describe("continent sparks: gold core and glow material", () => {
    it("uses gold color 0xf5dfa3 for core material", () => {
      expect(continentSparksSrc).toMatch(/0xf5dfa3/);
    });

    it("uses OctahedronGeometry for spark diamond shape", () => {
      expect(continentSparksSrc).toMatch(/OctahedronGeometry/);
    });
  });

  describe("animation: core opacity clamp ranges", () => {
    it("clamps core opacity to 0.55-0.7 range", () => {
      expect(animLoopSrc).toMatch(/clamp\(0\.55\s*\+\s*activityBoost,\s*0\.55,\s*0\.7\)/);
    });

    it("clamps glow opacity to 0.25-0.4 range", () => {
      expect(animLoopSrc).toMatch(/clamp\(0\.25\s*\+\s*activityBoost\s*\*\s*1\.0,\s*0\.25,\s*0\.4\)/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("GlobeRenderer: modular imports from separate files", () => {
    it("imports createRenderer, createScene, createCamera from sceneSetup", () => {
      expect(globeRendererSrc).toMatch(/from\s*["']\.\/sceneSetup["']/);
    });

    it("imports createMarkers from markerCreation", () => {
      expect(globeRendererSrc).toMatch(/from\s*["']\.\/markerCreation["']/);
    });

    it("imports createAnimationLoop from animationLoop", () => {
      expect(globeRendererSrc).toMatch(/from\s*["']\.\/animationLoop["']/);
    });

    it("imports createInteractionHandlers from interactionHandlers", () => {
      expect(globeRendererSrc).toMatch(/from\s*["']\.\/interactionHandlers["']/);
    });

    it("imports useEchoRipples from echoRipples", () => {
      expect(globeRendererSrc).toMatch(/from\s*["']\.\/echoRipples["']/);
    });

    it("imports rotateToUserRegion from regionRotation", () => {
      expect(globeRendererSrc).toMatch(/from\s*["']\.\/regionRotation["']/);
    });
  });

  describe("continentSparks: parameter order (globeGroup, radius)", () => {
    it("takes globeGroup as first parameter and radius as second", () => {
      expect(continentSparksSrc).toMatch(
        /function\s+createContinentSparks\s*\(\s*globeGroup\s*,\s*radius\s*\)/
      );
    });
  });

  describe("continentSparks: imports from separate modules", () => {
    it("imports CONTINENT_ELLIPSE_RADII from constants", () => {
      expect(continentSparksSrc).toMatch(/from\s*["']\.\/constants["']/);
    });

    it("imports getFeatherTexture from textureHelpers", () => {
      expect(continentSparksSrc).toMatch(/from\s*["']\.\/textureHelpers["']/);
    });
  });

  describe("animationLoop: sparkle scale curve (0.75 + glint * 0.35)", () => {
    it("uses scale factor 0.75 + glint * 0.35 for spark mesh scale", () => {
      expect(animLoopSrc).toMatch(/0\.75\s*\+\s*glint\s*\*\s*0\.35/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("animationHelpers: sparkle opacity values from theirs branch", () => {
    it("does not contain conflict markers", () => {
      expect(animHelpersSrc).not.toMatch(/<<<<<<</);
      expect(animHelpersSrc).not.toMatch(/>>>>>>>/);
    });
  });

  describe("GlobeRenderer: cleanup disposes renderer", () => {
    it("calls renderer.dispose() in cleanup", () => {
      expect(globeRendererSrc).toMatch(/renderer\.dispose\(\)/);
    });
  });

  describe("GlobeRenderer: resize handler", () => {
    it("adds a resize event listener", () => {
      expect(globeRendererSrc).toMatch(/addEventListener\s*\(\s*["']resize["']/);
    });

    it("removes the resize event listener on cleanup", () => {
      expect(globeRendererSrc).toMatch(/removeEventListener\s*\(\s*["']resize["']/);
    });
  });

  describe("animation: group halo breathing effect", () => {
    it("applies breathing sine wave at 0.55 frequency offset", () => {
      expect(animLoopSrc).toMatch(/Math\.sin\(seconds\s*\*\s*0\.55/);
    });

    it("scales halo by 1 + breathe * 0.55", () => {
      expect(animLoopSrc).toMatch(/1\s*\+\s*breathe\s*\*\s*0\.55/);
    });
  });
});
