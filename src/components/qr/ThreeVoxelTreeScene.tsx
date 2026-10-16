"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  VoxelItem,
  SeasonType,
  SEASONS,
  generateVoxelTree,
  generateVoxelFlower,
  generateVoxelBuilding,
  generateQrMatrix,
} from "@/lib/voxel-tree-generator";

interface ThreeVoxelTreeSceneProps {
  url: string;
  qrText?: string;
  logoUrl?: string | null;
  logoShape?: "rounded" | "circle" | "square";
  logoSizePercent?: number;
  season: SeasonType;
  viewMode: "3d" | "qr";
  onViewModeToggle: () => void;
  onSceneReady?: (exporter: {
    captureImage: () => string | null;
    getVoxelCount: () => number;
  }) => void;
}

// Camera constants (static references for zero garbage collection & stable hooks)
const POS_3D = new THREE.Vector3(50, 42, 50);
const TARGET_3D = new THREE.Vector3(0, 8, 0);
const UP_3D = new THREE.Vector3(0, 1, 0);

// Top-Down QR Code Scan View: looking straight down at (0, 0, 0)
const POS_QR = new THREE.Vector3(0, 95, 0.0001);
const TARGET_QR = new THREE.Vector3(0, 0, 0);
const UP_QR = new THREE.Vector3(0, 0, -1);

// Base Frustum size: 52 ensures generous, majestic framing of the wide tree and sitting person without clipping
const BASE_FRUSTUM = 52;

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export default function ThreeVoxelTreeScene({
  url,
  qrText,
  logoUrl,
  logoShape = "circle",
  logoSizePercent = 19,
  season,
  viewMode,
  onViewModeToggle,
  onSceneReady,
}: ThreeVoxelTreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const instancedMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const particlesMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const particlesDataRef = useRef<
    Array<{
      x: number;
      y: number;
      z: number;
      speed: number;
      swaySpeed: number;
      phase: number;
      rx: number;
      ry: number;
    }>
  >([]);

  const viewModeRef = useRef<"3d" | "qr">(viewMode);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  // Wind & QR mode transition shader uniforms ref
  const windUniformsRef = useRef<{
    uTime: { value: number };
    uWind: { value: number };
    uQrMode: { value: number };
    uQrDarkColor: { value: THREE.Color };
  }>({
    uTime: { value: 0 },
    uWind: { value: 1.0 },
    uQrMode: { value: viewMode === "qr" ? 1.0 : 0.0 },
    uQrDarkColor: { value: new THREE.Color(SEASONS[season].qrDark[0]) },
  });

  const animFrameRef = useRef<number | null>(null);
  const [voxelCount, setVoxelCount] = useState<number>(0);

  // Sitting person model group ref (animates breathing and sinks in QR mode)
  const sittingPersonRef = useRef<THREE.Group | null>(null);
  // Center logo model group ref (animates and floats at QR center)
  const centerLogoRef = useRef<THREE.Group | null>(null);

  // Transition state
  const isTransitioningRef = useRef<boolean>(false);
  const animStartTimeRef = useRef<number>(0);
  const animDuration = 1000; // ms

  const startCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const startTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const startUpRef = useRef<THREE.Vector3>(new THREE.Vector3());

  const targetCamPosRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetTargetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const targetUpRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    // 1. Scene
    const scene = new THREE.Scene();
    const theme = SEASONS[season];
    scene.background = new THREE.Color(theme.bgColor);
    sceneRef.current = scene;

    // 2. Orthographic Camera (Zero perspective parallax distortion -> 100% QR scannability!)
    const frustumH = aspect < 1 ? BASE_FRUSTUM / aspect : BASE_FRUSTUM;
    const frustumW = frustumH * aspect;

    const camera = new THREE.OrthographicCamera(
      -frustumW / 2,
      frustumW / 2,
      frustumH / 2,
      -frustumH / 2,
      0.1,
      500
    );

    camera.position.copy(viewMode === "3d" ? POS_3D : POS_QR);
    camera.up.copy(viewMode === "3d" ? UP_3D : UP_QR);
    camera.lookAt(viewMode === "3d" ? TARGET_3D : TARGET_QR);
    camera.zoom = viewMode === "qr" ? 1.18 : 1.12;
    camera.updateProjectionMatrix();
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const mount = canvasMountRef.current;
    if (mount) {
      mount.replaceChildren(renderer.domElement);
    }
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Keep above ground terrace
    controls.minZoom = 0.4;
    controls.maxZoom = 3.5;
    controls.target.copy(viewMode === "3d" ? TARGET_3D : TARGET_QR);
    controls.enabled = viewMode === "3d";
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xfffaed, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7e6, 2.2);
    if (viewMode === "qr") {
      dirLight.position.set(0, 100, 0);
      dirLight.castShadow = false;
    } else {
      dirLight.position.set(45, 90, 40);
      dirLight.castShadow = true;
    }
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 240;
    const shadowD = 52;
    dirLight.shadow.camera.left = -shadowD;
    dirLight.shadow.camera.right = shadowD;
    dirLight.shadow.camera.top = shadowD;
    dirLight.shadow.camera.bottom = -shadowD;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 6. Floating Particles (Falling leaves / Sakura petals)
    const particleGeo = new THREE.BoxGeometry(0.3, 0.08, 0.3);
    const particleMat = new THREE.MeshStandardMaterial({
      roughness: 0.8,
      metalness: 0.05,
    });
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, 65);
    particleMesh.castShadow = false;
    particleMesh.receiveShadow = false;
    particleMesh.visible = viewMode === "3d";
    scene.add(particleMesh);
    particlesMeshRef.current = particleMesh;

    const pData: Array<{
      x: number;
      y: number;
      z: number;
      speed: number;
      swaySpeed: number;
      phase: number;
      rx: number;
      ry: number;
    }> = [];

    for (let i = 0; i < 65; i++) {
      particleMesh.setColorAt(
        i,
        new THREE.Color(theme.particleColors[i % theme.particleColors.length])
      );
      pData.push({
        x: (Math.random() - 0.5) * 32,
        y: 4 + Math.random() * 22,
        z: (Math.random() - 0.5) * 32,
        speed: 0.015 + Math.random() * 0.035,
        swaySpeed: 1 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
      });
    }
    if (particleMesh.instanceColor) {
      particleMesh.instanceColor.needsUpdate = true;
    }
    particlesDataRef.current = pData;

    // Handle Window Resize & Anti-Clipping Frustum update
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const asp = w / h;

      const fH = asp < 1 ? BASE_FRUSTUM / asp : BASE_FRUSTUM;
      const fW = fH * asp;

      cameraRef.current.left = -fW / 2;
      cameraRef.current.right = fW / 2;
      cameraRef.current.top = fH / 2;
      cameraRef.current.bottom = -fH / 2;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Expose capture and count API
    if (onSceneReady) {
      onSceneReady({
        captureImage: () => {
          if (!rendererRef.current) return null;
          if (sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
          }
          return rendererRef.current.domElement.toDataURL("image/png");
        },
        getVoxelCount: () => instancedMeshRef.current?.count || 0,
      });
    }

    // Animation Loop
    const dummy = new THREE.Object3D();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      const timeInSec = now * 0.001;

      const currentMode = viewModeRef.current;

      // Update Wind & QR Mode Shader Uniforms
      if (windUniformsRef.current) {
        windUniformsRef.current.uTime.value = timeInSec;
        // In 3D: wind = 1.0 (canopy foliage gently sways in breeze). In QR: strictly 0.0 for crisp scanning
        const targetWind = currentMode === "3d" ? 1.0 : 0.0;
        windUniformsRef.current.uWind.value = THREE.MathUtils.lerp(
          windUniformsRef.current.uWind.value,
          targetWind,
          0.12
        );

        // Smoothly lerp uQrMode: 0.0 in 3D (full height), 1.0 in QR (flat high-contrast scannable tiles)
        const targetQrMode = currentMode === "qr" ? 1.0 : 0.0;
        windUniformsRef.current.uQrMode.value = THREE.MathUtils.lerp(
          windUniformsRef.current.uQrMode.value,
          targetQrMode,
          0.10
        );
      }

      // Smooth Camera Transition between 3D and Top-Down QR
      if (isTransitioningRef.current && cameraRef.current && controlsRef.current) {
        const elapsed = now - animStartTimeRef.current;
        const progress = Math.min(1, elapsed / animDuration);
        const ease = easeInOutCubic(progress);

        cameraRef.current.position.lerpVectors(
          startCamPosRef.current,
          targetCamPosRef.current,
          ease
        );
        controlsRef.current.target.lerpVectors(
          startTargetRef.current,
          targetTargetRef.current,
          ease
        );
        cameraRef.current.up.lerpVectors(
          startUpRef.current,
          targetUpRef.current,
          ease
        ).normalize();
        cameraRef.current.lookAt(controlsRef.current.target);
        cameraRef.current.updateProjectionMatrix();

        if (progress >= 1) {
          isTransitioningRef.current = false;
          cameraRef.current.position.copy(targetCamPosRef.current);
          cameraRef.current.up.copy(targetUpRef.current);
          controlsRef.current.target.copy(targetTargetRef.current);
          cameraRef.current.lookAt(controlsRef.current.target);
          cameraRef.current.updateProjectionMatrix();
          controlsRef.current.enabled = currentMode === "3d";
          if (currentMode === "3d") {
            controlsRef.current.update();
          }
        }
      } else if (controlsRef.current && currentMode === "3d") {
        controlsRef.current.update();
      }

      // Animate Sitting Person (Gentle breathing in 3D, smoothly sink/hide in QR)
      if (sittingPersonRef.current) {
        const targetY = currentMode === "3d" ? 0.0 : -10.0;
        const targetScale = currentMode === "3d" ? 1.30 : 0.001;
        const breathe = currentMode === "3d" ? Math.sin(timeInSec * 2.0) * 0.03 : 0.0;

        sittingPersonRef.current.position.y = THREE.MathUtils.lerp(
          sittingPersonRef.current.position.y,
          targetY + breathe,
          0.08
        );
        sittingPersonRef.current.scale.setScalar(
          THREE.MathUtils.lerp(sittingPersonRef.current.scale.x, targetScale, 0.08)
        );

        if (currentMode === "qr" && sittingPersonRef.current.position.y < -5.0) {
          sittingPersonRef.current.visible = false;
        } else if (currentMode === "3d") {
          sittingPersonRef.current.visible = true;
        }
      }

      // Animate Center Logo (Floats at QR center in top-down view, sinks in 3D mode)
      if (centerLogoRef.current) {
        const targetY = currentMode === "qr" ? 0.0 : -10.0;
        const targetScale = currentMode === "qr" ? 1.0 : 0.001;
        centerLogoRef.current.position.y = THREE.MathUtils.lerp(
          centerLogoRef.current.position.y,
          targetY,
          0.1
        );
        centerLogoRef.current.scale.setScalar(
          THREE.MathUtils.lerp(centerLogoRef.current.scale.x, targetScale, 0.1)
        );
        if (currentMode === "3d" && centerLogoRef.current.scale.x < 0.02) {
          centerLogoRef.current.visible = false;
        } else if (currentMode === "qr") {
          centerLogoRef.current.visible = true;
        }
      }

      // Update Floating Particles
      if (particlesMeshRef.current && particlesDataRef.current.length > 0) {
        const pMesh = particlesMeshRef.current;
        const data = particlesDataRef.current;

        for (let i = 0; i < data.length; i++) {
          const p = data[i];
          p.y -= p.speed;
          if (p.y < 0.2) {
            p.y = 20 + Math.random() * 4;
            p.x = (Math.random() - 0.5) * 32;
            p.z = (Math.random() - 0.5) * 32;
          }

          const currentX = p.x + Math.sin(now * 0.0015 * p.swaySpeed + p.phase) * 0.8;
          const currentZ = p.z + Math.cos(now * 0.0012 * p.swaySpeed + p.phase) * 0.8;

          dummy.position.set(currentX, p.y, currentZ);
          dummy.rotation.set(
            p.rx + now * 0.001,
            p.ry + now * 0.001,
            p.phase
          );
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          pMesh.setMatrixAt(i, dummy.matrix);
        }
        pMesh.instanceMatrix.needsUpdate = true;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (sittingPersonRef.current && sceneRef.current) {
        sceneRef.current.remove(sittingPersonRef.current);
        sittingPersonRef.current.clear();
        sittingPersonRef.current = null;
      }
      if (centerLogoRef.current && sceneRef.current) {
        sceneRef.current.remove(centerLogoRef.current);
        centerLogoRef.current.clear();
        centerLogoRef.current = null;
      }
      controls.dispose();
      renderer.dispose();
      canvasMountRef.current?.replaceChildren();
    };
  }, []);

  // Update Background & Theme
  useEffect(() => {
    if (!sceneRef.current) return;
    const theme = SEASONS[season];
    sceneRef.current.background = new THREE.Color(theme.bgColor);

    if (particlesMeshRef.current) {
      for (let i = 0; i < 65; i++) {
        particlesMeshRef.current.setColorAt(
          i,
          new THREE.Color(theme.particleColors[i % theme.particleColors.length])
        );
      }
      if (particlesMeshRef.current.instanceColor) {
        particlesMeshRef.current.instanceColor.needsUpdate = true;
      }
    }

    if (windUniformsRef.current) {
      windUniformsRef.current.uQrDarkColor.value.set(theme.qrDark[0]);
    }
  }, [season]);

  // Re-generate Tree Voxels when URL or Season changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove old voxel mesh
    if (instancedMeshRef.current) {
      scene.remove(instancedMeshRef.current);
      instancedMeshRef.current.geometry.dispose();
      (instancedMeshRef.current.material as THREE.Material).dispose();
      instancedMeshRef.current = null;
    }

    // Remove old sitting person group
    if (sittingPersonRef.current) {
      scene.remove(sittingPersonRef.current);
      sittingPersonRef.current.clear();
      sittingPersonRef.current = null;
    }

    // 1. Generate QR matrix (using qrText if provided so physical printed QR matches)
    const textToEncode = qrText || url;
    const { matrix, size } = generateQrMatrix(textToEncode);

    // 2. Generate 3D Voxel Array – flower mode uses flower generator, building uses building generator, others use tree generator
    const voxels: VoxelItem[] =
      season === "flower"
        ? generateVoxelFlower(matrix, size, season, { scanSafeTop: true })
        : season === "building"
        ? generateVoxelBuilding(matrix, size, season, { scanSafeTop: true })
        : generateVoxelTree(matrix, size, season, { scanSafeTop: true });
    setVoxelCount(voxels.length);

    // Separate tree/ground voxels and character voxels
    const treeVoxels = voxels.filter((v) => v.role !== "person");
    const personVoxels = voxels.filter((v) => v.role === "person");

    // 3. Create InstancedMesh with Wind Sway & QR Mode Flattening Shader
    const voxelGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    // Pack per-instance attributes into two vec4s to respect WebGL max attribute limits (<= 16)
    const qrAnimData = new Float32Array(treeVoxels.length * 4); // x: windWeight, y: isQrDark, z: isDecorative, w: phase
    const flowerData = new Float32Array(treeVoxels.length * 4); // x: part, y: u, z: ang, w: extra

    for (let i = 0; i < treeVoxels.length; i++) {
      const v = treeVoxels[i];
      const part = v.part !== undefined ? v.part : -99.0;
      const uParam = v.u !== undefined ? v.u : 0.0;
      const ang = v.ang !== undefined ? v.ang : 0.0;
      const phase = v.phase !== undefined ? v.phase : ((v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) % (Math.PI * 2));

      const r = v.role;
      let windWeight = 0.0;
      if (r === "leaf") {
        windWeight = 1.0;
      } else if (r === "petal") {
        windWeight = 1.35;
      } else if (r === "stamen") {
        windWeight = 1.85;
      } else if (r === "hedge") {
        windWeight = 0.20;
      } else if (r === "branch") {
        windWeight = 0.35;
      } else if (r === "trunk") {
        windWeight = 0.15;
      } else {
        windWeight = 0.0;
      }
      const isQrDark = v.isQrDark ? 1.0 : 0.0;
      const isFloor = r === "stone" || r === "border";
      const isDecorative = (!isFloor && !v.isQrDark) ? 1.0 : 0.0;

      const idx = i * 4;
      qrAnimData[idx] = windWeight;
      qrAnimData[idx + 1] = isQrDark;
      qrAnimData[idx + 2] = isDecorative;
      qrAnimData[idx + 3] = phase;

      flowerData[idx] = part;
      flowerData[idx + 1] = uParam;
      flowerData[idx + 2] = ang;
      flowerData[idx + 3] = 0.0;
    }
    voxelGeo.setAttribute("aQrAnimData", new THREE.InstancedBufferAttribute(qrAnimData, 4));
    voxelGeo.setAttribute("aFlowerData", new THREE.InstancedBufferAttribute(flowerData, 4));

    const voxelMat = new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: 0.08,
    });

    // Injected GPU Wind Sway & Smooth QR Mode Flattening Shader
    voxelMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = windUniformsRef.current.uTime;
      shader.uniforms.uWind = windUniformsRef.current.uWind;
      shader.uniforms.uQrMode = windUniformsRef.current.uQrMode;
      shader.uniforms.uQrDarkColor = windUniformsRef.current.uQrDarkColor;

      shader.vertexShader = `
        attribute vec4 aQrAnimData;
        attribute vec4 aFlowerData;
        uniform float uTime;
        uniform float uWind;
        uniform float uQrMode;
        varying float vIsQrDark;

        vec3 rotA(vec3 v, vec3 k, float a){
          float c = cos(a), s = sin(a);
          return v * c + cross(k, v) * s + k * dot(k, v) * (1.0 - c);
        }
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `
        float aWindWeight = aQrAnimData.x;
        float aIsQrDark = aQrAnimData.y;
        float aIsDecorative = aQrAnimData.z;
        float aPhase = aQrAnimData.w;

        float aPart = aFlowerData.x;
        float aU = aFlowerData.y;
        float aAng = aFlowerData.z;
        float aExtra = aFlowerData.w;

        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_BATCHING
          mvPosition = batchingMatrix * mvPosition;
        #endif
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;

          // 1. In 3D: Natural wind sway & Patrakomala / Flag Organic Motion
          if (uWind > 0.001 && uQrMode < 0.15) {
            float effectiveWind = uWind * (1.0 - uQrMode);

            if (aPart > 19.5 && aPart < 20.5) {
              // Bendera Gedung Voxel berkibar
              float gust = 0.65 + 0.35 * sin(uTime * 0.7) * sin(uTime * 0.31 + 1.3) + 0.3 * max(0.0, sin(uTime * 0.45 - 0.6));
              float W = effectiveWind * gust;
              float u = aU;
              float ph = uTime * (3.0 + 2.2 * W) - u * 7.0 + aPhase;
              float amp = (0.20 + 0.50 * W) * u;
              mvPosition.z += (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0)) * amp;
              mvPosition.y += -u * u * (0.5 - W * 0.25) + 0.10 * sin(ph * 1.4) * u;
              mvPosition.x -= abs(sin(ph)) * 0.15 * u * W;
            } else if (aPart > -5.0 && aPart < 15.0) {
              vec3 fU = vec3(0.7071068, 0.0, -0.7071068);
              vec3 fN = vec3(0.4472136, 0.7745967, 0.4472136);
              vec3 fV = vec3(-0.5477226, 0.6324555, -0.5477226);
              vec3 fCenter = vec3(0.0, 11.5, 0.0);

              vec3 rel = mvPosition.xyz - fCenter;
              vec3 localP = vec3(dot(rel, fU), dot(rel, fN), dot(rel, fV));
              vec3 origLocalP = localP;

              float gust = 0.65 + 0.35 * sin(uTime * 0.7) * sin(uTime * 0.31 + 1.3) + 0.3 * max(0.0, sin(uTime * 0.45 - 0.6));
              float W = effectiveWind * gust;

              vec3 up = vec3(0.0, 1.0, 0.0);
              vec3 d  = vec3(cos(aAng), 0.0, sin(aAng));
              vec3 k  = vec3(-sin(aAng), 0.0, cos(aAng));
              vec3 wd = normalize(vec3(1.0, 0.0, 0.35));

              if (aPart > -0.5 && aPart < 4.5) {
                float face = 0.7 + 0.3 * dot(d, wd);
                float wave = sin(uTime * 2.2 + aPhase - aU * 2.4);
                float a = W * face * (0.06 + 0.11 * wave) * aU * aU * 1.6;
                vec3 h = d * 1.6 + up * 0.5;
                localP = h + rotA(localP - h, k, a);
                float tw = W * 0.10 * aU * sin(uTime * 3.1 + aPhase * 1.7 - aU * 3.0);
                localP = rotA(localP, d, tw);
              } else if (aPart > 9.5) {
                float lag = aU * 1.8;
                float a1 = W * (0.09 * sin(uTime * 1.8 + aPhase - lag) + 0.035 * sin(uTime * 5.3 + aPhase * 2.1 - lag * 1.4)) * aU;
                float a2 = W * (0.07 * sin(uTime * 1.25 + aPhase * 0.8 - lag) + 0.05) * aU;
                vec3 h = vec3(0.0, 2.0, 0.0);
                localP = h + rotA(localP - h, k, a1);
                localP = h + rotA(localP - h, up, a2);
              }

              float s = W * 0.03 * sin(uTime * 0.9);
              localP = rotA(localP, vec3(0.0, 0.0, 1.0), s);

              vec3 deltaLocal = localP - origLocalP;
              mvPosition.xyz += deltaLocal.x * fU + deltaLocal.y * fN + deltaLocal.z * fV;
            } else if (aWindWeight > 0.01) {
              float hFactor = clamp((mvPosition.y - 2.0) / 16.0, 0.0, 1.4);
              float sway1 = sin(uTime * 2.0 + mvPosition.x * 0.25 + mvPosition.z * 0.25) * 0.42;
              float sway2 = cos(uTime * 2.6 + mvPosition.z * 0.28 + mvPosition.y * 0.12) * 0.30;
              float flutter = sin(uTime * 6.2 + mvPosition.x * 1.3 + mvPosition.z * 1.3) * 0.22;
              mvPosition.x += (sway1 + flutter) * hFactor * aWindWeight * effectiveWind;
              mvPosition.z += (sway2 + flutter * 0.8) * hFactor * aWindWeight * effectiveWind;
              mvPosition.y += sin(uTime * 3.2 + mvPosition.x * 0.3) * 0.15 * hFactor * aWindWeight * effectiveWind;
            }
          }

          // 2. In QR Mode:
          // Sembunyikan & ciutkan semua voxel 3D dekoratif (kelopak, sari, daun, batang) agar QR 100% bersih tanpa halangan
          if (aIsDecorative > 0.5 && uQrMode > 0.001) {
            mvPosition.xyz = mix(mvPosition.xyz, vec3(0.0, -100.0, 0.0), uQrMode);
          }

          // Modul hitam QR merata sejajar lantai (Y -> 0.04)
          if (aIsQrDark > 0.5 && uQrMode > 0.001 && mvPosition.y > 0.1) {
            mvPosition.y = mix(mvPosition.y, 0.04, uQrMode);
          }
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        vIsQrDark = aIsQrDark;
        gl_Position = projectionMatrix * mvPosition;

        #ifdef USE_INSTANCING
          // Hardware clipping: buang voxel 3D dekoratif sepenuhnya saat mode QR
          if (aIsDecorative > 0.5 && uQrMode > 0.85) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
          }
        #endif
        `
      );

      // In fragment shader: enforce deep high-contrast dark color for all QR dark modules in QR mode
      shader.fragmentShader = `
        uniform float uQrMode;
        uniform vec3 uQrDarkColor;
        varying float vIsQrDark;
      ` + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>
        if (uQrMode > 0.01 && vIsQrDark > 0.5) {
          diffuseColor.rgb = mix(diffuseColor.rgb, uQrDarkColor, uQrMode * 0.96);
        }
        `
      );
    };

    const instMesh = new THREE.InstancedMesh(voxelGeo, voxelMat, treeVoxels.length);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < treeVoxels.length; i++) {
      const v = treeVoxels[i];
      const s = v.size ?? 0.45;

      dummy.position.set(v.x, v.y + s / 2, v.z);
      dummy.scale.set(s, s, s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();

      instMesh.setMatrixAt(i, dummy.matrix);
      instMesh.setColorAt(i, new THREE.Color(v.color));
    }

    instMesh.instanceMatrix.needsUpdate = true;
    if (instMesh.instanceColor) {
      instMesh.instanceColor.needsUpdate = true;
    }

    scene.add(instMesh);
    instancedMeshRef.current = instMesh;

    // 4. Build Dramatic Sitting Person Group (leans against trunk)
    if (personVoxels.length > 0) {
      const pGroup = new THREE.Group();
      const pGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      for (const p of personVoxels) {
        const s = p.size ?? 0.45;
        const pMat = new THREE.MeshStandardMaterial({
          color: p.color,
          roughness: 0.72,
          metalness: 0.08,
        });
        const m = new THREE.Mesh(pGeo, pMat);
        m.position.set(p.x, p.y + s / 2, p.z);
        m.scale.set(s, s, s);
        m.castShadow = true;
        m.receiveShadow = true;
        pGroup.add(m);
      }
      pGroup.position.y = viewMode === "qr" ? -10.0 : 0.0;
      pGroup.scale.setScalar(viewMode === "qr" ? 0.001 : 1.30);
      pGroup.visible = viewMode === "3d";
      scene.add(pGroup);
      sittingPersonRef.current = pGroup;
    }
  }, [url, qrText, season]);

  // Center Logo Badge in 3D/QR Scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    if (centerLogoRef.current) {
      scene.remove(centerLogoRef.current);
      centerLogoRef.current.clear();
      centerLogoRef.current = null;
    }

    if (!logoUrl) return;

    const group = new THREE.Group();
    const textToEncode = qrText || url;
    const { size } = generateQrMatrix(textToEncode);
    const badgeW = size * ((logoSizePercent || 19) / 100);
    const innerW = badgeW * 0.78;

    // White backing badge (Circle cylinder for 100% roundness)
    const badgeGeo =
      logoShape === "circle"
        ? new THREE.CylinderGeometry(badgeW / 2, badgeW / 2, 0.08, 48)
        : new THREE.BoxGeometry(badgeW, 0.08, badgeW);

    const badgeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat);
    badgeMesh.position.y = 0.10;
    group.add(badgeMesh);

    // Texture plane for PNG logo
    const textureLoader = new THREE.TextureLoader();
    if (!logoUrl.startsWith("data:")) {
      textureLoader.setCrossOrigin("anonymous");
    }
    textureLoader.load(
      logoUrl,
      (texture) => {
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const logoGeo = new THREE.PlaneGeometry(innerW, innerW);
        const logoMat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          side: THREE.DoubleSide,
        });
        const logoPlane = new THREE.Mesh(logoGeo, logoMat);
        logoPlane.rotation.x = -Math.PI / 2;
        logoPlane.position.y = 0.16;
        group.add(logoPlane);
      },
      undefined,
      (err) => {
        console.warn("Could not load Three.js logo texture:", err);
      }
    );

    const isQr = viewModeRef.current === "qr";
    group.position.y = isQr ? 0.0 : -10.0;
    group.scale.setScalar(isQr ? 1.0 : 0.001);
    group.visible = isQr;
    scene.add(group);
    centerLogoRef.current = group;

    return () => {
      if (centerLogoRef.current && sceneRef.current) {
        sceneRef.current.remove(centerLogoRef.current);
        centerLogoRef.current.clear();
        centerLogoRef.current = null;
      }
    };
  }, [logoUrl, logoShape, logoSizePercent, qrText, url]);

  // Trigger Smooth Camera Transition ("3d" <-> "qr")
  const triggerCameraTransition = useCallback(
    (mode: "3d" | "qr") => {
      if (!cameraRef.current || !controlsRef.current) return;

      const targetPos = mode === "3d" ? POS_3D : POS_QR;
      const targetLook = mode === "3d" ? TARGET_3D : TARGET_QR;
      const targetUp = mode === "3d" ? UP_3D : UP_QR;

      startCamPosRef.current.copy(cameraRef.current.position);
      startTargetRef.current.copy(controlsRef.current.target);
      startUpRef.current.copy(cameraRef.current.up);

      targetCamPosRef.current.copy(targetPos);
      targetTargetRef.current.copy(targetLook);
      targetUpRef.current.copy(targetUp);

      animStartTimeRef.current = performance.now();
      isTransitioningRef.current = true;
      controlsRef.current.enabled = false;

      // Adjust directional light: straight down with zero lateral shadows for 100% QR scannability
      if (dirLightRef.current) {
        if (mode === "qr") {
          dirLightRef.current.position.set(0, 100, 0);
          dirLightRef.current.castShadow = false;
        } else {
          dirLightRef.current.position.set(45, 90, 40);
          dirLightRef.current.castShadow = true;
        }
      }

      // Hide drifting leaf particles in QR mode to prevent blocking white modules
      if (particlesMeshRef.current) {
        particlesMeshRef.current.visible = mode === "3d";
      }

      // Zoom adjustment: in QR mode ensure the entire QR code + quiet zone is cleanly framed
      if (cameraRef.current) {
        cameraRef.current.zoom = mode === "qr" ? 1.18 : 1.12;
        cameraRef.current.updateProjectionMatrix();
      }
    },
    []
  );

  useEffect(() => {
    triggerCameraTransition(viewMode);
  }, [viewMode, triggerCameraTransition]);

  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerDownPosRef.current) return;
    const dx = e.clientX - pointerDownPosRef.current.x;
    const dy = e.clientY - pointerDownPosRef.current.y;
    pointerDownPosRef.current = null;
    // Only toggle if click/tap had less than 6px movement (not a 3D orbit drag)
    if (Math.hypot(dx, dy) < 6) {
      onViewModeToggle();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Three.js Canvas Mount */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

      {/* Subtle indicator in 3D mode */}
      {viewMode === "3d" && (
        <div className="absolute top-4 right-4 z-10 pointer-events-none flex items-center gap-1.5 text-[11px] font-mono tracking-wider text-black/40 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Drag to rotate 3D
        </div>
      )}
    </div>
  );
}
