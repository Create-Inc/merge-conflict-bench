import { useEffect, useMemo, useRef } from "react";
import {
<<<<<<< ours
  createRenderer,
  createScene,
  createCamera,
  createGlobe,
  loadEarthTexture,
} from "./sceneSetup";
import { createMarkers } from "./markerCreation";
import { createContinentSparks } from "./continentSparks";
import { createAnimationLoop } from "./animationLoop";
import { createInteractionHandlers } from "./interactionHandlers";
import { useEchoRipples } from "./echoRipples";
import { useContinentPresence } from "./useContinentPresence";
import { rotateToUserRegion } from "./regionRotation";
=======
  latLonToVec3,
  clamp,
  guessRegionFromTimeZone,
  REGION_CENTER,
} from "@/utils/globeHelpers";
import {
  ECHO_OF_PRAYER_EVENT,
  normalizeEchoRegion,
} from "@/utils/echoOfPrayer";
import { createContinentSparks } from "./continentSparks";
>>>>>>> theirs

export function GlobeRenderer({
  data,
  height = 360,
  mode = "preview",
  onOpen,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const continentPresenceRef = useContinentPresence();

  const rafRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const globeGroupRef = useRef(null);
  const pointMeshesRef = useRef([]);
  const livePointsRef = useRef(null);
  const liveHaloPointsRef = useRef(null);
  const liveMatRef = useRef(null);
  const liveHaloMatRef = useRef(null);
  const groupHaloMeshesRef = useRef([]);
  const upcomingRingMeshesRef = useRef([]);
  const continentSparksRef = useRef([]);

  const dragRef = useRef({
    isDown: false,
    moved: false,
    lastX: 0,
    lastY: 0,
  });

  const rotationSpeedSeconds = 13.5;

  const points = useMemo(() => {
    const activeGroups = Array.isArray(data?.activeGroups)
      ? data.activeGroups
      : [];
    const liveUsers = Array.isArray(data?.liveUsers) ? data.liveUsers : [];

    return {
      activeGroups,
      liveUsers,
    };
  }, [data]);

  const echoRipples = useEchoRipples({ wrapRef, cameraRef, globeGroupRef });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const radius = 1;

    const renderer = createRenderer(canvas);
    const scene = createScene();
    const camera = createCamera();

    const { globeGroup, sphereMat, goldTintMat } = createGlobe(mode, radius);
    scene.add(globeGroup);

    const disposeCallbacks = [];
    const onDispose = (cb) => disposeCallbacks.push(cb);

    loadEarthTexture(mode, renderer, sphereMat, goldTintMat, onDispose);

    const {
      pointMeshes,
      groupHaloMeshes,
      upcomingRingMeshes,
      livePoints,
      liveHaloPoints,
      liveMat,
      liveHaloMat,
    } = createMarkers(points, globeGroup, radius);

    const continentSparks = createContinentSparks(globeGroup, radius);

<<<<<<< ours

=======
    // --- TEXTURED SPHERE (crisp, cloud-free) ---
    const isFullscreen = mode === "fullscreen";
    const sphereGeom = new THREE.SphereGeometry(
      radius,
      isFullscreen ? 128 : 96,
      isFullscreen ? 96 : 72,
    );

    const sphereMat = new THREE.MeshPhongMaterial({
      // warm off-white base, then we add gold tint + lighting
      color: 0xf8f3e8,
      transparent: false,
      opacity: 1,
      // Reduce specular so we don't get a silvery highlight accenting the seam.
      shininess: 0,
      specular: new THREE.Color(0x000000),
      emissive: new THREE.Color(0x1a1407),
      emissiveIntensity: 0.35,
    });

    // Make oceans FULLY transparent via alpha cutout (no blend)
    enableOceanTranslucency(sphereMat);

    const sphere = new THREE.Mesh(sphereGeom, sphereMat);
    globeGroup.add(sphere);

    // stronger gold warmth overlay to match your gold globe reference
    const goldTintMat = new THREE.MeshBasicMaterial({
      color: 0xd4af37,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const goldTint = new THREE.Mesh(
      new THREE.SphereGeometry(
        radius * 1.001,
        isFullscreen ? 128 : 96,
        isFullscreen ? 96 : 72,
      ),
      goldTintMat,
    );
    globeGroup.add(goldTint);

    // rim glow (kept)
    const glowGeom = new THREE.SphereGeometry(radius * 1.03, 48, 32);
    globeGroup.add(
      new THREE.Mesh(
        glowGeom,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.06,
          side: THREE.BackSide,
        }),
      ),
    );
    globeGroup.add(
      new THREE.Mesh(
        glowGeom,
        new THREE.MeshBasicMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.045,
          side: THREE.BackSide,
        }),
      ),
    );

    // load texture (remote, CORS enabled)
    const earthUrl =
      mode === "fullscreen" ? EARTH_TEXTURE_FULLSCREEN : EARTH_TEXTURE_PREVIEW;

    let disposed = false;
    const texLoader = new THREE.TextureLoader();
    try {
      texLoader.setCrossOrigin("anonymous");
    } catch (e) {
      // ignore
    }

    texLoader.load(
      earthUrl,
      (tex) => {
        if (disposed) return;

        // Texture alignment: we now shift in-shader (seam-safe), so keep offset at 0.
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1, 1);
        tex.offset.set(0, 0);

        // Make it as crisp as possible.
        try {
          tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
        } catch (e) {
          // ignore
        }
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.generateMipmaps = true;

        // best-effort SRGB
        try {
          if ("colorSpace" in tex && "SRGBColorSpace" in THREE) {
            tex.colorSpace = THREE.SRGBColorSpace;
          }
        } catch (e) {
          // ignore
        }
        try {
          if ("encoding" in tex && "sRGBEncoding" in THREE) {
            tex.encoding = THREE.sRGBEncoding;
          }
        } catch (e) {
          // ignore
        }

        tex.needsUpdate = true;
        sphereMat.map = tex;
        sphereMat.needsUpdate = true;

        // Ensure the gold tint overlay does NOT fill oceans.
        // We reuse the same texture only as a mask.
        goldTintMat.map = tex;
        enableOceanCutoutFromMapSample(goldTintMat);
        goldTintMat.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.error("Failed to load earth texture", err);
      },
    );

    // --- MARKERS / GLOWS (3 distinct types) ---
    const COLOR_LIVE = 0xfffdf7; // white-gold
    const COLOR_GOLD = 0xd4a437; // pure gold

    const pointMeshes = [];
    groupHaloMeshesRef.current = [];
    upcomingRingMeshesRef.current = [];

    // Active Prayer Groups (gold point + strong glow + slow breathing)
    const groupPointGeom = new THREE.SphereGeometry(0.02, 12, 12);
    const groupHaloGeom = new THREE.SphereGeometry(0.055, 16, 16);

    const groupPointMat = new THREE.MeshBasicMaterial({
      color: COLOR_GOLD,
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
    });

    const groupHaloMat = new THREE.MeshBasicMaterial({
      color: COLOR_GOLD,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Upcoming Sessions (gold ring only)
    const ringMat = new THREE.MeshBasicMaterial({
      color: COLOR_GOLD,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
    });

    const toPos = (lat, lon, r) => {
      return latLonToVec3(Number(lat), Number(lon), r);
    };

    // Deterministic 0..1 jitter helper used for premium sparkle timing.
    // (Keep this logic unchanged — it affects sparkle frequency but not count/curves.)
    const seeded01 = (n) => {
      const x = Math.sin(n) * 10000;
      return x - Math.floor(x);
    };

    // Active Prayer Groups
    for (const g of points.activeGroups) {
      const pos = toPos(g.lat, g.lon, radius * 1.01);

      const m = new THREE.Mesh(groupPointGeom, groupPointMat);
      m.position.copy(pos);
      m.userData = { kind: "group", groupId: g.id };
      m.renderOrder = 10;
      globeGroup.add(m);
      pointMeshes.push(m);

      const halo = new THREE.Mesh(groupHaloGeom, groupHaloMat.clone());
      halo.position.copy(pos);
      halo.userData = { kind: "groupGlow" };
      halo.renderOrder = 9;
      globeGroup.add(halo);
      groupHaloMeshesRef.current.push(halo);

      if (g.status === "upcoming") {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.038, 0.0032, 12, 40),
          ringMat.clone(),
        );
        ring.position.copy(pos);
        ring.lookAt(new THREE.Vector3(0, 0, 0));
        ring.userData = { kind: "upcomingRing" };
        ring.renderOrder = 11;
        globeGroup.add(ring);
        upcomingRingMeshesRef.current.push(ring);
      }
    }

    // Live Users Online (small spark + soft halo + gentle pulse)
    const livePositions = [];
    for (const u of points.liveUsers) {
      const pos = toPos(u.lat, u.lon, radius * 1.015);
      livePositions.push(pos.x, pos.y, pos.z);
    }

    const liveGeom = new THREE.BufferGeometry();
    liveGeom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(livePositions, 3),
    );

    const liveMat = new THREE.PointsMaterial({
      color: COLOR_LIVE,
      size: 0.012,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });

    const liveHaloMat = new THREE.PointsMaterial({
      color: COLOR_LIVE,
      size: 0.03,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const livePoints = new THREE.Points(liveGeom, liveMat);
    livePoints.renderOrder = 20;
    globeGroup.add(livePoints);

    const liveHaloPoints = new THREE.Points(liveGeom, liveHaloMat);
    liveHaloPoints.renderOrder = 19;
    globeGroup.add(liveHaloPoints);

    livePointsRef.current = livePoints;
    liveHaloPointsRef.current = liveHaloPoints;
    liveMatRef.current = liveMat;
    liveHaloMatRef.current = liveHaloMat;

    // --- Continent presence shimmers (MANDATORY update) ---
    // Replace circular “balloon” glow with continent-scaled elliptical radiance.
    // Keep: gold core size/color, shimmer count, presence logic, and sparkle scale animation curve.
    // North America anchor is handled via REGION_CENTER (39, -98) in globeHelpers.
    continentSparksRef.current = createContinentSparks(radius, globeGroup);

    // references
>>>>>>> theirs
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    globeGroupRef.current = globeGroup;
    pointMeshesRef.current = pointMeshes;
    livePointsRef.current = livePoints;
    liveHaloPointsRef.current = liveHaloPoints;
    liveMatRef.current = liveMat;
    liveHaloMatRef.current = liveHaloMat;
    groupHaloMeshesRef.current = groupHaloMeshes;
    upcomingRingMeshesRef.current = upcomingRingMeshes;
    continentSparksRef.current = continentSparks;

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;

      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;

      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    resize();

    const animation = createAnimationLoop({
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
    });

    animation.start();

<<<<<<< ours

=======
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

        // When we first show again, re-seed timing so it feels alive.
        if (!s.init) {
          s.init = true;
          for (let j = 0; j < (s.sparks || []).length; j += 1) {
            const sp = s.sparks[j];
            const jitter = seeded01(s.seed * 3.3 + sp.seed * 0.77 + j * 9.1);
            // “More active premium” sparkling (MANDATORY): increase frequency (no sparkle count changes).
            // NOTE: sparkle scale animation curve is unchanged.
            sp.nextAt = seconds + 0.05 + jitter * 0.42;
            sp.startAt = 0;
          }
        }

        // Opacity: warm gold core at 55–70% depending on activity (no big pulse)
        const activityBoost = clamp(Math.log2(count + 1) * 0.05, 0, 0.15);
        const coreOpacity = clamp(0.55 + activityBoost, 0.55, 0.7);
        // Expanded glow: allow up to ~40% opacity while staying soft.
        const glowOpacity = clamp(0.25 + activityBoost * 1.0, 0.25, 0.4);

        if (s.core.material) s.core.material.opacity = coreOpacity;
        if (s.glow.material) s.glow.material.opacity = glowOpacity;

        // Micro diamond glints (0.15–0.25s) with randomized spacing
        for (let j = 0; j < (s.sparks || []).length; j += 1) {
          const sp = s.sparks[j];
          if (!sp?.mesh || !sp.mesh.material) continue;

          if (seconds >= sp.nextAt) {
            const rA = seeded01(sp.seed * 11.7 + seconds * 0.9 + j * 1.3);
            const rB = seeded01(sp.seed * 5.2 + seconds * 1.7 + j * 2.1);

            sp.dur = 0.15 + rA * 0.1; // 0.15–0.25
            sp.startAt = seconds;
            // More frequent micro-glints (keep size tiny; keep scale animation curve unchanged).
            sp.nextAt = seconds + sp.dur + (0.09 + rB * 0.45);
          }

          const p = sp.startAt ? (seconds - sp.startAt) / sp.dur : 2;
          const active = p >= 0 && p <= 1;

          if (!active) continue;

          const tri = 1 - Math.abs(p * 2 - 1); // 0→1→0
          const glint = Math.pow(tri, 1.6);

          sp.mesh.visible = true;
          sp.mesh.scale.set(
            0.75 + glint * 0.35,
            0.75 + glint * 0.35,
            0.75 + glint * 0.35,
          );

          // Brighter premium sparkle (tiny size preserved).
          sp.mesh.material.opacity = clamp(0.68 + glint * 0.28, 0.68, 0.96);
        }
      }

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

>>>>>>> theirs
    const handleResize = () => resize();
    window.addEventListener("resize", handleResize);

    return () => {
      disposeCallbacks.forEach((cb) => cb());
      window.removeEventListener("resize", handleResize);
      animation.stop();

      try {
        renderer.dispose();
      } catch (e) {
        // ignore
      }
    };
  }, [
    points.activeGroups,
    points.liveUsers,
    rotationSpeedSeconds,
    mode,
    continentPresenceRef,
  ]);

  useEffect(() => {
    if (mode !== "fullscreen") return;
    const globeGroup = globeGroupRef.current;
    rotateToUserRegion(globeGroup);
  }, [mode]);

  const { onPointerDown, onPointerMove, onPointerUp, onPointerLeave } =
    createInteractionHandlers({
      dragRef,
      globeGroupRef,
      mode,
      onOpen,
      cameraRef,
      wrapRef,
      pointMeshesRef,
    });

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden"
      style={{ height }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      role="button"
      tabIndex={0}
      aria-label={
        mode === "preview" ? "Open global unity globe" : "Interactive globe"
      }
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,215,0,0.10) 0%, rgba(10,20,60,0.88) 35%, rgba(7,17,47,0.98) 100%)",
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          width: "100%",
          height: "100%",
          filter:
            "drop-shadow(0 0 8px rgba(255,248,231,0.26)) drop-shadow(0 0 14px rgba(255,243,212,0.12))",
        }}
      />

      {/* Echo of Prayer ripples (rendered ABOVE the canvas) */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "none", zIndex: 5 }}
      >
        {echoRipples.map((r) => (
          <div
            key={r.id}
            className="ob-echo-ripple"
            style={{ left: r.x, top: r.y, opacity: r.opacityBoost }}
          />
        ))}
      </div>

      <div
        className="absolute inset-0"
        style={{
          pointerEvents: "none",
          zIndex: 6,
          boxShadow:
            mode === "preview"
              ? "inset 0 0 80px rgba(0,0,0,0.45), inset 0 0 40px rgba(255,215,0,0.10)"
              : "inset 0 0 90px rgba(0,0,0,0.55), inset 0 0 55px rgba(255,215,0,0.12)",
        }}
      />
    </div>
  );
}
