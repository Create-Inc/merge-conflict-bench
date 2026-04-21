export function animateLiveUsers(liveMatRef, liveHaloMatRef, seconds) {
  const liveA = liveMatRef.current;
  const liveB = liveHaloMatRef.current;

  if (liveA && liveB) {
    const pulse = 0.5 + 0.5 * Math.sin(seconds * 1.15);
    liveA.size = 0.013 + pulse * 0.003;
    liveA.opacity = 0.86 + pulse * 0.12;
    liveB.size = 0.033 + pulse * 0.012;
    liveB.opacity = 0.14 + pulse * 0.12;
  }
}

export function animateGroupHalos(groupHaloMeshes, seconds) {
  const halos = groupHaloMeshes || [];
  for (let i = 0; i < halos.length; i += 1) {
    const h = halos[i];
    const breathe = 0.5 + 0.5 * Math.sin(seconds * 0.55 + i * 0.35);
    const s = 1 + breathe * 0.55;
    h.scale.set(s, s, s);
    if (h.material) {
      h.material.opacity = 0.22 + breathe * 0.28;
    }
  }
}

export function animateContinentSparks(
  continentSparks,
  continentPresenceRef,
  seconds,
) {
  try {
    const counts = continentPresenceRef.current || {};
    const sparks = continentSparks || [];

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    const seeded01 = (n) => {
      const x = Math.sin(n) * 10000;
      return x - Math.floor(x);
    };

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

      // Re-seed spark timing when it turns on.
      if (!s.init) {
        s.init = true;
        for (let j = 0; j < (s.sparks || []).length; j += 1) {
          const sp = s.sparks[j];
          const jitter = seeded01(s.seed * 3.3 + sp.seed * 0.77 + j * 9.1);
<<<<<<< ours
          // “More active premium” sparkling (MANDATORY): higher frequency (no sparkle count changes).
          sp.nextAt = seconds + 0.05 + jitter * 0.4;
=======
          // “More active premium” sparkling (MANDATORY): increase frequency (no sparkle count changes).
          // NOTE: sparkle scale animation curve is unchanged.
          sp.nextAt = seconds + 0.05 + jitter * 0.42;
>>>>>>> theirs
          sp.startAt = 0;
        }
      }

      // Gold core (55–70% opacity)
      const activityBoost = clamp(Math.log2(count + 1) * 0.05, 0, 0.15);
      const coreOpacity = clamp(0.55 + activityBoost, 0.55, 0.7);
      // Glow opacity must remain 25–40% (MANDATORY)
      const glowOpacity = clamp(0.25 + activityBoost * 1.0, 0.25, 0.4);

      if (s.core.material) s.core.material.opacity = coreOpacity;
      if (s.glow.material) s.glow.material.opacity = glowOpacity;

      // Diamond spark: quick, tiny glints with random timing.
      for (let j = 0; j < (s.sparks || []).length; j += 1) {
        const sp = s.sparks[j];
        if (!sp?.mesh || !sp.mesh.material) continue;

        if (seconds >= sp.nextAt) {
          const rA = seeded01(sp.seed * 11.7 + seconds * 0.9 + j * 1.3);
          const rB = seeded01(sp.seed * 5.2 + seconds * 1.7 + j * 2.1);

          sp.dur = 0.15 + rA * 0.1; // 0.15–0.25 (unchanged)
          sp.startAt = seconds;
<<<<<<< ours
          // More frequent micro-glints (keep size tiny; keep scale animation curve unchanged).
          sp.nextAt = seconds + sp.dur + (0.08 + rB * 0.42);
=======
          // Increase sparkle frequency; keep size tiny; keep scale animation curve unchanged.
          sp.nextAt = seconds + sp.dur + (0.09 + rB * 0.45);
>>>>>>> theirs
        }

        const p = sp.startAt ? (seconds - sp.startAt) / sp.dur : 2;
        const active = p >= 0 && p <= 1;
        if (!active) continue;

        const tri = 1 - Math.abs(p * 2 - 1);
        const glint = Math.pow(tri, 1.6);

        sp.mesh.visible = true;
        sp.mesh.scale.set(
          0.75 + glint * 0.35,
          0.75 + glint * 0.35,
          0.75 + glint * 0.35,
        );

        // Brighter premium sparkle (MANDATORY): increase brightness, keep size tiny.
<<<<<<< ours
        sp.mesh.material.opacity = clamp(0.72 + glint * 0.26, 0.72, 0.98);
=======
        sp.mesh.material.opacity = clamp(0.68 + glint * 0.28, 0.68, 0.96);
>>>>>>> theirs
      }
    }
  } catch (e) {
    // ignore
  }
}

// NEW: scattered unique visitor sparkles (opacity only; no size/radius changes)
export function animateVisitorSparks(visitorSparks, seconds) {
  try {
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const list = visitorSparks || [];

    for (let i = 0; i < list.length; i += 1) {
      const s = list[i];
      if (!s?.core?.material || !s?.spark?.material) continue;

      // keep core steady and readable
      s.core.material.opacity = 0.78;

      // Increase ONLY the spark visibility (+~20%) while keeping the same shimmer timing.
      const tw = 0.5 + 0.5 * Math.sin(seconds * 1.7 + s.seed * 0.01);
      s.spark.material.opacity = clamp(0.54 + tw * 0.18, 0.54, 0.72);
    }
  } catch (e) {
    // ignore
  }
}
