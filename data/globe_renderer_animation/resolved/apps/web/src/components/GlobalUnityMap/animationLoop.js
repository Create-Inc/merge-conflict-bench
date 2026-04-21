import { clamp } from "@/utils/globeHelpers";

const seeded01 = (n) => {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

export function createAnimationLoop({
  renderer,
  scene,
  camera,
  globeGroup,
  dragRef,
  rotationSpeedSeconds,
  liveMatRef,
  liveHaloMatRef,
  groupHaloMeshesRef,
  upcomingRingMeshesRef,
  continentPresenceRef,
  continentSparksRef,
}) {
  let last = performance.now();
  let rafId = null;

  const tick = (t) => {
    const dt = (t - last) / 1000;
    last = t;

    const drag = dragRef.current;
    const shouldAutoRotate = !drag.isDown;

    if (shouldAutoRotate) {
      const ySpeed = (Math.PI * 2) / rotationSpeedSeconds;
      globeGroup.rotation.y += ySpeed * dt;
    }

    const seconds = t / 1000;

    // Live users gentle pulse
    const liveMatA = liveMatRef.current;
    const liveMatB = liveHaloMatRef.current;
    if (liveMatA && liveMatB) {
      const pulse = 0.5 + 0.5 * Math.sin(seconds * 1.15);
      liveMatA.size = 0.011 + pulse * 0.003;
      liveMatA.opacity = 0.86 + pulse * 0.12;
      liveMatB.size = 0.028 + pulse * 0.01;
      liveMatB.opacity = 0.16 + pulse * 0.12;
    }

    // Active groups: slow breathing glow
    const halos = groupHaloMeshesRef.current || [];
    for (let i = 0; i < halos.length; i += 1) {
      const h = halos[i];
      const breathe = 0.5 + 0.5 * Math.sin(seconds * 0.55 + i * 0.35);
      const s = 1 + breathe * 0.55;
      h.scale.set(s, s, s);
      if (h.material) {
        h.material.opacity = 0.22 + breathe * 0.28;
      }
    }

    // Upcoming rings: slight pulse
    const rings = upcomingRingMeshesRef.current || [];
    for (let i = 0; i < rings.length; i += 1) {
      const r = rings[i];
      const k = 0.5 + 0.5 * Math.sin(seconds * 0.9 + i * 0.6);
      const s = 1 + k * 0.22;
      r.scale.set(s, s, s);
      if (r.material) {
        r.material.opacity = 0.38 + k * 0.22;
      }
    }

    // --- Continent sparks (visual-only shimmer) ---
    const counts = continentPresenceRef.current || {};
    const sparks = continentSparksRef.current || [];

    for (let i = 0; i < sparks.length; i += 1) {
      const s = sparks[i];
      const count = Math.max(0, Number(counts?.[s.key] || 0) || 0);
      const show = count > 0;

      if (!s?.core || !s?.glow) continue;

      s.core.visible = show;
      s.glow.visible = show;

      for (const sp of s.sparks || []) {
        if (sp?.mesh) sp.mesh.visible = false;
      }

      if (!show) {
        s.init = false;
        continue;
      }

      // Re-seed timing when it turns on.
      if (!s.init) {
        s.init = true;
        for (let j = 0; j < (s.sparks || []).length; j += 1) {
          const sp = s.sparks[j];
          const jitter = seeded01(s.seed * 3.3 + sp.seed * 0.77 + j * 9.1);
          // “More active premium” sparkling (MANDATORY): higher frequency (no sparkle count changes).
          sp.nextAt = seconds + 0.05 + jitter * 0.4;
          sp.startAt = 0;
        }
      }

      const activityBoost = clamp(Math.log2(count + 1) * 0.05, 0, 0.15);
      const coreOpacity = clamp(0.55 + activityBoost, 0.55, 0.7);
      // Glow opacity must remain 25–40% (MANDATORY)
      const glowOpacity = clamp(0.25 + activityBoost * 1.0, 0.25, 0.4);

      if (s.core.material) s.core.material.opacity = coreOpacity;
      if (s.glow.material) s.glow.material.opacity = glowOpacity;

      for (let j = 0; j < (s.sparks || []).length; j += 1) {
        const sp = s.sparks[j];
        if (!sp?.mesh || !sp.mesh.material) continue;

        if (seconds >= sp.nextAt) {
          const rA = seeded01(sp.seed * 11.7 + seconds * 0.9 + j * 1.3);
          const rB = seeded01(sp.seed * 5.2 + seconds * 1.7 + j * 2.1);

          sp.dur = 0.15 + rA * 0.1; // 0.15–0.25 (unchanged)
          sp.startAt = seconds;
          // More frequent micro-glints (keep size tiny; keep scale curve unchanged).
          sp.nextAt = seconds + sp.dur + (0.08 + rB * 0.42);
        }

        const p = sp.startAt ? (seconds - sp.startAt) / sp.dur : 2;
        const active = p >= 0 && p <= 1;
        if (!active) continue;

        const tri = 1 - Math.abs(p * 2 - 1);
        const glint = Math.pow(tri, 1.6);

        sp.mesh.visible = true;
        // IMPORTANT: sparkle scale animation curve must remain unchanged.
        sp.mesh.scale.set(
          0.75 + glint * 0.35,
          0.75 + glint * 0.35,
          0.75 + glint * 0.35,
        );

        // Brighter premium sparkle (MANDATORY)
        sp.mesh.material.opacity = clamp(0.72 + glint * 0.26, 0.72, 0.98);
      }
    }

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(tick);
  };

  const start = () => {
    if (rafId) return;
    last = performance.now();
    rafId = requestAnimationFrame(tick);
  };

  const stop = () => {
    if (!rafId) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  return { start, stop };
}
