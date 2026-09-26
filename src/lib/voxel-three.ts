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
attribute float aLeaf;      // intensitas getaran daun kecil
attribute float aPhase;     // fase acak per voxel
attribute float aGrowDelay; // 0.0 - 0.75: kapan voxel ini mulai tumbuh
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

  // Hembusan: gabungan gelombang alami
  float gust = 0.55 + 0.35 * sin(uTime * 0.8) + 0.2 * sin(uTime * 2.3 + 1.7);

  // Gelombang merambat melintasi canopy searah angin
  float wave = sin(uTime * 1.6 - dot(mvPosition.xz, dir.xz) * 0.35);

  vec3 sway = dir * (gust + 0.35 * wave) * uStrength * bend;
  sway.y -= length(sway.xz) * 0.25;

  // Getaran daun individual
  vec3 flutter = vec3(
    sin(uTime * 6.3 + aPhase),
    0.6 * sin(uTime * 7.7 + aPhase * 1.9),
    cos(uTime * 5.9 + aPhase * 1.3)
  ) * uFlutter * aLeaf * (0.4 + 0.6 * aSway);

  mvPosition.xyz += (sway + flutter) * popScale;
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
  material.customProgramCacheKey = () => "voxel-wind-growth-v3";
}

export function buildWindAttributes(voxels: VoxelItem[]) {
  const n = voxels.length;
  const sway = new Float32Array(n);
  const leaf = new Float32Array(n);
  const phase = new Float32Array(n);
  const growDelay = new Float32Array(n);

  let maxY = 3;
  for (const v of voxels) if (v.role === "leaf" && v.y > maxY) maxY = v.y;
  const rootY = 2;

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
    } else if (v.role === "flower") {
      growDelay[i] = 0.08;
    } else if (v.role === "trunk" || v.role === "branch") {
      const normY = Math.min(1, Math.max(0, (v.y - 1) / (maxY - 1)));
      growDelay[i] = 0.05 + normY * 0.20;
    } else if (v.role === "leaf" || v.role === "hedge") {
      const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
      growDelay[i] = 0.18 + normY * 0.22 + distXZ * 0.06;
    } else if (v.role === "person") {
      growDelay[i] = 0.40;
    } else {
      growDelay[i] = 0.10;
    }

    const movable = v.y >= 1 && (v.role === "leaf" || v.role === "trunk" || v.role === "branch");
    if (!movable) continue;

    const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
    sway[i] = Math.pow(normY, 1.4);
    phase[i] = (v.x * 12.9898 + v.z * 78.233 + v.y * 37.719) % 6.283185;

    if (v.role === "leaf") {
      leaf[i] = 0.4 + 0.6 * (Math.sin(phase[i]) * 0.5 + 0.5);
    }
  }

  return { sway, leaf, phase, growDelay };
}

export function buildTreeMesh(
  voxels: VoxelItem[],
  wind: WindUniforms,
  options?: { shadows?: boolean }
): THREE.InstancedMesh {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const { sway, leaf, phase, growDelay } = buildWindAttributes(voxels);
  geo.setAttribute("aSway", new THREE.InstancedBufferAttribute(sway, 1));
  geo.setAttribute("aLeaf", new THREE.InstancedBufferAttribute(leaf, 1));
  geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
  geo.setAttribute("aGrowDelay", new THREE.InstancedBufferAttribute(growDelay, 1));

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
