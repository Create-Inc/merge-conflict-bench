import { useEffect, useMemo, useRef } from "react";
import {
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

export function GlobeRenderer({
  data,
  height = 360,
  mode = "preview",
  onOpen,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const continentPresenceRef = useContinentPresence();

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
