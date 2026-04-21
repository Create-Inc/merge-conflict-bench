import React from "react";

export function AnimationStyles() {
  return (
    <style jsx global>{`
      @keyframes hsBadgeMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      /* a little noise + HUD flicker for a sci‑fi feel */
      @keyframes hsNoiseShift {
        0% { transform: translate3d(0%, 0%, 0); opacity: 0.08; }
        50% { transform: translate3d(-2%, 1%, 0); opacity: 0.14; }
        100% { transform: translate3d(0%, 0%, 0); opacity: 0.08; }
      }

      @keyframes hsHudFlicker {
        0%, 100% { opacity: 0.92; }
        20% { opacity: 0.78; }
        55% { opacity: 0.95; }
        80% { opacity: 0.70; }
      }

      @keyframes hsScanLine {
        0% { transform: translateY(-10%); opacity: 0.0; }
        10% { opacity: 1.0; }
        90% { opacity: 1.0; }
        100% { transform: translateY(110%); opacity: 0.0; }
      }

      @keyframes hsPulseGlow {
        0% { opacity: 0.22; }
        50% { opacity: 0.46; }
        100% { opacity: 0.22; }
      }

      /* subtle "analysis grid" drift */
      @keyframes hsGridDrift {
        0% { transform: translate3d(-2%, -2%, 0); opacity: 0.26; }
        50% { transform: translate3d(2%, 1%, 0); opacity: 0.46; }
        100% { transform: translate3d(-2%, -2%, 0); opacity: 0.26; }
      }

      /* diagonal sci‑fi sweep */
      @keyframes hsSweep {
        0% { transform: translate3d(-30%, -20%, 0) rotate(14deg); opacity: 0.0; }
        10% { opacity: 0.55; }
        55% { opacity: 0.25; }
        100% { transform: translate3d(30%, 28%, 0) rotate(14deg); opacity: 0.0; }
      }

      /* subtle crosshair pulse */
      @keyframes hsCrosshairPulse {
        0% { opacity: 0.25; transform: scale(0.98); }
        50% { opacity: 0.55; transform: scale(1.0); }
        100% { opacity: 0.25; transform: scale(0.98); }
      }

      /* "mesh" shimmer */
      @keyframes hsMeshShimmer {
        0% { opacity: 0.26; filter: blur(0px); }
        50% { opacity: 0.50; filter: blur(0.35px); }
        100% { opacity: 0.26; filter: blur(0px); }
      }

      @keyframes hsTargetMove {
        0% { transform: translate3d(8%, 14%, 0) scale(1.0); opacity: 0.0; }
        10% { opacity: 0.95; }
        45% { transform: translate3d(56%, 20%, 0) scale(0.94); opacity: 0.95; }
        70% { transform: translate3d(30%, 62%, 0) scale(1.04); opacity: 0.95; }
        100% { transform: translate3d(8%, 14%, 0) scale(1.0); opacity: 0.0; }
      }

      @keyframes hsReadoutFlicker {
        0%, 100% { opacity: 0.9; }
        18% { opacity: 0.7; }
        44% { opacity: 1; }
        72% { opacity: 0.75; }
      }

      .hs-anim-badge {
        background-image: linear-gradient(
          90deg,
          rgba(59,130,246,0.0),
          rgba(59,130,246,0.35),
          rgba(147,197,253,0.55),
          rgba(59,130,246,0.25),
          rgba(59,130,246,0.0)
        );
        background-size: 220% 220%;
        animation: hsBadgeMove 1.2s ease-in-out infinite;
      }

      .hs-scan-frame {
        position: relative;
        display: block;
      }

      /* Ensure image and overlay stack correctly */
      .hs-scan-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        z-index: 1;
      }

      .hs-scan-overlay {
        pointer-events: none;
        position: absolute;
        inset: 0;
        border-radius: 1.5rem;
        overflow: hidden;
        z-index: 2;
      }

      /* Slight dim so the scan effect reads clearly even on bright photos */
      .hs-scan-dim {
        position: absolute;
        inset: 0;
        background: linear-gradient(
          180deg,
          rgba(2,6,23,0.18),
          rgba(2,6,23,0.30)
        );
        mix-blend-mode: multiply;
      }

      /* pseudo edge trace (not true CV, but gives that "contour" feel) */
      .hs-edge-trace {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.38;
        filter: grayscale(1) contrast(3.4) brightness(1.75);
        mix-blend-mode: screen;
      }

      /* animated noise (helps motion read, feels more "sci‑fi") */
      .hs-scan-noise {
        position: absolute;
        inset: 0;
        background-image:
          repeating-linear-gradient(
            0deg,
            rgba(255,255,255,0.00) 0px,
            rgba(255,255,255,0.00) 2px,
            rgba(255,255,255,0.06) 3px,
            rgba(255,255,255,0.00) 6px
          ),
          repeating-linear-gradient(
            90deg,
            rgba(34,211,238,0.00) 0px,
            rgba(34,211,238,0.00) 12px,
            rgba(34,211,238,0.10) 13px,
            rgba(34,211,238,0.00) 20px
          );
        mix-blend-mode: screen;
        animation: hsNoiseShift 1.35s ease-in-out infinite;
      }

      .hs-hud-top {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        z-index: 5;
        animation: hsHudFlicker 2.1s ease-in-out infinite;
      }

      .hs-hud-chip {
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(34,211,238,0.55);
        background: rgba(2,6,23,0.50);
        color: rgba(165,243,252,0.95);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.10em;
        text-transform: uppercase;
      }

      .hs-hud-sub {
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(34,211,238,0.25);
        background: rgba(2,6,23,0.34);
        color: rgba(207,250,254,0.92);
        font-size: 12px;
        font-weight: 600;
      }

      .hs-hud-readout {
        position: absolute;
        left: 12px;
        bottom: 12px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(2,6,23,0.45);
        border: 1px solid rgba(34,211,238,0.22);
        box-shadow: 0 0 40px rgba(34,211,238,0.14);
        color: rgba(207,250,254,0.92);
        font-size: 12px;
        line-height: 1.35;
        z-index: 5;
        animation: hsReadoutFlicker 2.6s ease-in-out infinite;
        backdrop-filter: blur(6px);
      }

      .hs-hud-readout strong {
        color: rgba(165,243,252,0.98);
        font-weight: 800;
        letter-spacing: 0.04em;
      }

      .hs-scan-grid {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(59,130,246,0.0), rgba(59,130,246,0.0)),
          linear-gradient(90deg, rgba(34,211,238,0.70) 1px, rgba(34,211,238,0.0) 1px),
          linear-gradient(rgba(34,211,238,0.70) 1px, rgba(34,211,238,0.0) 1px);
        background-size: 100% 100%, 22px 22px, 22px 22px;
        animation: hsGridDrift 1.6s ease-in-out infinite;
        mix-blend-mode: screen;
      }

      /* diagonal sweep band for extra motion readability */
      .hs-scan-sweep {
        position: absolute;
        inset: -40%;
        background: linear-gradient(
          90deg,
          rgba(34,211,238,0.0),
          rgba(165,243,252,0.28),
          rgba(34,211,238,0.0)
        );
        filter: blur(0.2px);
        mix-blend-mode: screen;
        animation: hsSweep 2.4s ease-in-out infinite;
      }

      /* pseudo face-mesh "nodes" + diagonals, drifting/shimmering */
      .hs-scan-mesh {
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle at 22% 26%, rgba(191,219,254,1.0) 0 3px, rgba(147,197,253,0.0) 4px),
          radial-gradient(circle at 48% 18%, rgba(191,219,254,0.95) 0 3px, rgba(147,197,253,0.0) 4px),
          radial-gradient(circle at 68% 28%, rgba(191,219,254,1.0) 0 3px, rgba(147,197,253,0.0) 4px),
          radial-gradient(circle at 35% 52%, rgba(191,219,254,0.92) 0 3px, rgba(147,197,253,0.0) 4px),
          radial-gradient(circle at 58% 56%, rgba(191,219,254,0.98) 0 3px, rgba(147,197,253,0.0) 4px),
          radial-gradient(circle at 44% 74%, rgba(191,219,254,0.95) 0 3px, rgba(147,197,253,0.0) 4px),
          linear-gradient(120deg, rgba(34,211,238,0.0) 0%, rgba(165,243,252,0.40) 35%, rgba(34,211,238,0.0) 72%),
          linear-gradient(35deg, rgba(34,211,238,0.0) 0%, rgba(165,243,252,0.34) 40%, rgba(34,211,238,0.0) 78%);
        animation: hsGridDrift 2.2s ease-in-out infinite, hsMeshShimmer 1.45s ease-in-out infinite;
        mix-blend-mode: screen;
      }

      /* center crosshair (keeps it feeling like a scanner, not just a box) */
      .hs-scan-crosshair {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 50% 50%, rgba(165,243,252,0.0) 0 22px, rgba(165,243,252,0.25) 23px 24px, rgba(165,243,252,0.0) 25px 60px),
          linear-gradient(to right, rgba(34,211,238,0.0), rgba(34,211,238,0.55), rgba(34,211,238,0.0)) 50% 50% / 240px 1px no-repeat,
          linear-gradient(to bottom, rgba(34,211,238,0.0), rgba(34,211,238,0.55), rgba(34,211,238,0.0)) 50% 50% / 1px 240px no-repeat;
        mix-blend-mode: screen;
        animation: hsCrosshairPulse 1.9s ease-in-out infinite;
      }

      .hs-scan-target {
        position: absolute;
        width: 240px;
        height: 175px;
        border-radius: 6px; /* less "rounded rectangle", more CV box */
        border: 2px solid rgba(165,243,252,0.95);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.14) inset,
          0 0 52px rgba(34,211,238,0.55);
        background:
          radial-gradient(circle at 50% 50%, rgba(34,211,238,0.14), rgba(34,211,238,0.0) 72%),
          linear-gradient(to right, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) top left / 26px 2px no-repeat,
          linear-gradient(to bottom, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) top left / 2px 26px no-repeat,
          linear-gradient(to left, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) top right / 26px 2px no-repeat,
          linear-gradient(to bottom, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) top right / 2px 26px no-repeat,
          linear-gradient(to right, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) bottom left / 26px 2px no-repeat,
          linear-gradient(to top, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) bottom left / 2px 26px no-repeat,
          linear-gradient(to left, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) bottom right / 26px 2px no-repeat,
          linear-gradient(to top, rgba(165,243,252,0.95), rgba(165,243,252,0.0)) bottom right / 2px 26px no-repeat;
        animation: hsTargetMove 2.6s ease-in-out infinite;
      }

      @media (max-width: 420px) {
        .hs-scan-target {
          width: 190px;
          height: 145px;
        }

        .hs-scan-crosshair {
          background:
            radial-gradient(circle at 50% 50%, rgba(165,243,252,0.0) 0 18px, rgba(165,243,252,0.25) 19px 20px, rgba(165,243,252,0.0) 21px 52px),
            linear-gradient(to right, rgba(34,211,238,0.0), rgba(34,211,238,0.55), rgba(34,211,238,0.0)) 50% 50% / 200px 1px no-repeat,
            linear-gradient(to bottom, rgba(34,211,238,0.0), rgba(34,211,238,0.55), rgba(34,211,238,0.0)) 50% 50% / 1px 200px no-repeat;
        }
      }

      /* Thick scan "band" behind the line so the movement reads instantly */
      .hs-scan-band {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 380px;
        background: linear-gradient(
          180deg,
          rgba(59,130,246,0.00) 0%,
          rgba(34,211,238,0.22) 28%,
          rgba(165,243,252,0.55) 50%,
          rgba(34,211,238,0.22) 72%,
          rgba(59,130,246,0.00) 100%
        );
        filter: blur(0.25px);
        animation: hsScanLine 2.4s linear infinite;
        mix-blend-mode: screen;
      }

      .hs-scan-line {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 26px;
        background: linear-gradient(
          90deg,
          rgba(34,211,238,0.0),
          rgba(34,211,238,1.0),
          rgba(165,243,252,1.0),
          rgba(34,211,238,1.0),
          rgba(34,211,238,0.0)
        );
        filter: drop-shadow(0 0 36px rgba(34,211,238,0.95));
        animation: hsScanLine 2.4s linear infinite;
      }

      .hs-scan-corners {
        position: absolute;
        inset: 0;
        border-radius: 1.5rem;
        border: 1px solid rgba(34,211,238,0.32);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.08) inset,
          0 0 70px rgba(34,211,238,0.18);

        /* corner brackets */
        background:
          linear-gradient(to right, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) top left / 44px 2px no-repeat,
          linear-gradient(to bottom, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) top left / 2px 44px no-repeat,
          linear-gradient(to left, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) top right / 44px 2px no-repeat,
          linear-gradient(to bottom, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) top right / 2px 44px no-repeat,
          linear-gradient(to right, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) bottom left / 44px 2px no-repeat,
          linear-gradient(to top, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) bottom left / 2px 44px no-repeat,
          linear-gradient(to left, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) bottom right / 44px 2px no-repeat,
          linear-gradient(to top, rgba(34,211,238,0.85), rgba(34,211,238,0.0)) bottom right / 2px 44px no-repeat;
      }

      .hs-scan-glow {
        position: absolute;
        inset: -30px;
        background: radial-gradient(
          circle at 50% 30%,
          rgba(34,211,238,0.34),
          rgba(34,211,238,0.00) 55%
        );
        animation: hsPulseGlow 1.65s ease-in-out infinite;
      }

      @media (prefers-reduced-motion: reduce) {
        .hs-anim-badge,
        .hs-scan-grid,
        .hs-scan-sweep,
        .hs-scan-mesh,
        .hs-scan-crosshair,
        .hs-scan-target,
        .hs-scan-band,
        .hs-scan-line,
        .hs-scan-glow,
        .hs-hud-top,
        .hs-hud-readout,
        .hs-scan-noise {
          animation: none !important;
        }
      }
    `}</style>
  );
}
