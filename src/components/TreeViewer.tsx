"use client";

/**
 * Penampil pohon QR whitelabel — dipakai di halaman share (official.id/<slug>)
 * dan embed (official.id/embed/<slug>).
 *
 * Pola interaksi: pohon 3D bergoyang ditiup angin → ketuk → kamera terbang ke atas,
 * angin berhenti, lalu QR 2D yang tajam muncul (bisa langsung discan dari layar).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  SEASONS,
  SeasonType,
  generateQrMatrix,
  generateVoxelTree,
} from "@/lib/voxel-tree-generator";
import { buildTreeMesh, createWindUniforms, disposeTreeMesh } from "@/lib/voxel-three";
import { track } from "@/lib/track";
import { BASE_URL } from "@/lib/slug";

export interface ViewerBrand {
  name?: string | null;
  logoUrl?: string | null;
  accent?: string | null;
}

interface TreeViewerProps {
  slug: string;
  destination: string;
  /** Teks yang dicetak di QR (qrUrl(slug)) — pola pohon = pola QR cetak */
  qrText: string;
  season: SeasonType;
  shareUrl: string;
  arUrl: string;
  brand?: ViewerBrand;
  showBadge?: boolean;
  variant?: "page" | "embed";
  transparent?: boolean;
}

const ISO_POS = new THREE.Vector3(38, 34, 38);
const ISO_TARGET = new THREE.Vector3(0, 8, 0);
const TOP_POS = new THREE.Vector3(0, 90, 0.001); // z kecil → orientasi QR tegak (baris 0 di atas)
const TOP_TARGET = new THREE.Vector3(0, 0, 0);
const WIND_ON = 0.9;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function QrSvg({
  matrix,
  size,
  dark,
  light,
}: {
  matrix: number[][];
  size: number;
  dark: string;
  light: string;
}) {
  const qz = 4;
  const total = size + qz * 2;
  const d = useMemo(() => {
    let p = "";
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++) if (matrix[r][c]) p += `M${c + qz} ${r + qz}h1v1h-1z`;
    return p;
  }, [matrix, size]);
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      className="h-full w-full"
      role="img"
      aria-label="QR code"
    >
      <rect width={total} height={total} fill={light} />
      <path d={d} fill={dark} />
    </svg>
  );
}

export default function TreeViewer({
  slug,
  destination,
  qrText,
  season,
  shareUrl,
  arUrl,
  brand,
  showBadge = true,
  variant = "page",
  transparent = false,
}: TreeViewerProps) {
  const isEmbed = variant === "embed";
  const theme = SEASONS[season] || SEASONS.summer;
  const accent = brand?.accent || theme.accentColor;
  const source = isEmbed ? "embed" : "page";

  const { matrix, size } = useMemo(() => generateQrMatrix(qrText), [qrText]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const flyToRef = useRef<(toQr: boolean) => void>(() => {});
  const pointerRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // Ref (bukan updater setState) agar efek samping tidak terpanggil dua kali di StrictMode
  const showQrRef = useRef(false);

  const [showQr, setShowQr] = useState(false);
  const [qrOverlay, setQrOverlay] = useState(false);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  // ---------------------------------------------------------------------------
  // Scene three.js
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const mobile =
      typeof navigator !== "undefined" &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = !mobile;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    stage.replaceChildren(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 500);
    camera.position.copy(ISO_POS);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(ISO_TARGET);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.2;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.5;
    // Di embed pada HP, jangan tangkap gesture sentuh → halaman host tetap bisa di-scroll
    const allowOrbit = !(isEmbed && mobile);
    controls.enabled = allowOrbit;
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xfff7ea, 1.8);
    sun.position.set(-20, 45, 25);
    if (renderer.shadowMap.enabled) {
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const sc = sun.shadow.camera;
      sc.left = -24;
      sc.right = 24;
      sc.top = 24;
      sc.bottom = -24;
      sc.near = 1;
      sc.far = 150;
      sun.shadow.bias = -0.0005;
    }
    scene.add(sun);

    const wind = createWindUniforms(reduceMotion ? 0.3 : WIND_ON);
    const windOn = wind.uStrength.value;
    const mesh = buildTreeMesh(generateVoxelTree(matrix, size, season), wind, {
      shadows: renderer.shadowMap.enabled,
    });
    scene.add(mesh);

    const resize = () => {
      const w = stage.clientWidth || 1;
      const h = stage.clientHeight || w;
      renderer.setSize(w, h);
      const aspect = w / h;
      const f = Math.max(24, 23 / aspect); // tetap muat di layar potret
      camera.left = -f * aspect;
      camera.right = f * aspect;
      camera.top = f;
      camera.bottom = -f;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // Transisi kamera pohon ⇄ QR
    type Flight = {
      t: number;
      toQr: boolean;
      fromPos: THREE.Vector3;
      fromTarget: THREE.Vector3;
      toPos: THREE.Vector3;
      toTarget: THREE.Vector3;
    };
    let flight: Flight | null = null;
    let windTarget = windOn;

    flyToRef.current = (toQr: boolean) => {
      flight = {
        t: 0,
        toQr,
        fromPos: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPos: toQr ? TOP_POS : ISO_POS,
        toTarget: toQr ? TOP_TARGET : ISO_TARGET,
      };
      controls.enabled = false;
      controls.autoRotate = false;
      windTarget = toQr ? 0 : windOn; // angin berhenti agar grid QR lurus
      if (!toQr) setQrOverlay(false);
    };

    // Jangan render saat tidak terlihat (hemat baterai, penting untuk embed)
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), {
      threshold: 0.01,
    });
    io.observe(stage);

    let frame = 0;
    let lastTime = performance.now();
    const startTime = performance.now();
    const loop = () => {
      frame = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      if (!visible || document.hidden) return;

      wind.uTime.value = (now - startTime) / 1000;
      wind.uStrength.value += (windTarget - wind.uStrength.value) * Math.min(1, dt * 4);

      if (flight) {
        flight.t = Math.min(1, flight.t + dt / 0.9);
        const e = easeInOutCubic(flight.t);
        camera.position.lerpVectors(flight.fromPos, flight.toPos, e);
        controls.target.lerpVectors(flight.fromTarget, flight.toTarget, e);
        camera.lookAt(controls.target);
        if (flight.t >= 1) {
          const toQr = flight.toQr;
          flight = null;
          if (toQr) setQrOverlay(true);
          else {
            controls.enabled = allowOrbit;
            controls.autoRotate = !reduceMotion;
          }
        }
      } else if (controls.enabled) {
        controls.update();
      }
      renderer.render(scene, camera);
    };
    loop();
    setReady(true);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      controls.dispose();
      disposeTreeMesh(mesh);
      renderer.dispose();
      renderer.forceContextLoss();
      stage.replaceChildren();
      flyToRef.current = () => {};
      showQrRef.current = false;
      setShowQr(false);
      setQrOverlay(false);
    };
  }, [matrix, size, season, isEmbed]);

  // ---------------------------------------------------------------------------
  // Analitik view + embed: transparansi & auto-resize iframe
  // ---------------------------------------------------------------------------
  useEffect(() => {
    track(slug, isEmbed ? "embed_view" : "share_view", source);
  }, [slug, isEmbed, source]);

  useEffect(() => {
    if (!transparent) return;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
  }, [transparent]);

  useEffect(() => {
    if (!isEmbed || window.parent === window || !rootRef.current) return;
    const el = rootRef.current;
    const post = () =>
      window.parent.postMessage(
        {
          type: "official-id:resize",
          slug,
          height: Math.ceil(el.getBoundingClientRect().height),
        },
        "*"
      );
    const ro = new ResizeObserver(post);
    ro.observe(el);
    post();
    return () => ro.disconnect();
  }, [isEmbed, slug]);

  // ---------------------------------------------------------------------------
  // Aksi
  // ---------------------------------------------------------------------------
  const toggleQr = useCallback(() => {
    const next = !showQrRef.current;
    showQrRef.current = next;
    setShowQr(next);
    flyToRef.current(next);
    if (next) track(slug, "qr_toggle", source);
  }, [slug, source]);

  const handleShare = async () => {
    track(slug, "share_click", source);
    try {
      if (navigator.share) {
        await navigator.share({ title: brand?.name ?? undefined, url: shareUrl });
        return;
      }
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Salin link ini:", shareUrl);
    }
  };

  const linkTarget = isEmbed ? "_blank" : "_self";

  return (
    <div
      ref={rootRef}
      className={`flex w-full flex-col items-center ${isEmbed ? "pb-3" : "min-h-dvh pb-8"}`}
      style={{ background: transparent ? "transparent" : theme.bgColor }}
    >
      {/* Header whitelabel: identitas brand pengguna, bukan official.id */}
      {!isEmbed && (brand?.name || brand?.logoUrl) && (
        <header className="flex w-full max-w-5xl items-center gap-3 px-5 pt-6">
          {brand?.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logoUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover shadow-sm"
            />
          )}
          {brand?.name && (
            <span className="text-lg font-semibold text-stone-800">{brand.name}</span>
          )}
        </header>
      )}

      <div
        className={`relative aspect-square w-full ${
          isEmbed ? "max-w-[480px]" : "max-w-[720px]"
        }`}
      >
        <div
          ref={stageRef}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          onPointerDown={(e) =>
            (pointerRef.current = { x: e.clientX, y: e.clientY, t: performance.now() })
          }
          onPointerUp={(e) => {
            const p = pointerRef.current;
            pointerRef.current = null;
            if (!p) return;
            const isTap =
              Math.hypot(e.clientX - p.x, e.clientY - p.y) < 6 &&
              performance.now() - p.t < 350;
            if (isTap) toggleQr();
          }}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-stone-300 border-t-transparent" />
          </div>
        )}

        {/* QR 2D tajam — muncul setelah kamera tiba di posisi atas */}
        <button
          type="button"
          onClick={toggleQr}
          aria-label="Kembali ke tampilan pohon"
          className={`absolute inset-[13%] rounded-2xl p-3 shadow-xl transition duration-500 ${
            qrOverlay ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
          }`}
          style={{ background: theme.paperColor }}
        >
          <QrSvg matrix={matrix} size={size} dark={theme.qrDark[0]} light={theme.paperColor} />
        </button>
      </div>

      <p className="rounded-full border border-stone-200 bg-white/70 px-4 py-1.5 text-xs text-stone-500">
        {showQr ? "Ketuk QR untuk kembali ke pohon" : "Ketuk pohon untuk melihat QR"}
      </p>

      <div className="mt-4 flex w-full max-w-md gap-3 px-5">
        <a
          href={destination}
          target={linkTarget}
          rel="noopener noreferrer"
          onClick={() => track(slug, "visit_click", source)}
          className="flex flex-1 items-center justify-center rounded-2xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 active:scale-[0.98]"
        >
          Kunjungi link
        </a>
        <a
          href={`${arUrl}?from=${source}`}
          target={isEmbed ? "_blank" : "_self"}
          rel="noopener"
          onClick={() => track(slug, "ar_click", source)}
          className="flex flex-1 items-center justify-center rounded-2xl py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:scale-[0.98]"
          style={{ background: accent }}
        >
          Lihat AR
        </a>
      </div>

      <button
        type="button"
        onClick={handleShare}
        className="mt-3 rounded-full px-5 py-2 text-xs font-medium text-stone-600 transition hover:bg-black/5"
      >
        {copied ? "Link tersalin ✓" : "Bagikan"}
      </button>

      {showBadge && (
        <a
          href={BASE_URL}
          target="_blank"
          rel="noopener"
          className="mt-4 text-[11px] text-stone-400 transition hover:text-stone-600"
        >
          Dibuat dengan official.id
        </a>
      )}
    </div>
  );
}
