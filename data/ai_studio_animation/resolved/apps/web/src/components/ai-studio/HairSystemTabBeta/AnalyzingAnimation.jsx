import React from "react";
import { AnimationStyles } from "./AnimationStyles";

export function AnalyzingAnimation({ previewImageUrl }) {
  if (!previewImageUrl) return null;

  const readoutLines = [
    { k: "HAIRLINE", v: "tracking" },
    { k: "DENSITY", v: "estimating" },
    { k: "FACE MAP", v: "aligning" },
  ];

  return (
    <div className="mt-2 space-y-4">
      {/* Ensure scan styles are always mounted even if this piece of the page is used elsewhere */}
      <AnimationStyles />

      <div
        className="rounded-3xl p-4"
        style={{
          backgroundColor: "var(--theme-bg-surface)",
          border: "1px solid var(--theme-border)",
          boxShadow: "var(--theme-tile-shadow)",
        }}
      >
        <div className="flex items-center justify-between gap-3 flex-col sm:flex-row">
          <div>
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--theme-text-primary)" }}
            >
              Analyzing your photo…
            </div>
            <div
              className="text-xs mt-1"
              style={{ color: "var(--theme-text-tertiary)" }}
            >
              Hang tight — we're mapping hairline, density, and face shape.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/ai-studio/beta/start"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: "var(--theme-btn-secondary-bg)",
                color: "var(--theme-btn-secondary-text)",
                border: "1px solid var(--theme-border)",
                boxShadow: "var(--theme-tile-shadow)",
                fontFamily: "var(--theme-font-body)",
                textDecoration: "none",
              }}
            >
              Change photo
            </a>
          </div>
        </div>

        {/* Scan frame: use a padding-top square so overlay always matches the image */}
        <div className="mt-4">
          <div
            className="hs-scan-frame w-full"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "920px",
              marginLeft: "auto",
              marginRight: "auto",
              borderRadius: "1.5rem",
              overflow: "hidden",
              border: "1px solid rgba(17,24,39,0.10)",
              backgroundColor: "rgba(0,0,0,0.02)",
            }}
          >
            {/* establishes the square height */}
            <div style={{ width: "100%", paddingTop: "100%" }} />

            <img
              src={previewImageUrl}
              alt="Analyzing source"
              className="hs-scan-image"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                zIndex: 1,
              }}
            />

            {/* Overlay is absolute+inset so it cannot drift and always covers the image */}
            <div
              className="hs-scan-overlay"
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                pointerEvents: "none",
                borderRadius: "1.5rem",
                overflow: "hidden",
              }}
            >
              {/* More visible sci‑fi scan layers */}
              <div className="hs-scan-dim" />
              <img src={previewImageUrl} alt="" aria-hidden className="hs-edge-trace" />

              <div className="hs-scan-noise" />

              <div className="hs-hud-top">
                <div className="hs-hud-chip">SCANNING</div>
                <div className="hs-hud-sub">Hairline • Density • Face map</div>
              </div>

              <div className="hs-hud-readout">
                <div>
                  <strong>SYSTEM</strong> :: v0.6
                </div>
                {readoutLines.map((l) => (
                  <div key={l.k}>
                    {l.k}: {l.v}
                  </div>
                ))}
              </div>

              <div className="hs-scan-grid" />
              <div className="hs-scan-sweep" />
              <div className="hs-scan-mesh" />
              <div className="hs-scan-crosshair" />

              <div className="hs-scan-target" />
              <div className="hs-scan-band" />
              <div className="hs-scan-line" />
              <div className="hs-scan-corners" />
              <div className="hs-scan-glow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
