import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const animSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/ai-studio/HairSystemTabBeta/AnalyzingAnimation.jsx"),
  "utf-8"
);
const stylesSrc = readFileSync(
  join(__dirname, "resolved/apps/web/src/components/ai-studio/HairSystemTabBeta/AnimationStyles.jsx"),
  "utf-8"
);

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("AnalyzingAnimation: component structure", () => {
    it("exports AnalyzingAnimation function component", () => {
      expect(animSrc).toMatch(/export\s+function\s+AnalyzingAnimation/);
    });

    it("returns null when previewImageUrl is falsy", () => {
      expect(animSrc).toMatch(/if\s*\(!previewImageUrl\)\s*return\s*null/);
    });

    it("renders AnimationStyles component", () => {
      expect(animSrc).toMatch(/<AnimationStyles/);
    });
  });

  describe("AnalyzingAnimation: scan overlay layers", () => {
    it("renders hs-scan-dim layer", () => {
      expect(animSrc).toMatch(/hs-scan-dim/);
    });

    it("renders hs-edge-trace image for pseudo contour effect", () => {
      expect(animSrc).toMatch(/hs-edge-trace/);
    });

    it("renders hs-scan-noise layer", () => {
      expect(animSrc).toMatch(/hs-scan-noise/);
    });

    it("renders hs-scan-grid layer", () => {
      expect(animSrc).toMatch(/hs-scan-grid/);
    });

    it("renders hs-scan-target layer", () => {
      expect(animSrc).toMatch(/hs-scan-target/);
    });

    it("renders hs-scan-band layer", () => {
      expect(animSrc).toMatch(/hs-scan-band/);
    });

    it("renders hs-scan-line layer", () => {
      expect(animSrc).toMatch(/hs-scan-line/);
    });

    it("renders hs-scan-corners layer", () => {
      expect(animSrc).toMatch(/hs-scan-corners/);
    });

    it("renders hs-scan-glow layer", () => {
      expect(animSrc).toMatch(/hs-scan-glow/);
    });
  });

  describe("AnalyzingAnimation: HUD elements", () => {
    it("displays SCANNING chip", () => {
      expect(animSrc).toMatch(/SCANNING/);
    });

    it("displays readout lines (HAIRLINE, DENSITY, FACE MAP)", () => {
      expect(animSrc).toMatch(/HAIRLINE/);
      expect(animSrc).toMatch(/DENSITY/);
      expect(animSrc).toMatch(/FACE MAP/);
    });

    it("displays system version v0.6", () => {
      expect(animSrc).toMatch(/v0\.6/);
    });

    it("renders 'Change photo' link pointing to /ai-studio/beta/start", () => {
      expect(animSrc).toMatch(/Change photo/);
      expect(animSrc).toMatch(/\/ai-studio\/beta\/start/);
    });
  });

  describe("AnimationStyles: keyframe definitions", () => {
    it("defines hsBadgeMove keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsBadgeMove/);
    });

    it("defines hsScanLine keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsScanLine/);
    });

    it("defines hsPulseGlow keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsPulseGlow/);
    });

    it("defines hsGridDrift keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsGridDrift/);
    });

    it("defines hsTargetMove keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsTargetMove/);
    });

    it("defines hsNoiseShift keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsNoiseShift/);
    });

    it("defines hsHudFlicker keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsHudFlicker/);
    });
  });

  describe("AnimationStyles: prefers-reduced-motion", () => {
    it("disables all animations when prefers-reduced-motion is reduce", () => {
      expect(stylesSrc).toMatch(/prefers-reduced-motion:\s*reduce/);
      expect(stylesSrc).toMatch(/animation:\s*none\s*!important/);
    });
  });

  describe("AnimationStyles: scan overlay classes", () => {
    it("defines .hs-scan-frame class", () => {
      expect(stylesSrc).toMatch(/\.hs-scan-frame/);
    });

    it("defines .hs-scan-overlay class", () => {
      expect(stylesSrc).toMatch(/\.hs-scan-overlay/);
    });

    it("defines .hs-hud-chip class with UPPERCASE letter-spacing", () => {
      expect(stylesSrc).toMatch(/\.hs-hud-chip/);
      expect(stylesSrc).toMatch(/text-transform:\s*uppercase/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS
// =====================================================================
describe("ours behaviors", () => {
  describe("AnalyzingAnimation: sweep layer present", () => {
    it("renders hs-scan-sweep layer", () => {
      expect(animSrc).toMatch(/hs-scan-sweep/);
    });
  });

  describe("AnalyzingAnimation: crosshair present", () => {
    it("renders hs-scan-crosshair element", () => {
      expect(animSrc).toMatch(/hs-scan-crosshair/);
    });
  });

  describe("AnimationStyles: mesh shimmer keyframe", () => {
    it("defines hsMeshShimmer keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsMeshShimmer/);
    });
  });

  describe("AnimationStyles: readout flicker keyframe", () => {
    it("defines hsReadoutFlicker keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsReadoutFlicker/);
    });
  });

  describe("AnimationStyles: crosshair pulse keyframe", () => {
    it("defines hsCrosshairPulse keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsCrosshairPulse/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS
// =====================================================================
describe("theirs behaviors", () => {
  describe("AnimationStyles: gradient dim background", () => {
    it("uses linear-gradient for .hs-scan-dim background", () => {
      expect(stylesSrc).toMatch(/\.hs-scan-dim[\s\S]*?linear-gradient/);
    });
  });

  describe("AnimationStyles: edge trace values from theirs", () => {
    it("uses contrast(3.4) for edge trace filter", () => {
      expect(stylesSrc).toMatch(/contrast\(3\.4\)/);
    });

    it("uses brightness(1.75) for edge trace filter", () => {
      expect(stylesSrc).toMatch(/brightness\(1\.75\)/);
    });
  });

  describe("AnimationStyles: scan target with 6px border radius", () => {
    it("uses border-radius: 6px for .hs-scan-target", () => {
      expect(stylesSrc).toMatch(/\.hs-scan-target[\s\S]*?border-radius:\s*6px/);
    });
  });

  describe("AnimationStyles: scan line height 26px", () => {
    it("uses height: 26px for .hs-scan-line", () => {
      expect(stylesSrc).toMatch(/\.hs-scan-line[\s\S]*?height:\s*26px/);
    });
  });

  describe("AnimationStyles: hsSweep keyframe for diagonal sweep", () => {
    it("defines hsSweep keyframe", () => {
      expect(stylesSrc).toMatch(/@keyframes\s+hsSweep/);
    });
  });

  describe("no conflict markers in resolved files", () => {
    it("AnalyzingAnimation has no conflict markers", () => {
      expect(animSrc).not.toMatch(/<<<<<<</);
      expect(animSrc).not.toMatch(/>>>>>>>/);
    });

    it("AnimationStyles has no conflict markers", () => {
      expect(stylesSrc).not.toMatch(/<<<<<<</);
      expect(stylesSrc).not.toMatch(/>>>>>>>/);
    });
  });
});
