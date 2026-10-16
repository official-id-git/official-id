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
attribute float aSway;      // 0 = diam (tanah, finder, orang), 1 = pucuk pohon
attribute float aLeaf;      // intensitas getaran daun kecil / ujung sari
attribute float aPhase;     // fase acak per voxel
attribute float aGrowDelay; // 0.0 - 0.75: kapan voxel ini mulai tumbuh
attribute float aPetal;     // 1.0 = kelopak bunga hibiscus hidup
attribute float aStamen;    // 1.0 = putik & benang sari melengkung
uniform float uTime;
uniform vec3 uWindDir;
uniform float uStrength;
uniform float uFlutter;
uniform float uGrowth;
`;

export const WIND_PROJECT_VERTEX = /* glsl */ `
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
  vec3 dir = normalize(uWindDir);
  float bend = aSway * aSway; // makin tinggi makin melentur

  // 1. Hembusan angin alami umum
  float gust = 0.55 + 0.35 * sin(uTime * 0.8) + 0.2 * sin(uTime * 2.3 + 1.7);
  float wave = sin(uTime * 1.6 - dot(mvPosition.xz, dir.xz) * 0.35);
  vec3 sway = dir * (gust + 0.35 * wave) * uStrength * bend;
  sway.y -= length(sway.xz) * 0.25;

  // 2. KELOPAK BUNGA HIDUP (LIVING PETAL BLOOM & BREATHING MOTION)
  vec3 petalMotion = vec3(0.0);
  if (aPetal > 0.05) {
    float distXZ = length(mvPosition.xz);
    vec2 normRad = (distXZ > 0.1) ? normalize(mvPosition.xz) : vec2(0.707, 0.707);

    // a. Denyut mekar/bernapas halus
    float breathe = sin(uTime * 2.2) * 0.35;
    
    // b. Gelombang ombak merambat dari pusat mahkota ke ujung kelopak
    float ripple = sin(uTime * 3.4 - distXZ * 0.45 + aPhase * 0.6) * 0.42;
    
    // c. Getaran lembut pada tepi kelopak merah-kuning
    float edgeFlutter = sin(uTime * 5.8 + aPhase) * 0.22;

    petalMotion.x = normRad.x * breathe * 0.75 + sin(uTime * 1.8 + aPhase) * 0.22;
    petalMotion.z = normRad.y * breathe * 0.75 + cos(uTime * 1.8 + aPhase) * 0.22;
    petalMotion.y = (ripple + edgeFlutter) * (0.6 + 0.4 * aSway);
    petalMotion *= aPetal * (0.7 + 0.5 * uStrength);
  }

  // 3. PUTIK & BENANG SARI (ELEGANT ARCHING STAMEN SWAY & GOLDEN ANTHER SHIMMER)
  vec3 stamenMotion = vec3(0.0);
  if (aStamen > 0.05) {
    // a. Ayunan anggun benang sari melengkung
    float stamenWave = sin(uTime * 2.6 + aPhase * 0.4) * 0.75;
    float stamenCross = cos(uTime * 2.1 + aPhase * 0.6) * 0.55;
    float stamenLift = sin(uTime * 3.2 + aPhase) * 0.35;

    // b. Getaran cepat & kilau kepala sari emas di ujung putik
    float tipShimmer = sin(uTime * 8.5 + aPhase * 1.5) * 0.26 * aLeaf;

    stamenMotion.x = (stamenWave + tipShimmer) * aSway;
    stamenMotion.z = (stamenCross + tipShimmer * 0.7) * aSway;
    stamenMotion.y = stamenLift * aSway;
    stamenMotion *= aStamen * (0.8 + 0.6 * uStrength);
  }

  // 4. Getaran daun individual pohon biasa
  vec3 flutter = vec3(
    sin(uTime * 6.3 + aPhase),
    0.6 * sin(uTime * 7.7 + aPhase * 1.9),
    cos(uTime * 5.9 + aPhase * 1.3)
  ) * uFlutter * aLeaf * (0.4 + 0.6 * aSway);

  mvPosition.xyz += (sway * (1.0 - aPetal * 0.5) + petalMotion + stamenMotion + flutter * (1.0 - aPetal - aStamen)) * popScale;
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
  material.customProgramCacheKey = () => "voxel-wind-growth-v4";
}

export function buildWindAttributes(voxels: VoxelItem[]) {
  const n = voxels.length;
  const sway = new Float32Array(n);
  const leaf = new Float32Array(n);
  const phase = new Float32Array(n);
  const growDelay = new Float32Array(n);
  const petal = new Float32Array(n);
  const stamen = new Float32Array(n);

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

    if (v.role === "stone" || v.role === "border" || v.y < 1) {
      growDelay[i] = 0.0;
    } else if (v.role === "trunk" || v.role === "branch") {
      const normY = Math.min(1, Math.max(0, (v.y - 1) / (maxY - 1)));
      growDelay[i] = 0.05 + normY * 0.20;
    } else if (v.role === "leaf" || v.role === "hedge") {
      const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
      growDelay[i] = 0.15 + normY * 0.20 + distXZ * 0.06;
    } else if (v.role === "petal" || v.role === "flower") {
      growDelay[i] = 0.18 + distXZ * 0.16;
    } else if (v.role === "stamen") {
      growDelay[i] = 0.30 + distXZ * 0.10;
    } else if (v.role === "person") {
      growDelay[i] = 0.40;
    } else {
      growDelay[i] = 0.10;
    }

    const movable =
      v.y >= 1 &&
      (v.role === "leaf" ||
        v.role === "trunk" ||
        v.role === "branch" ||
        v.role === "petal" ||
        v.role === "flower" ||
        v.role === "stamen");
    if (!movable) continue;

    const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
    sway[i] = Math.pow(normY, 1.2);
    phase[i] = (v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) % (Math.PI * 2);

    if (v.role === "petal" || v.role === "flower") {
      petal[i] = 1.0;
      leaf[i] = 0.8;
    } else if (v.role === "stamen") {
      stamen[i] = 1.0;
      leaf[i] = 1.5;
    } else if (v.role === "leaf") {
      leaf[i] = Math.min(1.6, 0.9 / (v.size ?? 0.96));
    }
  }

  return { sway, leaf, phase, growDelay, petal, stamen };
}

export function buildTreeMesh(
  voxels: VoxelItem[],
  wind: WindUniforms,
  options?: { shadows?: boolean }
): THREE.InstancedMesh {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const { sway, leaf, phase, growDelay, petal, stamen } = buildWindAttributes(voxels);
  geo.setAttribute("aSway", new THREE.InstancedBufferAttribute(sway, 1));
  geo.setAttribute("aLeaf", new THREE.InstancedBufferAttribute(leaf, 1));
  geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
  geo.setAttribute("aGrowDelay", new THREE.InstancedBufferAttribute(growDelay, 1));
  geo.setAttribute("aPetal", new THREE.InstancedBufferAttribute(petal, 1));
  geo.setAttribute("aStamen", new THREE.InstancedBufferAttribute(stamen, 1));

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
    dummy.position.set(v.x, v.y + 0.5, v.z);
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
