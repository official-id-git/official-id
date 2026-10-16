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
