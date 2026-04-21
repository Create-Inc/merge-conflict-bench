import * as THREE from "three";
import { latLonToVec3 } from "@/utils/globeHelpers";
import { REGION_CENTER } from "@/utils/globeHelpers";
import { CONTINENT_ELLIPSE_RADII } from "./constants";
import { getFeatherTexture } from "./textureHelpers";

const seeded01 = (n) => {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

<<<<<<< ours
export function createContinentSparks(globeGroup, radius) {
=======
// Continent-scaled ellipse radiance (MANDATORY). Values are half-width/half-height in globe units.
const CONTINENT_ELLIPSE_RADII = {
  // Wider horizontal radiance to remove the “balloon” look and read as continent-scale.
  "north-america": { rx: 0.35, ry: 0.2 },
  "south-america": { rx: 0.23, ry: 0.29 },
  europe: { rx: 0.21, ry: 0.15 },
  africa: { rx: 0.27, ry: 0.36 },
  asia: { rx: 0.4, ry: 0.24 },
  oceania: { rx: 0.23, ry: 0.15 },
};

let featherTex = null;
const getFeatherTexture = () => {
  if (featherTex) return featherTex;

  const size = 128;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const u = (x / (size - 1)) * 2 - 1;
      const v = (y / (size - 1)) * 2 - 1;
      const d = Math.sqrt(u * u + v * v);

      // Soft feathered edges (no balloon): keep center strong, fade to zero at edge.
      const edge = Math.max(0, Math.min(1, 1 - d));
      const a = Math.pow(edge, 2.2);

      const idx = (y * size + x) * 4;
      data[idx + 0] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = Math.round(a * 255);
    }
  }

  featherTex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  featherTex.needsUpdate = true;
  featherTex.wrapS = THREE.ClampToEdgeWrapping;
  featherTex.wrapT = THREE.ClampToEdgeWrapping;
  featherTex.magFilter = THREE.LinearFilter;
  featherTex.minFilter = THREE.LinearMipmapLinearFilter;

  return featherTex;
};

export function createContinentSparks(radius, globeGroup) {
>>>>>>> theirs
  const sparkKeys = [
    "north-america",
    "south-america",
    "europe",
    "africa",
    "asia",
    "oceania",
  ];

  const continentSparks = [];

  for (let i = 0; i < sparkKeys.length; i += 1) {
    const key = sparkKeys[i];
    const center = REGION_CENTER?.[key];
    if (!center) continue;

    const pos = latLonToVec3(center.lat, center.lon, radius * 1.03);

    // Gold core (tiny, elegant)
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xf5dfa3, // warm gold
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    // Glow (continent-scaled elliptical radiance; soft feathered edges)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xf5dfa3,
      transparent: true,
      opacity: 0,
      map: getFeatherTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });

    // Diamond spark(s) — brighter premium sparkle
    const sparkMat = new THREE.MeshBasicMaterial({
      color: 0xf8fbff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.0088, 12, 12),
      coreMat,
    );

    // Elliptical radiance: tangent-plane glow (removes "balloon" look).
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), glowMat);

    // Place sparks in a tiny orbit around the core (never continent-sized)
    const nrm = pos.clone().normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // Build a stable tangent basis (no drift).
    let tangent = new THREE.Vector3().crossVectors(up, nrm);
    if (tangent.lengthSq() < 1e-6) {
      tangent = new THREE.Vector3().crossVectors(
        new THREE.Vector3(1, 0, 0),
        nrm,
      );
    }
    tangent.normalize();

    const bitangent = new THREE.Vector3()
      .crossVectors(nrm, tangent)
      .normalize();

    const basis = new THREE.Matrix4();
    basis.makeBasis(tangent, bitangent, nrm);
    glow.quaternion.setFromRotationMatrix(basis);

    const radii = CONTINENT_ELLIPSE_RADII[key] || { rx: 0.22, ry: 0.18 };
    glow.scale.set(radii.rx * 2, radii.ry * 2, 1);

    // Octahedron reads like a tiny diamond/glint.
    const sparkGeom = new THREE.OctahedronGeometry(0.006);

    const mkSpark = (seed) => {
      const a = seeded01(seed * 19.7 + 1.1) * Math.PI * 2;
      const r = 0.01 + seeded01(seed * 13.3 + 2.2) * 0.006;
      const offset = tangent
        .clone()
        .multiplyScalar(Math.cos(a) * r)
        .add(bitangent.clone().multiplyScalar(Math.sin(a) * r))
        .add(nrm.clone().multiplyScalar(0.0025));

      const m = new THREE.Mesh(sparkGeom, sparkMat.clone());
      m.position.copy(pos.clone().add(offset));
      m.rotation.set(
        seeded01(seed * 7.1 + 0.3) * Math.PI,
        seeded01(seed * 8.4 + 0.7) * Math.PI,
        seeded01(seed * 9.3 + 0.9) * Math.PI,
      );
      m.visible = false;
      m.renderOrder = 31;
      globeGroup.add(m);
      return {
        mesh: m,
        seed,
        nextAt: 0,
        startAt: 0,
        dur: 0.2,
      };
    };

    core.position.copy(pos);
    glow.position.copy(pos.clone().add(nrm.clone().multiplyScalar(0.0035)));

    glow.renderOrder = 29;
    core.renderOrder = 30;

    core.visible = false;
    glow.visible = false;

    globeGroup.add(glow);
    globeGroup.add(core);

    const seed = i * 101.33 + 17.7;

    continentSparks.push({
      key,
      core,
      glow,
      sparks: [mkSpark(seed + 0.11), mkSpark(seed + 0.37)],
      seed,
      init: false,
    });
  }

  return continentSparks;
}
