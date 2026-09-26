"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  VoxelItem,
  SeasonType,
  SEASONS,
  generateVoxelTree,
  generateQrMatrix,
} from "@/lib/voxel-tree-generator";

interface ThreeVoxelTreeSceneProps {
  url: string;
  season: SeasonType;
  viewMode: "3d" | "qr";
  onViewModeToggle: () => void;
  onSceneReady?: (exporter: {
    captureImage: () => string | null;
    getVoxelCount: () => number;
  }) => void;
}

export default function ThreeVoxelTreeScene({
  url,
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

  // Wind animation shader uniforms ref
  const windUniformsRef = useRef<{
    uTime: { value: number };
    uWind: { value: number };
  }>({
    uTime: { value: 0 },
    uWind: { value: 1.0 },
  });

  const animFrameRef = useRef<number | null>(null);
  const [voxelCount, setVoxelCount] = useState<number>(0);

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

  // Base camera coordinates
  // 3D Isometric View: Elegant ~25° elevation angle targeting tree core (Y=18)
  const POS_3D = new THREE.Vector3(52, 46, 52);
  const TARGET_3D = new THREE.Vector3(0, 18, 0);
  const UP_3D = new THREE.Vector3(0, 1, 0);

  // Top-Down QR Code Scan View: looking straight down at (0, 0, 0)
  // UP vector must be (0, 0, -1) so QR code is perfectly upright on screen
  const POS_QR = new THREE.Vector3(0, 95, 0);
  const TARGET_QR = new THREE.Vector3(0, 0, 0);
  const UP_QR = new THREE.Vector3(0, 0, -1);

  // Base Frustum size: generous to ensure NO CLIPPING of the tall tree in 3D mode
  const BASE_FRUSTUM = 72;

  const easeInOutCubic = (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

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
    camera.zoom = viewMode === "qr" ? 1.65 : 0.92;
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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

      // Update Wind Shader Uniforms
      if (windUniformsRef.current) {
        windUniformsRef.current.uTime.value = timeInSec;
        // In 3D: wind = 1.0 (leaves sway in breeze). In QR: smoothly lerp to 0.0 for instant camera scan!
        const targetWind = viewMode === "3d" ? 1.0 : 0.0;
        windUniformsRef.current.uWind.value = THREE.MathUtils.lerp(
          windUniformsRef.current.uWind.value,
          targetWind,
          0.06
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

        if (progress >= 1) {
          isTransitioningRef.current = false;
          controlsRef.current.enabled = viewMode === "3d";
        }
      } else if (controlsRef.current && viewMode === "3d") {
        controlsRef.current.update();
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

    // 1. Generate QR matrix
    const { matrix, size } = generateQrMatrix(url);

    // 2. Generate 3D Voxel Array for the Majestic Magic Tree
    const voxels: VoxelItem[] = generateVoxelTree(matrix, size, season);
    setVoxelCount(voxels.length);

    // 3. Create InstancedMesh with Wind Sway Shader
    const voxelGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const voxelMat = new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: 0.08,
    });

    // Injected GPU Wind Sway Shader ("daunnya nampak bergerak-gerak kena angin")
    voxelMat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = windUniformsRef.current.uTime;
      shader.uniforms.uWind = windUniformsRef.current.uWind;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uWind;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        `
        vec4 mvPosition = vec4( transformed, 1.0 );
        #ifdef USE_BATCHING
          mvPosition = batchingMatrix * mvPosition;
        #endif
        #ifdef USE_INSTANCING
          mvPosition = instanceMatrix * mvPosition;
          if (mvPosition.y > 12.0 && uWind > 0.001) {
            float hFactor = clamp((mvPosition.y - 12.0) / 32.0, 0.0, 1.4);
            // Harmonic wind sway: gentle macro branch sway + micro foliage flutter
            float sway1 = sin(uTime * 2.2 + mvPosition.x * 0.32 + mvPosition.z * 0.32) * 0.42;
            float sway2 = cos(uTime * 2.9 + mvPosition.z * 0.35 + mvPosition.y * 0.15) * 0.28;
            float flutter = sin(uTime * 5.4 + mvPosition.x * 1.5 + mvPosition.z * 1.5) * 0.14;
            
            mvPosition.x += (sway1 + flutter) * hFactor * uWind;
            mvPosition.z += (sway2 + flutter * 0.8) * hFactor * uWind;
            mvPosition.y += sin(uTime * 3.8 + mvPosition.x * 0.5 + mvPosition.z * 0.5) * 0.06 * hFactor * uWind;
          }
        #endif
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
        `
      );
    };

    const instMesh = new THREE.InstancedMesh(voxelGeo, voxelMat, voxels.length);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < voxels.length; i++) {
      const v = voxels[i];
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
  }, [url, season]);

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
        cameraRef.current.zoom = mode === "qr" ? 1.65 : 0.92;
        cameraRef.current.updateProjectionMatrix();
      }
    },
    [POS_3D, TARGET_3D, UP_3D, POS_QR, TARGET_QR, UP_QR]
  );

  useEffect(() => {
    triggerCameraTransition(viewMode);
  }, [viewMode, triggerCameraTransition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none"
      onClick={() => {
        // Clicking on the canvas can trigger mode toggle
        onViewModeToggle();
      }}
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
