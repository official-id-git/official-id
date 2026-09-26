"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  SeasonType,
  SEASONS,
  generateVoxelTree,
  generateQrMatrix,
  VoxelItem,
} from "@/lib/voxel-tree-generator";
import { ambientAudio } from "@/lib/ambient-audio";
import {
  CameraPhoto,
  Close,
  VolumeUp,
  VolumeMute,
  ArrowUpRightFromSquare,
  WandMagicSparkles,
  Check,
  Pause,
  Play,
} from "flowbite-react-icons/outline";

interface WebARModalProps {
  url: string;
  season: SeasonType;
  isOpen: boolean;
  onClose: () => void;
  onSeasonChange?: (s: SeasonType) => void;
}

export default function WebARModal({
  url,
  season: initialSeason,
  isOpen,
  onClose,
  onSeasonChange,
}: WebARModalProps) {
  const [season, setSeason] = useState<SeasonType>(initialSeason);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [treeScale, setTreeScale] = useState<number>(0.28);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Auto-redirect 10-second countdown
  const [countdown, setCountdown] = useState<number>(10);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRedirected, setIsRedirected] = useState<boolean>(false);
  const [capturedNotice, setCapturedNotice] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Sync internal season with prop
  useEffect(() => {
    setSeason(initialSeason);
  }, [initialSeason]);

  // 10-Second Countdown Timer
  useEffect(() => {
    if (!isOpen || isPaused || isRedirected) return;

    if (countdown <= 0) {
      setIsRedirected(true);
      if (url && typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown, isPaused, isRedirected, url]);

  // Initialize Camera
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    async function startCamera() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn("Camera stream access failed or permission denied:", err);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Izin kamera ditolak. Menampilkan simulasi lingkungan AR."
            : "Kamera tidak terdeteksi. Menampilkan simulasi ruangan AR."
        );
        setCameraActive(false);
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  // Three.js AR Scene
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const container = canvasRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Transparent Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Perspective Camera (ideal for AR depth)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 16, 32);
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    // 3. WebGLRenderer with Alpha (Transparent)
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls for AR Inspection
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05; // Don't orbit below ground
    controls.minDistance = 6;
    controls.maxDistance = 75;
    controls.target.set(0, 4, 0);

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff7ea, 2.2);
    sunLight.position.set(20, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    const sD = 18;
    sunLight.shadow.camera.left = -sD;
    sunLight.shadow.camera.right = sD;
    sunLight.shadow.camera.top = sD;
    sunLight.shadow.camera.bottom = -sD;
    scene.add(sunLight);

    // 6. AR Ground Shadow Receiver
    const shadowGeo = new THREE.PlaneGeometry(60, 60);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 7. Tree Model Group
    const treeGroup = new THREE.Group();
    treeGroup.position.set(0, 0, 0);
    scene.add(treeGroup);
    treeGroupRef.current = treeGroup;

    // 8. Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Gentle floating/breathing idle in AR space
      if (treeGroupRef.current) {
        treeGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.15;
        treeGroupRef.current.rotation.y = elapsedTime * 0.08;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!canvasRef.current || !renderer || !camera) return;
      const w = canvasRef.current.clientWidth || window.innerWidth;
      const h = canvasRef.current.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      controls.dispose();
      renderer.dispose();
      container.replaceChildren();
    };
  }, [isOpen]);

  // Build Voxels into AR Scene
  useEffect(() => {
    if (!treeGroupRef.current || !isOpen) return;
    const group = treeGroupRef.current;
    group.clear();

    const { matrix, size } = generateQrMatrix(url || "https://official.id");
    const voxels = generateVoxelTree(matrix, size, season, { scanSafeTop: true });

    const voxelGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const voxelMat = new THREE.MeshStandardMaterial({
      roughness: 0.82,
      metalness: 0.08,
    });

    const instMesh = new THREE.InstancedMesh(voxelGeo, voxelMat, voxels.length);
    instMesh.castShadow = true;
    instMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < voxels.length; i++) {
      const v = voxels[i];
      const s = v.size ?? 0.95;
      dummy.position.set(v.x, v.y + s / 2, v.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();

      instMesh.setMatrixAt(i, dummy.matrix);
      instMesh.setColorAt(i, new THREE.Color(v.color));
    }

    instMesh.instanceMatrix.needsUpdate = true;
    if (instMesh.instanceColor) instMesh.instanceColor.needsUpdate = true;

    group.add(instMesh);
    group.scale.setScalar(treeScale);
  }, [isOpen, url, season, treeScale]);

  // Handle Scale Change
  const handleScaleChange = (val: number) => {
    setTreeScale(val);
    if (treeGroupRef.current) {
      treeGroupRef.current.scale.setScalar(val);
    }
  };

  // Sound Toggle
  const handleSoundToggle = () => {
    const active = ambientAudio.toggle();
    setIsAudioPlaying(active);
  };

  // Capture AR Snapshot
  const handleCaptureSnapshot = () => {
    if (!canvasRef.current || !rendererRef.current) return;
    try {
      const webglCanvas = rendererRef.current.domElement;
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = webglCanvas.width;
      exportCanvas.height = webglCanvas.height;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      // Draw camera video if active
      if (videoRef.current && cameraActive) {
        ctx.drawImage(videoRef.current, 0, 0, exportCanvas.width, exportCanvas.height);
      } else {
        // Draw elegant gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, exportCanvas.height);
        grad.addColorStop(0, "#1c1917");
        grad.addColorStop(1, "#292524");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      // Draw 3D Tree layer
      ctx.drawImage(webglCanvas, 0, 0);

      // Watermark
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "bold 20px monospace";
      ctx.fillText("[ OFFICIAL.ID — WebAR Magic Tree ]", 32, exportCanvas.height - 32);

      const link = document.createElement("a");
      link.download = `official-id-magic-tree-ar-${season}-${Date.now()}.png`;
      link.href = exportCanvas.toDataURL("image/png");
      link.click();

      setCapturedNotice(true);
      setTimeout(() => setCapturedNotice(false), 2500);
    } catch (e) {
      console.error("AR Capture error:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 select-none overflow-hidden animate-in fade-in duration-300">
      {/* 1. Real Device Camera Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Fallback Simulated Reality Backdrop when camera is off */}
      {!cameraActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-black flex items-center justify-center pointer-events-none">
          {/* Subtle AR Grid Room */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
          <div className="absolute bottom-12 text-center px-4 max-w-sm">
            <p className="text-xs text-stone-400">
              {cameraError || "Memuat kamera realitas..."}
            </p>
          </div>
        </div>
      )}

      {/* 2. Transparent Three.js WebGL Layer */}
      <div ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto cursor-grab active:cursor-grabbing" />

      {/* 3. Top Header Control Bar */}
      <header className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-md">
            <WandMagicSparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>WebAR Magic Tree</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                LIVE AR
              </span>
            </h2>
            <p className="text-[11px] text-stone-300">Sentuh & putar untuk melihat pohon di ruangan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={handleSoundToggle}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition shadow-md"
            title="Suara Angin & Alam"
          >
            {isAudioPlaying ? <VolumeUp className="w-4 h-4 text-emerald-400" /> : <VolumeMute className="w-4 h-4 text-stone-300" />}
          </button>

          {/* Snapshot capture */}
          <button
            onClick={handleCaptureSnapshot}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition shadow-md"
            title="Ambil Foto AR"
          >
            <CameraPhoto className="w-4 h-4 text-white" />
          </button>

          {/* Close AR */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-md ml-1"
            title="Keluar dari AR"
          >
            <Close className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Snapshot Toast Notice */}
      {capturedNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-emerald-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Foto AR berhasil disimpan!
        </div>
      )}

      {/* 4. Bottom Smart Redirect & AR Control Island */}
      <footer className="relative mt-auto z-20 p-4 sm:p-6 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Magic Portal Link Auto-Redirect Capsule */}
        <div className="w-full max-w-md rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 p-3.5 text-white shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold tracking-wide">Magic Portal Terhubung</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-300" />}
                {isPaused ? "Lanjutkan" : "Tahan"}
              </button>
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-black/40">
                {countdown}s
              </span>
            </div>
          </div>

          <div className="text-[11px] text-stone-300 truncate">
            Tujuan: <span className="text-white font-mono">{url}</span>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${(countdown / 10) * 100}%` }}
            />
          </div>

          {/* Direct Action Link Button */}
          <div className="flex items-center gap-2 pt-0.5">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition"
            >
              <span>Buka Link Sekarang</span>
              <ArrowUpRightFromSquare className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Season Switcher & Scale Controls in AR */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Season Buttons */}
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-md">
            <button
              onClick={() => {
                setSeason("summer");
                onSeasonChange?.("summer");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                season === "summer" ? "bg-white text-stone-900 font-bold shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              🌳 Summer
            </button>
            <button
              onClick={() => {
                setSeason("spring");
                onSeasonChange?.("spring");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                season === "spring" ? "bg-white text-stone-900 font-bold shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              🌸 Sakura
            </button>
            <button
              onClick={() => {
                setSeason("autumn");
                onSeasonChange?.("autumn");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                season === "autumn" ? "bg-white text-stone-900 font-bold shadow-sm" : "text-white/80 hover:text-white"
              }`}
            >
              🍂 Autumn
            </button>
          </div>

          {/* Scale Slider */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-xs shadow-md">
            <span className="text-[10px] text-stone-300 font-medium">Ukuran:</span>
            <input
              type="range"
              min="0.12"
              max="0.55"
              step="0.02"
              value={treeScale}
              onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
              className="w-20 accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
