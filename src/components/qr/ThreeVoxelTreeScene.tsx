"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  VoxelItem,
  SeasonType,
  SEASONS,
  generateVoxelTree,
  generateVoxelSatria,
  generateQrMatrix,
  ModelStyleType,
} from "@/lib/voxel-tree-generator";

interface ThreeVoxelTreeSceneProps {
  url: string;
  season: SeasonType;
  modelStyle: ModelStyleType;
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
  modelStyle,
  viewMode,
  onViewModeToggle,
  onSceneReady,
}: ThreeVoxelTreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  // 3D Isometric View: looking at (0, 7, 0) from an elevated 45° angle with ample breathing room
  const POS_3D = new THREE.Vector3(50, 58, 50);
  const TARGET_3D = new THREE.Vector3(0, 7, 0);
  const UP_3D = new THREE.Vector3(0, 1, 0);

  // Top-Down QR Code Scan View: looking straight down at (0, 0, 0)
  // UP vector must be (0, 0, -1) so QR code is perfectly upright on screen
  const POS_QR = new THREE.Vector3(0, 80, 0);
  const TARGET_QR = new THREE.Vector3(0, 0, 0);
  const UP_QR = new THREE.Vector3(0, 0, -1);

  // Base Frustum size: generous to ensure NO CLIPPING by the frame in 3D mode
  const BASE_FRUSTUM = 58;

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

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2.05; // Keep above ground plinth
    controls.minZoom = 0.4;
    controls.maxZoom = 3.5;
    controls.target.copy(viewMode === "3d" ? TARGET_3D : TARGET_QR);
    controls.enabled = viewMode === "3d";
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xfffaed, 1.3);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff7e6, 2.2);
    if (viewMode === "qr") {
      dirLight.position.set(0, 100, 0);
      dirLight.castShadow = false;
    } else {
      dirLight.position.set(40, 75, 35);
      dirLight.castShadow = true;
    }
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 200;
    const d = 36;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.7);
    fillLight.position.set(-30, 35, -30);
    scene.add(fillLight);

    // 6. Falling Petal / Sparkle Particles
    const particleCount = 65;
    const particleGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const particleMat = new THREE.MeshLambertMaterial();
    const particleMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    particleMesh.castShadow = true;
    scene.add(particleMesh);
    particlesMeshRef.current = particleMesh;

    const pData = [];
    for (let i = 0; i < particleCount; i++) {
      const color = new THREE.Color(
        theme.particleColors[i % theme.particleColors.length]
      );
      particleMesh.setColorAt(i, color);
      pData.push({
        x: (Math.random() - 0.5) * 32,
        y: 2 + Math.random() * 20,
        z: (Math.random() - 0.5) * 32,
        speed: 0.02 + Math.random() * 0.04,
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
    let lastTime = performance.now();
    const dummy = new THREE.Object3D();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const now = performance.now();
      lastTime = now;

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
            p.y = 18 + Math.random() * 4;
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

  // Re-generate Voxels when URL, Season, or ModelStyle changes
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

    // 2. Generate 3D Voxel Array
    let voxels: VoxelItem[];
    if (modelStyle === "satria") {
      voxels = generateVoxelSatria(matrix, size, season);
    } else {
      voxels = generateVoxelTree(matrix, size, season);
    }

    setVoxelCount(voxels.length);

    // 3. Create InstancedMesh (Base unit cube geometry with instance scaling)
    const voxelGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const voxelMat = new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: modelStyle === "satria" ? 0.35 : 0.08,
    });

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
  }, [url, season, modelStyle]);

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
          dirLightRef.current.position.set(40, 75, 35);
          dirLightRef.current.castShadow = true;
        }
      }

      // Hide drifting leaf particles in QR mode to prevent blocking white modules
      if (particlesMeshRef.current) {
        particlesMeshRef.current.visible = mode === "3d";
      }

      // Zoom adjustment: in QR mode ensure the entire QR code + quiet zone is cleanly framed
      if (cameraRef.current) {
        cameraRef.current.zoom = mode === "qr" ? 0.82 : 0.95;
        cameraRef.current.updateProjectionMatrix();
      }
    },
    [POS_3D, POS_QR, TARGET_3D, TARGET_QR, UP_3D, UP_QR]
  );

  useEffect(() => {
    triggerCameraTransition(viewMode);
  }, [viewMode, triggerCameraTransition]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden rounded-3xl">
      {/* Three.js Canvas Container */}
      <div
        ref={containerRef}
        onClick={() => {
          if (!isTransitioningRef.current) {
            onViewModeToggle();
          }
        }}
        className="w-full h-full cursor-pointer touch-none"
        title={
          viewMode === "3d"
            ? "Klik untuk melihat QR code scannable lurus dari atas"
            : "Klik untuk kembali ke tampilan pohon/patung 3D"
        }
      />



      {/* 3D Drag Tip Badge */}
      {viewMode === "3d" && (
        <div className="pointer-events-none absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/10 text-stone-600 text-[11px] font-mono backdrop-blur-sm border border-stone-900/5">
          <span>🖱️ Drag to rotate 3D</span>
        </div>
      )}
    </div>
  );
}
