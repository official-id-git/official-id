import * as THREE from "three";
import type { VoxelItem } from "@/lib/voxel-tree-generator";

export type WindUniforms = {
  uTime: { value: number };
  uWindDir: { value: THREE.Vector3 };
  uStrength: { value: number };
  uFlutter: { value: number };
  uGrowth: { value: number };
};

export function createWindUniforms(initialStrength = 0.9): WindUniforms {
  return {
    uTime: { value: 0 },
    uWindDir: { value: new THREE.Vector3(1, 0, 0.35).normalize() },
    uStrength: { value: initialStrength },
    uFlutter: { value: 0.09 },
    uGrowth: { value: 1.0 },
  };
}

export const WIND_DECLARATIONS = /* glsl */ `
attribute vec4 aWindData;   // x: aSway, y: aLeaf, z: aPhase, w: aGrowDelay
attribute vec4 aFlowerData; // x: aPart, y: aU, z: aAng, w: aExtra
uniform float uTime;
uniform vec3 uWindDir;
uniform float uStrength;
uniform float uFlutter;
uniform float uGrowth;

vec3 rotA(vec3 v, vec3 k, float a){
  float c = cos(a), s = sin(a);
  return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
}
`;

export const WIND_PROJECT_VERTEX = /* glsl */ `
float aSway = aWindData.x;
float aLeaf = aWindData.y;
float aPhase = aWindData.z;
float aGrowDelay = aWindData.w;
float aPart = aFlowerData.x;
float aU = aFlowerData.y;
float aAng = aFlowerData.z;
float aExtra = aFlowerData.w;

// Animasi tumbuh per-voxel: lantai QR langsung terlihat, batang & daun bermekaran
float g = (aGrowDelay <= 0.0) ? 1.0 : clamp((uGrowth - aGrowDelay) / 0.20, 0.0, 1.0);
float popScale = sin(g * 1.5707963);
transformed = position * popScale;

vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
  mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
  mvPosition = instanceMatrix * mvPosition;
#endif
{
  // Basis ortonormal bunga Patrakomala
  vec3 fU = vec3(0.7071068, 0.0, -0.7071068);
  vec3 fN = vec3(0.4472136, 0.7745967, 0.4472136);
  vec3 fV = vec3(-0.5477226, 0.6324555, -0.5477226);
  vec3 fCenter = vec3(0.0, 11.5, 0.0);

  if (aPart > 19.5 && aPart < 20.5) {
    // KIBARAN BENDERA GEDUNG VOXEL
    float gust = 0.65 + 0.35 * sin(uTime * 0.7) * sin(uTime * 0.31 + 1.3) + 0.3 * max(0.0, sin(uTime * 0.45 - 0.6));
    float W = uStrength * gust;
    float u = aU;
    float ph = uTime * (3.0 + 2.2 * W) - u * 7.0 + aPhase;
    float amp = (0.20 + 0.50 * W) * u;
    mvPosition.z += (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0)) * amp;
    mvPosition.y += -u * u * (0.5 - W * 0.25) + 0.10 * sin(ph * 1.4) * u;
    mvPosition.x -= abs(sin(ph)) * 0.15 * u * W;
  } else if (aPart > -5.0 && aPart < 15.0) {
    // 1. Koordinat lokal dalam ruang kelopak Patrakomala
    vec3 rel = mvPosition.xyz - fCenter;
    vec3 localP = vec3(dot(rel, fU), dot(rel, fN), dot(rel, fV));
    vec3 origLocalP = localP;

    // 2. Hembusan angin & deformasi rotasi Rodrigues (Patrakomala Wind Algorithm)
    float gust = 0.65 + 0.35 * sin(uTime * 0.7) * sin(uTime * 0.31 + 1.3) + 0.3 * max(0.0, sin(uTime * 0.45 - 0.6));
    float W = uStrength * gust;

    vec3 up = vec3(0.0, 1.0, 0.0);
    vec3 d  = vec3(cos(aAng), 0.0, sin(aAng));
    vec3 k  = vec3(-sin(aAng), 0.0, cos(aAng));
    vec3 wd = normalize(vec3(1.0, 0.0, 0.35));

    if (aPart > -0.5 && aPart < 4.5) {
      // KELOPAK: melengkung bertahap dari pangkal ke ujung + bergetar memutar
      float face = 0.7 + 0.3 * dot(d, wd);
      float wave = sin(uTime * 2.2 + aPhase - aU * 2.4);
      float a = W * face * (0.06 + 0.11 * wave) * aU * aU * 1.6;
      vec3 h = d * 1.6 + up * 0.5;
      localP = h + rotA(localP - h, k, a);
      float tw = W * 0.10 * aU * sin(uTime * 3.1 + aPhase * 1.7 - aU * 3.0);
      localP = rotA(localP, d, tw);
    } else if (aPart > 9.5) {
      // PUTIK & BENANG SARI: mengayun anggun seperti cambuk, ujung tertinggal dari pangkal
      float lag = aU * 1.8;
      float a1 = W * (0.09 * sin(uTime * 1.8 + aPhase - lag) + 0.035 * sin(uTime * 5.3 + aPhase * 2.1 - lag * 1.4)) * aU;
      float a2 = W * (0.07 * sin(uTime * 1.25 + aPhase * 0.8 - lag) + 0.05) * aU;
      vec3 h = vec3(0.0, 2.0, 0.0);
      localP = h + rotA(localP - h, k, a1);
      localP = h + rotA(localP - h, up, a2);
    }

    // Seluruh bunga bergoyang pelan
    float s = W * 0.03 * sin(uTime * 0.9);
    localP = rotA(localP, vec3(0.0, 0.0, 1.0), s);

    // 3. Proyeksikan delta kembali ke ruang dunia diorama
    vec3 deltaLocal = localP - origLocalP;
    vec3 deltaWorld = deltaLocal.x * fU + deltaLocal.y * fN + deltaLocal.z * fV;
    mvPosition.xyz += deltaWorld * popScale;
  } else {
    // Standard tree wind & leaf flutter
    vec3 dir = normalize(uWindDir);
    float bend = aSway * aSway;

    float gust = 0.55 + 0.35 * sin(uTime * 0.8) + 0.2 * sin(uTime * 2.3 + 1.7);
    float wave = sin(uTime * 1.6 - dot(mvPosition.xz, dir.xz) * 0.35);
    vec3 sway = dir * (gust + 0.35 * wave) * uStrength * bend;
    sway.y -= length(sway.xz) * 0.25;

    vec3 flutter = vec3(
      sin(uTime * 6.3 + aPhase),
      0.6 * sin(uTime * 7.7 + aPhase * 1.9),
      cos(uTime * 5.9 + aPhase * 1.3)
    ) * uFlutter * aLeaf * (0.4 + 0.6 * aSway);

    mvPosition.xyz += (sway + flutter) * popScale;
  }
}
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;
`;

export function applyWind(material: THREE.Material, uniforms: WindUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${WIND_DECLARATIONS}`)
      .replace("#include <project_vertex>", WIND_PROJECT_VERTEX);
  };
  material.customProgramCacheKey = () => "voxel-wind-growth-patrakomala-v6";
}

export function buildWindAttributes(voxels: VoxelItem[]) {
  const n = voxels.length;
  const windData = new Float32Array(n * 4);   // x: sway, y: leaf, z: phase, w: growDelay
  const flowerData = new Float32Array(n * 4); // x: part, y: u, z: ang, w: extra

  let maxY = 3;
  for (const v of voxels) {
    if ((v.role === "leaf" || v.role === "petal" || v.role === "stamen") && v.y > maxY) {
      maxY = v.y;
    }
  }
  const rootY = 1.5;

  let maxDistXZ = 1;
  for (const v of voxels) {
    const d = Math.hypot(v.x, v.z);
    if (d > maxDistXZ) maxDistXZ = d;
  }

  for (let i = 0; i < n; i++) {
    const v = voxels[i];
    const distXZ = Math.hypot(v.x, v.z) / maxDistXZ;

    let sway = 0;
    let leaf = 0;
    const phase = v.phase !== undefined ? v.phase : ((v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) % (Math.PI * 2));
    let growDelay = 0;

    const part = v.part !== undefined ? v.part : -99.0;
    const uParam = v.u !== undefined ? v.u : 0.0;
    const ang = v.ang !== undefined ? v.ang : 0.0;
    const extra = 0.0;

    if (v.role === "stone" || v.role === "border" || v.y < 1) {
      growDelay = 0.0;
    } else if (v.role === "trunk" || v.role === "branch") {
      const normY = Math.min(1, Math.max(0, (v.y - 1) / (maxY - 1)));
      growDelay = 0.05 + normY * 0.20;
    } else if (v.role === "leaf" || v.role === "hedge") {
      const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
      growDelay = 0.15 + normY * 0.20 + distXZ * 0.06;
    } else if (v.role === "petal" || v.role === "flower") {
      growDelay = 0.18 + distXZ * 0.16;
    } else if (v.role === "stamen") {
      growDelay = 0.30 + distXZ * 0.10;
    } else if (v.role === "person") {
      growDelay = 0.40;
    } else {
      growDelay = 0.10;
    }

    const movable =
      v.y >= 1 &&
      (v.role === "leaf" ||
        v.role === "trunk" ||
        v.role === "branch" ||
        v.role === "petal" ||
        v.role === "flower" ||
        v.role === "stamen");

    if (movable) {
      const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
      sway = Math.pow(normY, 1.2);

      if (v.role === "petal" || v.role === "flower") {
        leaf = 0.8;
      } else if (v.role === "stamen") {
        leaf = 1.5;
      } else if (v.role === "leaf") {
        leaf = Math.min(1.6, 0.9 / (v.size ?? 0.96));
      }
    }

    const idx = i * 4;
    windData[idx] = sway;
    windData[idx + 1] = leaf;
    windData[idx + 2] = phase;
    windData[idx + 3] = growDelay;

    flowerData[idx] = part;
    flowerData[idx + 1] = uParam;
    flowerData[idx + 2] = ang;
    flowerData[idx + 3] = extra;
  }

  return { windData, flowerData };
}

export function buildTreeMesh(
  voxels: VoxelItem[],
  wind: WindUniforms,
  options?: { shadows?: boolean }
): THREE.InstancedMesh {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const { windData, flowerData } = buildWindAttributes(voxels);
  geo.setAttribute("aWindData", new THREE.InstancedBufferAttribute(windData, 4));
  geo.setAttribute("aFlowerData", new THREE.InstancedBufferAttribute(flowerData, 4));

  const mat = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.05 });
  applyWind(mat, wind);

  const mesh = new THREE.InstancedMesh(geo, mat, voxels.length);
  mesh.castShadow = Boolean(options?.shadows);
  mesh.receiveShadow = Boolean(options?.shadows);
  mesh.frustumCulled = false;

  if (options?.shadows) {
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    applyWind(depthMat, wind);
    mesh.customDepthMaterial = depthMat;
  }

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  for (let i = 0; i < voxels.length; i++) {
    const v = voxels[i];
    const s = v.size ?? 0.96;
    dummy.position.set(v.x, v.y + s / 2, v.z);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    mesh.setColorAt(i, color.set(v.color));
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  return mesh;
}

export function disposeTreeMesh(mesh: THREE.InstancedMesh | null) {
  if (!mesh) return;
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => m.dispose());
  } else {
    mesh.material.dispose();
  }
  mesh.customDepthMaterial?.dispose();
}

import {
  HERO_RIG,
  HERO_JOINTS,
  HERO_POSES,
  HERO_SEQ,
  HERO_METAL,
  buildHeroCharacterRaw,
  type HeroCell,
} from "@/lib/voxel-tree-generator";

export interface HeroRigPose {
  label: string;
  hipsY: number;
  [joint: string]: any;
}

export interface HeroRigState {
  rootGroup: THREE.Group;
  characterGroup: THREE.Group;
  cloudGroup: THREE.Group;
  joints: Record<string, THREE.Group>;
  matBase: THREE.MeshStandardMaterial;
  matMetal: THREE.MeshStandardMaterial;
  instancedMeshes: THREE.InstancedMesh[];
  currentPose: HeroRigPose;
  fromPose: HeroRigPose;
  targetPose: HeroRigPose;
  targetName: string;
  transT: number;
  transDur: number;
  seqIndex: number;
  holdLeft: number;
  auto: boolean;
  time: number;
  scale: number;
  yBase: number;
  goTo: (name: string, dur?: number) => void;
  toggleAuto: () => boolean;
  dispose: () => void;
}

function cloneHeroPose(p: HeroRigPose): HeroRigPose {
  const o: HeroRigPose = { label: p.label || "", hipsY: p.hipsY };
  for (const j of HERO_JOINTS) {
    o[j] = (p[j] || [0, 0, 0]).slice();
  }
  return o;
}

const easeHero = (k: number) =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;

export function createHeroRig(options?: {
  scale?: number;
  yBase?: number;
  shadows?: boolean;
}): HeroRigState {
  const scale = options?.scale ?? 0.24;
  const yBase = options?.yBase ?? 0.35;
  const castShadow = options?.shadows !== false;

  const rootGroup = new THREE.Group();
  rootGroup.name = "HeroRigRoot";

  const characterGroup = new THREE.Group();
  characterGroup.name = "HeroCharacterGroup";
  characterGroup.scale.setScalar(scale);
  characterGroup.position.set(0, yBase, 0);
  rootGroup.add(characterGroup);

  const joints: Record<string, THREE.Group> = {};
  for (const name of HERO_JOINTS) {
    const g = new THREE.Group();
    g.name = `Joint_${name}`;
    g.position.fromArray(HERO_RIG[name].pos);
    joints[name] = g;
  }

  for (const name of HERO_JOINTS) {
    const parentName = HERO_RIG[name].parent;
    if (parentName) {
      joints[parentName].add(joints[name]);
    } else {
      characterGroup.add(joints[name]);
    }
  }

  const cloudGroup = new THREE.Group();
  cloudGroup.name = "HeroCloudGroup";
  characterGroup.add(cloudGroup);

  const matBase = new THREE.MeshStandardMaterial({
    roughness: 0.62,
    metalness: 0.0,
    envMapIntensity: 0.6,
  });
  const matMetal = new THREE.MeshStandardMaterial({
    roughness: 0.32,
    metalness: 0.85,
    envMapIntensity: 1.25,
  });

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const tmpM = new THREE.Matrix4();
  const tmpC = new THREE.Color();
  const instancedMeshes: THREE.InstancedMesh[] = [];

  function makeVoxelInstancedMesh(cells: HeroCell[], material: THREE.Material): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(boxGeo, material, cells.length);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = castShadow;
    for (let i = 0; i < cells.length; i++) {
      const v = cells[i];
      tmpM.makeTranslation(v.x, v.y, v.z);
      mesh.setMatrixAt(i, tmpM);
      tmpC.setHex(v.c);
      const perturb =
        (((((v.x * 73856093) ^ (v.y * 19349663) ^ (v.z * 83492791)) >>> 0) % 100) / 100) *
          0.04 -
        0.02;
      tmpC.multiplyScalar(1 + perturb);
      mesh.setColorAt(i, tmpC);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    instancedMeshes.push(mesh);
    return mesh;
  }

  function addCellsToGroup(group: THREE.Group, cells: HeroCell[]) {
    const metal = cells.filter((v) => HERO_METAL.has(v.c));
    const base = cells.filter((v) => !HERO_METAL.has(v.c));
    if (base.length > 0) group.add(makeVoxelInstancedMesh(base, matBase));
    if (metal.length > 0) group.add(makeVoxelInstancedMesh(metal, matMetal));
  }

  const charData = buildHeroCharacterRaw();
  for (const [name, cells] of Object.entries(charData.parts)) {
    if (joints[name]) {
      addCellsToGroup(joints[name], cells);
    }
  }
  addCellsToGroup(cloudGroup, charData.cloud);

  const initialPoseName = "kuda";
  const initialPose = HERO_POSES[initialPoseName];

  const state: HeroRigState = {
    rootGroup,
    characterGroup,
    cloudGroup,
    joints,
    matBase,
    matMetal,
    instancedMeshes,
    currentPose: cloneHeroPose(initialPose),
    fromPose: cloneHeroPose(initialPose),
    targetPose: initialPose,
    targetName: initialPoseName,
    transT: 1,
    transDur: 0.6,
    seqIndex: 0,
    holdLeft: HERO_SEQ[0][2],
    auto: true,
    time: 0,
    scale,
    yBase,
    goTo: (name: string, dur?: number) => {
      const pose = HERO_POSES[name];
      if (!pose) return;
      state.fromPose = cloneHeroPose(state.currentPose);
      state.targetPose = pose;
      state.targetName = name;
      state.transT = 0;
      state.transDur = dur !== undefined ? dur : (name.startsWith("pukul") ? 0.22 : 0.65);
    },
    toggleAuto: () => {
      state.auto = !state.auto;
      if (state.auto) {
        state.seqIndex = 0;
        state.holdLeft = 0;
        const [n, d] = HERO_SEQ[0];
        state.goTo(n, d);
      }
      return state.auto;
    },
    dispose: () => {
      rootGroup.removeFromParent();
      for (const m of instancedMeshes) {
        m.geometry.dispose();
      }
      matBase.dispose();
      matMetal.dispose();
      boxGeo.dispose();
    },
  };

  return state;
}

export function updateHeroRig(state: HeroRigState, dt: number) {
  state.time += dt;
  const t = state.time;

  if (state.auto && state.transT >= 1) {
    state.holdLeft -= dt;
    if (state.holdLeft <= 0) {
      state.seqIndex = (state.seqIndex + 1) % HERO_SEQ.length;
      const [name, dur, hold] = HERO_SEQ[state.seqIndex];
      state.goTo(name, dur);
      state.holdLeft = hold;
    }
  }

  state.transT = Math.min(1, state.transT + dt / Math.max(state.transDur, 0.001));
  const k = easeHero(state.transT);

  state.currentPose.hipsY =
    state.fromPose.hipsY + (state.targetPose.hipsY - state.fromPose.hipsY) * k;

  for (const j of HERO_JOINTS) {
    const a = state.fromPose[j] || [0, 0, 0];
    const b = state.targetPose[j] || [0, 0, 0];
    if (!state.currentPose[j]) state.currentPose[j] = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      state.currentPose[j][i] = a[i] + (b[i] - a[i]) * k;
    }
  }

  const flying = state.targetName === "terbang" ? k : 0;
  const breathe = Math.sin(t * 2.1);
  const J = state.joints;

  for (const j of HERO_JOINTS) {
    if (J[j] && state.currentPose[j]) {
      J[j].rotation.set(
        state.currentPose[j][0],
        state.currentPose[j][1],
        state.currentPose[j][2]
      );
    }
  }

  if (J.hips) {
    J.hips.position.y =
      HERO_RIG.hips.pos[1] +
      state.currentPose.hipsY +
      breathe * 0.25 * (1 - flying) +
      Math.sin(t * 1.6) * 1.2 * flying;
  }

  if (J.torso) {
    J.torso.rotation.x += breathe * 0.02;
    J.torso.scale.set(1 + breathe * 0.008, 1, 1 + breathe * 0.012);
  }

  if (J.sash) {
    J.sash.rotation.z += Math.sin(t * 2.6) * 0.12 + Math.sin(t * 5.1) * 0.04;
    J.sash.rotation.x += Math.sin(t * 2.1 + 1) * 0.1;
  }

  if (J.wingL) {
    J.wingL.rotation.y += Math.sin(t * 4.2) * 0.14 * flying;
  }
  if (J.wingR) {
    J.wingR.rotation.y -= Math.sin(t * 4.2) * 0.14 * flying;
  }

  if (state.cloudGroup) {
    state.cloudGroup.position.y = Math.sin(t * 0.8) * 0.4;
  }
}

