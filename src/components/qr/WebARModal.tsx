"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  SeasonType,
  VoxelItem,
  generateVoxelTree,
  generateQrMatrix,
  generateParticles,
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

type RedirectReason = "auto" | "click";

interface WebARModalProps {
  /** URL tujuan milik pengguna */
  url: string;
  /** Teks yang benar-benar dicetak di QR (short-link official.id). Default: url */
  qrText?: string;
  season: SeasonType;
  isOpen: boolean;
  onClose: () => void;
  onSeasonChange?: (s: SeasonType) => void;
  /**
   * "scan"    → halaman publik hasil scan: redirect otomatis di tab yang sama.
   * "preview" → pratinjau di dashboard: tidak pernah redirect otomatis.
   */
  mode?: "scan" | "preview";
  redirectSeconds?: number;
  onRedirect?: (reason: RedirectReason) => void;
  /** Kekuatan angin (unit voxel di pucuk pohon). 0 = tanpa angin. Default 0.9 */
  windStrength?: number;
}

/** Batas waktu menunggu dialog izin kamera sebelum countdown tetap dimulai */
const CAMERA_WAIT_MS = 6000;

const isMobileUA = () =>
  typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose();
  });
}

/** Gambar video dengan crop "object-cover" agar sama persis dengan yang terlihat di layar */
function drawVideoCover(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, w: number, h: number) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) return false;
  const scale = Math.max(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return true;
}

// -----------------------------------------------------------------------------
// ANGIN: gerakan per-voxel di vertex shader (GPU), ringan untuk ribuan instance
// -----------------------------------------------------------------------------

type WindUniforms = {
  uTime: { value: number };
  uWindDir: { value: THREE.Vector3 };
  uStrength: { value: number };
  uFlutter: { value: number };
  uGrowth: { value: number };
};

const WIND_DECLARATIONS = /* glsl */ `
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

const WIND_PROJECT_VERTEX = /* glsl */ `
// Animasi tumbuh per-voxel: pop scale elastis
float g = clamp((uGrowth - aGrowDelay) / 0.22, 0.0, 1.0);
float popScale = sin(g * 1.5707963);
vec3 transformed = position * popScale;

vec4 mvPosition = vec4( transformed, 1.0 );
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

function applyWind(material: THREE.Material, uniforms: WindUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms); // referensi objek yang sama → update value langsung terbaca
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${WIND_DECLARATIONS}`)
      .replace("#include <project_vertex>", WIND_PROJECT_VERTEX);
  };
  material.customProgramCacheKey = () => "voxel-wind-growth-v2";
}

function buildWindAttributes(voxels: VoxelItem[]) {
  const n = voxels.length;
  const sway = new Float32Array(n);
  const leaf = new Float32Array(n);
  const phase = new Float32Array(n);
  const growDelay = new Float32Array(n);

  let maxY = 3;
  for (const v of voxels) if (v.role === "leaf" && v.y > maxY) maxY = v.y;
  const rootY = 2; // akar & pangkal batang tetap diam

  let maxDistXZ = 1;
  for (const v of voxels) {
    const d = Math.hypot(v.x, v.z);
    if (d > maxDistXZ) maxDistXZ = d;
  }

  for (let i = 0; i < n; i++) {
    const v = voxels[i];
    const distXZ = Math.hypot(v.x, v.z) / maxDistXZ;

    // Timeline tumbuh: Dasar/QR -> Batang & Dahan -> Kanopi Daun -> Orang
    if (v.role === "stone" || v.role === "border" || v.role === "flower" || v.y < 1) {
      growDelay[i] = distXZ * 0.15;
    } else if (v.role === "trunk" || v.role === "branch") {
      const normY = Math.min(1, Math.max(0, (v.y - 1) / (maxY - 1)));
      growDelay[i] = 0.15 + normY * 0.25;
    } else if (v.role === "leaf" || v.role === "hedge") {
      const normY = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
      growDelay[i] = 0.35 + normY * 0.25 + distXZ * 0.08;
    } else if (v.role === "person") {
      growDelay[i] = 0.68;
    } else {
      growDelay[i] = 0.20;
    }

    // Tile gelap di lantai juga ber-role "leaf" tapi y < 1 → harus diam
    const movable = v.y >= 1 && (v.role === "leaf" || v.role === "trunk" || v.role === "branch");
    if (!movable) continue;

    sway[i] = Math.min(1, Math.max(0, (v.y - rootY) / (maxY - rootY)));
    // Kotak kecil bergetar lebih banyak, kotak besar 2x2x2 lebih kalem
    leaf[i] = v.role === "leaf" ? Math.min(1.6, 0.9 / (v.size ?? 0.96)) : 0;
    phase[i] = (v.x * 12.9898 + v.y * 78.233 + v.z * 37.719) % (Math.PI * 2);
  }
  return { sway, leaf, phase, growDelay };
}

export default function WebARModal({
  url,
  qrText,
  season: initialSeason,
  isOpen,
  onClose,
  onSeasonChange,
  mode = "scan",
  redirectSeconds = 10,
  onRedirect,
  windStrength = 0.9,
}: WebARModalProps) {
  const REDIRECT_MS = redirectSeconds * 1000;
  const isScan = mode === "scan";

  const [season, setSeason] = useState<SeasonType>(initialSeason);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraSettled, setCameraSettled] = useState(false); // izin dijawab / gagal / timeout
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [treeScale, setTreeScale] = useState(0.28);
  const [isQrLocked, setIsQrLocked] = useState(false);

  const [remainingMs, setRemainingMs] = useState(REDIRECT_MS);
  const [isPaused, setIsPaused] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false);
  const [capturedNotice, setCapturedNotice] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const treeMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const remainingRef = useRef(REDIRECT_MS);
  const redirectedRef = useRef(false);
  const growthStartTimeRef = useRef<number>(0);
  const qrTargetRef = useRef<{ active: boolean; x: number; y: number; z: number; lastSeen: number }>({
    active: false,
    x: 0,
    y: 0,
    z: 0,
    lastSeen: 0,
  });

  const windRef = useRef<WindUniforms | null>(null);
  if (!windRef.current) {
    windRef.current = {
      uTime: { value: 0 },
      uWindDir: { value: new THREE.Vector3(1, 0, 0.35).normalize() },
      uStrength: { value: windStrength },
      uFlutter: { value: 0.09 },
      uGrowth: { value: 0.0 },
    };
  }
  const particlesRef = useRef<{
    mesh: THREE.InstancedMesh;
    data: ReturnType<typeof generateParticles>;
  } | null>(null);

  const logArAnalytics = useCallback(
    (event: string, meta?: Record<string, unknown>) => {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        try {
          const payload = JSON.stringify({
            event,
            url,
            qrText,
            season,
            mode,
            timestamp: Date.now(),
            ...meta,
          });
          navigator.sendBeacon("/api/analytics/ar", payload);
        } catch {
          /* biarkan jika offline */
        }
      }
    },
    [url, qrText, season, mode]
  );

  // Kekuatan angin + hormati preferensi "kurangi gerakan" di perangkat pengguna
  useEffect(() => {
    const w = windRef.current!;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    w.uStrength.value = reduce ? windStrength * 0.3 : windStrength;
    w.uFlutter.value = reduce ? 0 : 0.09;
  }, [windStrength]);

  useEffect(() => setSeason(initialSeason), [initialSeason]);

  // Reset state setiap kali dibuka
  useEffect(() => {
    if (!isOpen) return;
    remainingRef.current = REDIRECT_MS;
    redirectedRef.current = false;
    setRemainingMs(REDIRECT_MS);
    setIsRedirected(false);
    setIsPaused(false);
    setSceneReady(false);
    setCameraSettled(false);
    setIsQrLocked(false);
    qrTargetRef.current = { active: false, x: 0, y: 0, z: 0, lastSeen: 0 };
    growthStartTimeRef.current = 0;
    if (windRef.current) windRef.current.uGrowth.value = 0.0;
    logArAnalytics("modal_opened");
  }, [isOpen, REDIRECT_MS, logArAnalytics]);

  // ---------------------------------------------------------------------------
  // Redirect
  // ---------------------------------------------------------------------------
  const doRedirect = useCallback(
    (reason: RedirectReason) => {
      if (redirectedRef.current) return;
      redirectedRef.current = true;
      setIsRedirected(true);
      logArAnalytics(reason === "auto" ? "auto_redirect" : "bubble_click", { reason });
      onRedirect?.(reason);
      // replace(): tidak diblokir seperti popup & tombol Back tidak kembali ke AR
      if (isScan && url) window.location.replace(url);
    },
    [isScan, url, onRedirect, logArAnalytics]
  );

  // Countdown berbasis waktu nyata, mulai saat scene siap & kamera sudah terjawab
  useEffect(() => {
    if (!isOpen || isPaused || isRedirected || !sceneReady || !cameraSettled) return;

    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      if (document.hidden) {
        last = now; // jangan hitung saat tab tidak terlihat
        return;
      }
      remainingRef.current = Math.max(0, remainingRef.current - (now - last));
      last = now;
      setRemainingMs(remainingRef.current);
      if (remainingRef.current <= 0) {
        window.clearInterval(id);
        doRedirect("auto");
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [isOpen, isPaused, isRedirected, sceneReady, cameraSettled, doRedirect]);

  // ---------------------------------------------------------------------------
  // Kamera
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    // Jika dialog izin dibiarkan menggantung, countdown tetap mulai
    const waitTimer = window.setTimeout(() => isSubscribed && setCameraSettled(true), CAMERA_WAIT_MS);

    async function startCamera() {
      setCameraError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Browser ini tidak mengizinkan akses kamera. Coba buka di Chrome atau Safari. Menampilkan mode simulasi."
        );
        setCameraSettled(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          try {
            await video.play();
            logArAnalytics("camera_active");
          } catch {
            /* autoplay muted biasanya tetap jalan; event "playing" di bawah yang menentukan */
          }
        }
      } catch (err: unknown) {
        const name = (err as DOMException)?.name;
        console.warn("Camera access failed:", err);
        if (isSubscribed) {
          logArAnalytics("camera_denied", { error: name });
          setCameraError(
            name === "NotAllowedError"
              ? "Izin kamera ditolak. Menampilkan simulasi lingkungan AR."
              : "Kamera tidak terdeteksi. Menampilkan simulasi ruangan AR."
          );
          setCameraActive(false);
        }
      } finally {
        if (isSubscribed) setCameraSettled(true);
      }
    }

    startCamera();

    return () => {
      isSubscribed = false;
      window.clearTimeout(waitTimer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
    };
  }, [isOpen, logArAnalytics]);

  // ---------------------------------------------------------------------------
  // Tingkat 2: Anchor QR Fisik via BarcodeDetector (Chrome Android / modern browser)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !cameraActive || typeof window === "undefined") return;
    if (!("BarcodeDetector" in window)) return;

    let isSubscribed = true;
    let detector: any = null;
    try {
      detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
    } catch {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !detector || !isSubscribed) return;

      try {
        const barcodes = await detector.detect(video);
        if (!isSubscribed) return;
        if (barcodes && barcodes.length > 0) {
          const qr = barcodes[0];
          const pts = qr.cornerPoints;
          if (pts && pts.length >= 4) {
            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
            const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;
            const ndcX = (cx / vw) * 2 - 1;
            const ndcY = -((cy / vh) * 2 - 1);

            const side1 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
            const qrFrac = side1 / vw;

            qrTargetRef.current = {
              active: true,
              x: ndcX * 7.5,
              y: ndcY * 5.0 - 1.2,
              z: Math.max(-8, (0.32 - qrFrac) * 18),
              lastSeen: performance.now(),
            };
            setIsQrLocked(true);
          }
        } else {
          if (performance.now() - qrTargetRef.current.lastSeen > 1600) {
            qrTargetRef.current.active = false;
            setIsQrLocked(false);
          }
        }
      } catch {
        /* ignore frame detection error */
      }
    }, 160);

    return () => {
      isSubscribed = false;
      window.clearInterval(intervalId);
      qrTargetRef.current.active = false;
      setIsQrLocked(false);
    };
  }, [isOpen, cameraActive]);

  // ---------------------------------------------------------------------------
  // Scene Three.js
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const container = canvasRef.current;
    const mobile = isMobileUA();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 16, 32);
    camera.lookAt(0, 4, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !mobile,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.toneMapping = THREE.NoToneMapping; // warna palet voxel tetap setia
    renderer.shadowMap.enabled = !mobile; // shadow real-time mahal di HP
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 75;
    controls.target.set(0, 4, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    const stopAutoRotate = () => (controls.autoRotate = false);
    controls.addEventListener("start", stopAutoRotate);

    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const sunLight = new THREE.DirectionalLight(0xfff7ea, 2.0);
    sunLight.position.set(20, 45, 25);
    if (renderer.shadowMap.enabled) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 100;
      const sD = 18;
      sunLight.shadow.camera.left = -sD;
      sunLight.shadow.camera.right = sD;
      sunLight.shadow.camera.top = sD;
      sunLight.shadow.camera.bottom = -sD;

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.ShadowMaterial({ opacity: 0.35 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -0.01;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);
    }
    scene.add(sunLight);

    const treeGroup = new THREE.Group();
    scene.add(treeGroup);
    treeGroupRef.current = treeGroup;

    // Daun/kelopak berjatuhan yang terbawa arah angin yang sama dengan pohon
    const pDummy = new THREE.Object3D();
    const updateParticles = (t: number, dt: number) => {
      const p = particlesRef.current;
      const w = windRef.current;
      if (!p || !w) return;
      const dir = w.uWindDir.value;
      const gust = 0.55 + 0.35 * Math.sin(t * 0.8);
      const push = w.uStrength.value * 1.4;
      const growthVal = w.uGrowth.value;

      for (let i = 0; i < p.data.length; i++) {
        const q = p.data[i];
        if (growthVal < 0.35) {
          pDummy.position.set(0, -50, 0);
          pDummy.scale.setScalar(0);
          pDummy.updateMatrix();
          p.mesh.setMatrixAt(i, pDummy.matrix);
          continue;
        }

        q.y -= q.speed * 60 * dt;
        q.x += (dir.x * gust * push + Math.sin(t * q.swaySpeed + q.swayPhase) * 0.6) * dt;
        q.z += (dir.z * gust * push + Math.cos(t * q.swaySpeed * 0.8 + q.swayPhase) * 0.6) * dt;

        if (q.y < 0.6 || Math.abs(q.x) > 20 || Math.abs(q.z) > 20) {
          // Lahir kembali di sekitar canopy, sedikit di sisi hulu angin
          q.y = 16 + Math.random() * 12;
          q.x = (Math.random() - 0.5) * 22 - dir.x * 5;
          q.z = (Math.random() - 0.5) * 22 - dir.z * 5;
        }

        pDummy.position.set(q.x, q.y, q.z);
        pDummy.rotation.set(t * q.swaySpeed, t * q.swaySpeed * 0.7 + q.swayPhase, 0);
        const particleScale = q.size * Math.min(1, Math.max(0, (growthVal - 0.35) / 0.3));
        pDummy.scale.setScalar(particleScale);
        pDummy.updateMatrix();
        p.mesh.setMatrixAt(i, pDummy.matrix);
      }
      p.mesh.instanceMatrix.needsUpdate = true;
    };

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      if (windRef.current) {
        windRef.current.uTime.value = t;
        if (growthStartTimeRef.current > 0) {
          const growthElapsed = (performance.now() - growthStartTimeRef.current) / 1000;
          const gProgress = Math.min(1, Math.max(0, growthElapsed / 2.2));
          windRef.current.uGrowth.value = gProgress;
        }
      }
      updateParticles(t, dt);

      // Lerp posisi pohon ke anchor QR fisik jika terdeteksi, atau kembali ke tengah
      if (treeGroupRef.current) {
        const tg = treeGroupRef.current;
        if (qrTargetRef.current.active) {
          tg.position.x += (qrTargetRef.current.x - tg.position.x) * 0.12;
          tg.position.y += (qrTargetRef.current.y - tg.position.y) * 0.12;
          tg.position.z += (qrTargetRef.current.z - tg.position.z) * 0.12;
        } else {
          tg.position.x += (0 - tg.position.x) * 0.08;
          tg.position.y += (0 - tg.position.y) * 0.08;
          tg.position.z += (0 - tg.position.z) * 0.08;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.removeEventListener("start", stopAutoRotate);
      controls.dispose();
      disposeObject(scene);
      renderer.dispose();
      renderer.forceContextLoss(); // lepas WebGL context (batas context di mobile kecil)
      container.replaceChildren();
      treeMeshRef.current?.customDepthMaterial?.dispose();
      treeGroupRef.current = null;
      treeMeshRef.current = null;
      particlesRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, [isOpen]);

  // ---------------------------------------------------------------------------
  // Bangun voxel (TIDAK bergantung pada treeScale)
  // ---------------------------------------------------------------------------
  const encodedText = qrText || url || "https://official.id";

  useEffect(() => {
    const group = treeGroupRef.current;
    if (!isOpen || !group) return;

    // Buang mesh lama beserta geometry & material-nya
    if (treeMeshRef.current) {
      group.remove(treeMeshRef.current);
      treeMeshRef.current.geometry.dispose();
      (treeMeshRef.current.material as THREE.Material).dispose();
      treeMeshRef.current.customDepthMaterial?.dispose();
      treeMeshRef.current.dispose();
      treeMeshRef.current = null;
    }
    if (particlesRef.current) {
      const pm = particlesRef.current.mesh;
      group.remove(pm);
      pm.geometry.dispose();
      (pm.material as THREE.Material).dispose();
      pm.dispose();
      particlesRef.current = null;
    }

    const { matrix, size } = generateQrMatrix(encodedText);
    const voxels = generateVoxelTree(matrix, size, season, { scanSafeTop: true });
    const wind = windRef.current!;

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const { sway, leaf, phase, growDelay } = buildWindAttributes(voxels);
    geo.setAttribute("aSway", new THREE.InstancedBufferAttribute(sway, 1));
    geo.setAttribute("aLeaf", new THREE.InstancedBufferAttribute(leaf, 1));
    geo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phase, 1));
    geo.setAttribute("aGrowDelay", new THREE.InstancedBufferAttribute(growDelay, 1));

    const mat = new THREE.MeshStandardMaterial({ roughness: 0.82, metalness: 0.05 });
    applyWind(mat, wind);

    const mesh = new THREE.InstancedMesh(geo, mat, voxels.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false; // posisi bergeser di shader, bounding sphere CPU tidak tahu

    // Bayangan ikut bergoyang (hanya berpengaruh saat shadow aktif / desktop)
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    applyWind(depthMat, wind);
    mesh.customDepthMaterial = depthMat;

    // Partikel daun/kelopak berjatuhan sesuai musim
    const pData = generateParticles(55, season);
    const pGeo = new THREE.BoxGeometry(1, 0.35, 1); // pipih seperti daun
    const pMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const pMesh = new THREE.InstancedMesh(pGeo, pMat, pData.length);
    pMesh.frustumCulled = false;
    const pColor = new THREE.Color();
    pData.forEach((q, i) => pMesh.setColorAt(i, pColor.set(q.color)));
    if (pMesh.instanceColor) pMesh.instanceColor.needsUpdate = true;
    group.add(pMesh);
    particlesRef.current = { mesh: pMesh, data: pData };

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < voxels.length; i++) {
      const v = voxels[i];
      const s = v.size ?? 0.96;
      // y dari generator = titik tengah kotak. Offset konstan +0.5 hanya mengangkat
      // seluruh diorama agar lantai berada di atas y=0 — sama untuk semua ukuran.
      dummy.position.set(v.x, v.y + 0.5, v.z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.set(v.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    group.add(mesh);
    group.scale.setScalar(treeScale);
    treeMeshRef.current = mesh;
    setSceneReady(true);
    growthStartTimeRef.current = performance.now();
    logArAnalytics("scene_ready", { voxelCount: voxels.length });
    // treeScale sengaja tidak masuk deps; diatur oleh effect terpisah di bawah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, encodedText, season]);

  useEffect(() => {
    treeGroupRef.current?.scale.setScalar(treeScale);
  }, [treeScale]);

  // ---------------------------------------------------------------------------
  // Aksi
  // ---------------------------------------------------------------------------
  const handleSoundToggle = () => setIsAudioPlaying(ambientAudio.toggle());

  const changeSeason = (s: SeasonType) => {
    setSeason(s);
    onSeasonChange?.(s);
  };

  const handleCaptureSnapshot = () => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    try {
      const glCanvas = renderer.domElement;
      const out = document.createElement("canvas");
      out.width = glCanvas.width;
      out.height = glCanvas.height;
      const ctx = out.getContext("2d");
      if (!ctx) return;

      const drewVideo =
        cameraActive && videoRef.current && drawVideoCover(ctx, videoRef.current, out.width, out.height);
      if (!drewVideo) {
        const grad = ctx.createLinearGradient(0, 0, 0, out.height);
        grad.addColorStop(0, "#1c1917");
        grad.addColorStop(1, "#292524");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, out.width, out.height);
      }

      // Render ulang di task yang sama → tidak perlu preserveDrawingBuffer
      renderer.render(scene, camera);
      ctx.drawImage(glCanvas, 0, 0);

      const fontPx = Math.round(out.width / 40);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = `bold ${fontPx}px monospace`;
      ctx.fillText("OFFICIAL.ID — WebAR Magic Tree", fontPx * 1.5, out.height - fontPx * 1.5);

      out.toBlob(async (blob) => {
        if (!blob) return;
        const fileName = `official-id-magic-tree-${season}-${Date.now()}.png`;
        const file = new File([blob], fileName, { type: "image/png" });
        try {
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "Magic Tree AR" });
          } else {
            throw new Error("share-unsupported");
          }
        } catch (e) {
          if ((e as DOMException)?.name === "AbortError") return; // pengguna batal
          const href = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = href;
          a.download = fileName;
          a.click();
          setTimeout(() => URL.revokeObjectURL(href), 4000);
        }
        setCapturedNotice(true);
        logArAnalytics("snapshot_taken");
        setTimeout(() => setCapturedNotice(false), 2500);
      }, "image/png");
    } catch (e) {
      console.error("AR Capture error:", e);
    }
  };

  if (!isOpen) return null;

  const countingDown = sceneReady && cameraSettled;
  const secondsLeft = Math.ceil(remainingMs / 1000);
  const progress = remainingMs / REDIRECT_MS;

  let destinationHost = url;
  try {
    destinationHost = new URL(url).host;
  } catch {
    /* biarkan apa adanya */
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-stone-950 select-none overflow-hidden animate-in fade-in duration-300">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onPlaying={() => setCameraActive(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          cameraActive ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {!cameraActive && (
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-stone-950 to-black flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
          <div className="absolute bottom-56 text-center px-4 max-w-sm">
            <p className="text-xs text-stone-400">{cameraError || "Memuat kamera…"}</p>
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none cursor-grab active:cursor-grabbing"
      />

      <header className="relative z-20 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-md">
            <WandMagicSparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5 flex-wrap">
              <span>WebAR Magic Tree</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                {cameraActive ? "LIVE AR" : "SIMULASI"}
              </span>
              {isQrLocked && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-300 border border-sky-500/40 animate-pulse font-medium flex items-center gap-1">
                  <span>🎯 QR Fisik Terkunci</span>
                </span>
              )}
            </h2>
            <p className="text-[11px] text-stone-300">Sentuh & putar untuk melihat pohon</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSoundToggle}
            aria-label={isAudioPlaying ? "Matikan suara" : "Nyalakan suara alam"}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition shadow-md"
          >
            {isAudioPlaying ? (
              <VolumeUp className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeMute className="w-4 h-4 text-stone-300" />
            )}
          </button>

          <button
            onClick={handleCaptureSnapshot}
            aria-label="Ambil foto AR"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white backdrop-blur-md border border-white/30 flex items-center justify-center transition shadow-md"
          >
            <CameraPhoto className="w-4 h-4 text-white" />
          </button>

          <button
            onClick={onClose}
            aria-label="Keluar dari AR"
            className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition shadow-md ml-1"
          >
            <Close className="w-5 h-5" />
          </button>
        </div>
      </header>

      {capturedNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-emerald-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-xl border border-white/20 flex items-center gap-2">
          <Check className="w-4 h-4" />
          Foto AR berhasil disimpan!
        </div>
      )}

      <footer className="relative mt-auto z-20 p-4 sm:p-6 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="w-full max-w-md rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 p-3.5 text-white shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold tracking-wide">
                {!countingDown
                  ? "Menyiapkan AR…"
                  : isRedirected
                  ? isScan
                    ? "Membuka link…"
                    : "Selesai (mode pratinjau)"
                  : "Magic Portal Terhubung"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {countingDown && !isRedirected && (
                <button
                  onClick={() => setIsPaused((p) => !p)}
                  className="flex items-center gap-1 text-[11px] text-stone-300 hover:text-white px-2 py-0.5 rounded-lg bg-white/10"
                >
                  {isPaused ? (
                    <Play className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Pause className="w-3 h-3 text-amber-300" />
                  )}
                  {isPaused ? "Lanjutkan" : "Tahan"}
                </button>
              )}
              <span className="font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-black/40" aria-live="polite">
                {secondsLeft}s
              </span>
            </div>
          </div>

          <div className="text-[11px] text-stone-300 truncate">
            Tujuan: <span className="text-white font-mono">{destinationHost}</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full transition-[width] duration-200 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <a
            href={url}
            target={isScan ? "_self" : "_blank"}
            rel="noopener noreferrer"
            onClick={(e) => {
              if (isScan) {
                e.preventDefault();
                doRedirect("click");
              } else {
                onRedirect?.("click");
              }
            }}
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition"
          >
            <span>Buka Link Sekarang</span>
            <ArrowUpRightFromSquare className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* Pengunjung hasil scan melihat musim pilihan pemilik; ganti musim hanya di pratinjau */}
          {!isScan && (
            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/20 shadow-md">
              {(
                [
                  ["summer", "🌳 Summer"],
                  ["spring", "🌸 Sakura"],
                  ["autumn", "🍂 Autumn"],
                ] as [SeasonType, string][]
              ).map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => changeSeason(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    season === s ? "bg-white text-stone-900 font-bold shadow-sm" : "text-white/80 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <label className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-white text-xs shadow-md">
            <span className="text-[10px] text-stone-300 font-medium">Ukuran:</span>
            <input
              type="range"
              min="0.12"
              max="0.55"
              step="0.02"
              value={treeScale}
              onChange={(e) => setTreeScale(parseFloat(e.target.value))}
              className="w-20 accent-emerald-400 cursor-pointer"
            />
          </label>
        </div>
      </footer>
    </div>
  );
}
