"use client";

import React, { useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import QRCode from "qrcode";
import {
  SeasonType,
  SEASONS,
  generateVoxelTree,
  generateVoxelFlower,
  generateVoxelBuilding,
  generateVoxelHero,
  generateQrMatrix,
  exportVoxelsToJson,
  exportVoxelsToCsv,
} from "@/lib/voxel-tree-generator";
import { ambientAudio } from "@/lib/ambient-audio";

function downloadBlob(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 2000);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  try {
    const parts = dataUrl.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: mime });
    downloadBlob(blob, filename);
  } catch {
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 2000);
  }
}
import confetti from "canvas-confetti";
import {
  ShareNodes,
  VolumeUp,
  VolumeMute,
  InfoCircle,
  Download,
  FileCopyAlt,
  Check,
  CubesStacked,
  Eye,
  WandMagicSparkles,
  ArrowUpRightFromSquare,
  Layers,
  CameraPhoto,
  Close,
  Globe,
  Tag,
  Refresh,
  QrCode,
  Upload,
  TrashBin,
  FileImage,
  Lightbulb,
  Image,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  ExclamationCircle,
  Printer,
  Palette,
  FileCode,
  FileCsv,
  Users,
  Messages,
  Lock,
} from "flowbite-react-icons/outline";

import {
  drawLogoOnQrCanvas,
  optimizeLogoFile,
  LogoShape,
} from "@/lib/qr-logo";

import ThreeVoxelTreeScene from "@/components/qr/ThreeVoxelTreeScene";
import WebARModal from "@/components/qr/WebARModal";

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
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (matrix[r][c]) {
          p += `M${c + qz} ${r + qz}h1v1h-1z`;
        }
      }
    }
    return p;
  }, [matrix, size]);
  return (
    <svg
      viewBox={`0 0 ${total} ${total}`}
      shapeRendering="crispEdges"
      className="h-full w-full select-none"
      role="img"
      aria-label="QR code"
    >
      <rect width={total} height={total} fill={light} />
      <path d={d} fill={dark} />
    </svg>
  );
}

export default function TreeICQRStudio() {
  const [destinationUrl, setDestinationUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [customSlugInput, setCustomSlugInput] = useState("");
  const [slugCheckStatus, setSlugCheckStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [slugError, setSlugError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string>("");
  const [logoFileName, setLogoFileName] = useState<string>("");
  const [logoShape, setLogoShape] = useState<LogoShape>("circle");
  const [logoSizePercent, setLogoSizePercent] = useState<number>(19);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [logoError, setLogoError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeLogo = logoDataUrl || brandLogoUrl.trim();

  const handleLogoFileUpload = async (file: File) => {
    if (!file) return;
    setLogoError("");
    setIsProcessingLogo(true);
    try {
      const result = await optimizeLogoFile(file, 256);
      setLogoDataUrl(result.dataUrl);
      setLogoFileName(result.name);
      // Jika tab brand config belum dibuka, buka agar pengguna melihat statusnya
      setShowBrandConfig(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process logo file";
      setLogoError(msg);
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoDataUrl("");
    setBrandLogoUrl("");
    setLogoFileName("");
    setLogoError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [showBrandConfig, setShowBrandConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [shortlinkBase, setShortlinkBase] = useState("https://official.id");
  const [season, setSeason] = useState<SeasonType>("spring");
  const isSeasonLocked = Boolean(slug);

  const handleResetForm = () => {
    setSlug("");
    setDestinationUrl("");
    setCustomSlugInput("");
    setSlugCheckStatus("idle");
    setSlugError("");
    setErrorMessage("");
    setSaveStatus("idle");
  };
  const [viewMode, setViewMode] = useState<"3d" | "qr">("3d");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showARModal, setShowARModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [honeypotVal, setHoneypotVal] = useState("");
  const formRenderTimeRef = useRef<number>(Date.now());

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setShortlinkBase(window.location.origin);
    }
  }, []);

  // 1. Teks yang benar-benar dicetak di QR code fisik: shortlink menuju mode scan AR /[slug]/q
  // Sebelum diisi oleh pengguna, default QR Code mengarah ke official.id
  const activeSlug = slug || customSlugInput.trim().toLowerCase();
  const qrText = slug ? `${shortlinkBase}/${slug}/q` : "https://official.id";
  const qrMatrixData = useMemo(() => generateQrMatrix(qrText), [qrText]);
  // 2. Link share untuk dibagikan di medsos / bio: /[slug]
  const shareLink = slug
    ? `${shortlinkBase}/${slug}`
    : activeSlug
    ? `${shortlinkBase}/${activeSlug}`
    : `${shortlinkBase || "https://official.id"}`;
  // 3. Snippet embed untuk website / iframe:
  const embedSnippet = slug
    ? `<div class="official-id-tree" data-slug="${slug}"></div>\n<script src="${shortlinkBase}/embed.js" async></script>`
    : `<div class="official-id-tree" data-url="${shortlinkBase || "https://official.id"}"></div>\n<script src="${shortlinkBase}/embed.js" async></script>`;

  // Real-time debounce check untuk ketersediaan custom slug
  React.useEffect(() => {
    const raw = customSlugInput.trim().toLowerCase();
    if (!raw) {
      setSlugCheckStatus("idle");
      setSlugError("");
      return;
    }

    if (raw === slug) {
      setSlugCheckStatus("available");
      setSlugError("");
      return;
    }

    if (raw.length < 3 || raw.length > 20 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(raw)) {
      setSlugCheckStatus("invalid");
      setSlugError("3–20 chars, lowercase & numbers");
      return;
    }

    setSlugCheckStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/links/check?slug=${encodeURIComponent(raw)}`);
        const data = await res.json();
        if (data.available) {
          setSlugCheckStatus("available");
          setSlugError("");
        } else {
          setSlugCheckStatus("taken");
          setSlugError(data.error || "Slug already taken");
        }
      } catch {
        setSlugCheckStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customSlugInput, slug]);

  // Simpan / update link ke Supabase & fail-safe cache
  const handleSaveLink = React.useCallback(
    async (overrideSlug?: string, overrideSeason?: SeasonType): Promise<string | null> => {
      let dest = destinationUrl.trim();
      if (!dest) {
        setErrorMessage("Please enter a destination URL first!");
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
          setErrorMessage("");
        }, 3000);
        return null;
      }

      if (slugCheckStatus === "taken") {
        setErrorMessage("Slug already taken! Please change the slug or click Random");
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
          setErrorMessage("");
        }, 3000);
        return null;
      }

      if (slugCheckStatus === "invalid") {
        setErrorMessage(slugError || "Invalid slug format (3–20 alphanumeric chars)");
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
          setErrorMessage("");
        }, 3000);
        return null;
      }

      // Auto-prefix https:// jika pengguna belum menyertakan skema
      if (!/^https?:\/\//i.test(dest)) {
        dest = `https://${dest}`;
        setDestinationUrl(dest);
      }

      setSaveStatus("saving");
      setErrorMessage("");
      const chosenSlug = (overrideSlug !== undefined ? overrideSlug : customSlugInput).trim().toLowerCase();
      const chosenSeason = overrideSeason || season;

      try {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: dest,
            season: chosenSeason,
            slug: chosenSlug || undefined,
            brand: (brandName || activeLogo) ? { name: brandName || null, logoUrl: activeLogo || null } : undefined,
            overwrite: chosenSlug && slug ? chosenSlug === slug : false,
            _hp_company: honeypotVal || undefined,
            _render_t: formRenderTimeRef.current,
          }),
        });
        const data = await res.json();
        if (data.ok && data.slug) {
          setSlug(data.slug);
          setCustomSlugInput(data.slug);
          setSlugCheckStatus("available");
          setSaveStatus("saved");
          setErrorMessage("");
          try {
            confetti({
              particleCount: 60,
              spread: 65,
              origin: { y: 0.65 },
            });
          } catch {
            // ignore confetti fallback
          }
          // Beralih otomatis ke QR view agar pengguna langsung melihat QR code yang dihasilkan
          setViewMode("qr");
          setTimeout(() => setSaveStatus("idle"), 3500);
          return data.slug as string;
        } else {
          setErrorMessage(data.error || "Failed to save link");
          setSaveStatus("error");
          setTimeout(() => {
            setSaveStatus("idle");
            setErrorMessage("");
          }, 3500);
          return null;
        }
      } catch {
        setErrorMessage("Failed to connect to server. Please try again.");
        setSaveStatus("error");
        setTimeout(() => {
          setSaveStatus("idle");
          setErrorMessage("");
        }, 3500);
        return null;
      }
    },
    [destinationUrl, customSlugInput, season, slug, brandName, brandLogoUrl, logoDataUrl, activeLogo, honeypotVal, slugCheckStatus, slugError]
  );

  // Buat kode acak 6 digit baru
  const handleGenerateRandomSlug = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCustomSlugInput(rand);
    setSlugCheckStatus("available");
    setSlugError("");
    setErrorMessage("");
    if (saveStatus === "error") {
      setSaveStatus("idle");
    }
  };

  // Trakteer Modal Opener (Interactive embed popup & fallback)
  const openTrakteerModal = () => {
    const modalUrl = "https://trakteer.id/v1/officialid/tip/embed/modal";
    let overlay = document.getElementById("trakteer-overlay-modal");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.setAttribute("id", "trakteer-overlay-modal");
      overlay.style.cssText =
        "position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);padding:16px;";

      const wrapper = document.createElement("div");
      wrapper.style.cssText =
        "position:relative;width:100%;max-width:440px;height:620px;max-height:92vh;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);background:#fff;";

      const closeBtn = document.createElement("button");
      closeBtn.innerHTML = '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>';
      closeBtn.style.cssText =
        "position:absolute;top:12px;right:12px;width:32px;height:32px;border-radius:50%;background:#f1f5f9;color:#334155;border:none;cursor:pointer;font-weight:bold;z-index:20;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.15);";
      closeBtn.onclick = () => {
        if (overlay) overlay.style.display = "none";
      };

      const iframe = document.createElement("iframe");
      iframe.src = `${modalUrl}?embedId=0&ref=${encodeURIComponent(
        typeof window !== "undefined" ? window.location.href : ""
      )}`;
      iframe.style.cssText = "width:100%;height:100%;border:0;";

      wrapper.appendChild(closeBtn);
      wrapper.appendChild(iframe);
      overlay.appendChild(wrapper);
      document.body.appendChild(overlay);

      window.addEventListener("message", (e) => {
        if (e.data && e.data.type === "embed.modalClosed") {
          setTimeout(() => {
            if (overlay) overlay.style.display = "none";
          }, 200);
        }
      });
    } else {
      overlay.style.display = "flex";
    }
  };

  const captureFuncRef = useRef<(() => string | null) | null>(null);
  const voxelCountRef = useRef<number>(3200);

  const currentTheme = SEASONS[season];

  const handleAudioToggle = () => {
    const active = ambientAudio.toggle();
    setIsPlayingAudio(active);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My 3D Voxel Magic Tree QR Code — official.id",
          text: `Check out this 3D Voxel Magic Tree: ${shareLink}`,
          url: shareLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };
  const handleToggleViewMode = async () => {
    if (viewMode === "3d") {
      // Jika pengguna sudah mengisi URL tujuan tapi belum disimpan, simpan otomatis agar QR on-screen langsung aktif & valid!
      if (!slug && destinationUrl.trim()) {
        await handleSaveLink();
      }
      setViewMode("qr");
    } else {
      setViewMode("3d");
    }
  };

  const handleDownloadPrintQr = async () => {
    try {
      let activeQrText = qrText;
      let activeExportSlug = slug;

      // Jika pengguna sudah mengisi URL tujuan tapi belum tersimpan, otomatis simpan ke server!
      if (!slug && destinationUrl.trim()) {
        const newSlug = await handleSaveLink();
        if (newSlug) {
          activeExportSlug = newSlug;
          activeQrText = `${shortlinkBase}/${newSlug}/q`;
        }
      }

      const canvas = document.createElement("canvas");
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = currentTheme.paperColor || "#ffffff";
        ctx.fillRect(0, 0, size, size);
      }

      await QRCode.toCanvas(canvas, activeQrText, {
        width: 1024,
        margin: 3,
        errorCorrectionLevel: "H",
        color: {
          dark: currentTheme.qrDark[0] || "#111827",
          light: currentTheme.paperColor || "#ffffff",
        },
      });

      // Sematkan logo PNG di tengah-tengah QR Code jika ada logo aktif
      if (activeLogo) {
        await drawLogoOnQrCanvas(canvas, activeLogo, {
          shape: logoShape,
          sizeRatio: logoSizePercent / 100,
          bgColor: "#ffffff",
        });
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, `official-id-${activeExportSlug || "custom"}-qrcode.png`);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#10b981", "#059669", "#34d399", "#fbbf24"],
          });
        } catch {
          // ignore
        }
      }, "image/png");
    } catch (e) {
      console.error("Gagal membuat print QR PNG:", e);
    }
  };

  const handleDownloadSnapshot = () => {
    if (captureFuncRef.current) {
      const dataUrl = captureFuncRef.current();
      if (dataUrl) {
        downloadDataUrl(dataUrl, `official-id-magic-tree-${slug}-${season}-${viewMode}.png`);
      }
    }
  };

  const handleExportGoxelJson = () => {
    const { matrix, size } = generateQrMatrix(qrText);
    const voxels = season === "flower"
      ? generateVoxelFlower(matrix, size, season)
      : season === "building"
      ? generateVoxelBuilding(matrix, size, season)
      : season === "hero"
      ? generateVoxelHero(matrix, size, season)
      : generateVoxelTree(matrix, size, season);

    const json = exportVoxelsToJson(voxels, {
      title: "official.id 3D Voxel Magic Tree QR",
      url: qrText,
    });

    const blob = new Blob([json], { type: "application/json" });
    downloadBlob(blob, `official-id-voxel-tree-${slug}.json`);
  };

  const handleExportGoxelCsv = () => {
    const { matrix, size } = generateQrMatrix(qrText);
    const voxels = season === "flower"
      ? generateVoxelFlower(matrix, size, season)
      : season === "building"
      ? generateVoxelBuilding(matrix, size, season)
      : season === "hero"
      ? generateVoxelHero(matrix, size, season)
      : generateVoxelTree(matrix, size, season);

    const csv = exportVoxelsToCsv(voxels);
    const blob = new Blob([csv], { type: "text/csv" });
    downloadBlob(blob, `official-id-voxel-tree-${slug}.csv`);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between transition-colors duration-700 font-sans selection:bg-stone-300 selection:text-stone-900"
      style={{ backgroundColor: currentTheme.bgColor }}
    >
      {/* Top Navbar Header (Matching tree.icqr.com clean style) */}
      <header className="w-full max-w-5xl mx-auto px-6 pt-6 flex items-center justify-between z-30">
        {/* Dot Matrix Style Brand Logo */}
        <div className="flex items-center gap-1.5 text-stone-800 font-mono text-xl sm:text-2xl font-black tracking-widest uppercase">
          <span className="text-stone-400 font-normal">[</span>
          <span>official.id</span>
          <span className="text-stone-400 font-normal">]</span>
        </div>

        {/* Top Right Action: Info Modal */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center shadow-sm transition active:scale-95 border border-stone-200/80"
            title="About official.id 3D Voxel Tree"
          >
            <InfoCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Studio Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center relative px-4 py-2 z-10">
        {/* 3D Scene Viewport Container - STRICT 1:1 SQUARE */}
        <div className="w-full max-w-[min(560px,58vh)] aspect-square relative rounded-3xl overflow-hidden shadow-2xl shadow-stone-900/10 border border-stone-300/40 mx-auto">
          {isMounted && (
            <ThreeVoxelTreeScene
              url={destinationUrl}
              qrText={qrText}
              logoUrl={activeLogo}
              logoShape={logoShape}
              logoSizePercent={logoSizePercent}
              season={season}
              viewMode={viewMode}
              onViewModeToggle={handleToggleViewMode}
              onSceneReady={({ captureImage, getVoxelCount }) => {
                captureFuncRef.current = captureImage;
                voxelCountRef.current = getVoxelCount();
              }}
            />
          )}

          {/* QR 2D Vector Overlay - 100% INSTANTLY SCANNABLE BY ALL SMARTPHONES & SCANNERS */}
          <div
            onClick={() => setViewMode("3d")}
            className={`absolute inset-0 z-20 flex items-center justify-center p-5 sm:p-7 transition-all duration-300 cursor-pointer ${
              viewMode === "qr"
                ? "opacity-100 scale-100 pointer-events-auto"
                : "opacity-0 scale-95 pointer-events-none"
            }`}
            style={{ backgroundColor: currentTheme.paperColor }}
            title="Click to switch back to 3D model"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              <QrSvg
                matrix={qrMatrixData.matrix}
                size={qrMatrixData.size}
                dark={currentTheme.qrDark[0]}
                light={currentTheme.paperColor}
              />

              {/* Logo in QR Code Center (Safe ratio, True Circle) */}
              {activeLogo && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`bg-white p-1.5 sm:p-2 shadow-xl border border-stone-200/90 flex items-center justify-center aspect-square shrink-0 ${
                      logoShape === "circle"
                        ? "rounded-full"
                        : logoShape === "square"
                        ? "rounded-md"
                        : "rounded-2xl"
                    }`}
                    style={{
                      width: `${logoSizePercent}%`,
                      height: `${logoSizePercent}%`,
                      aspectRatio: "1 / 1",
                    }}
                  >
                    <img
                      src={activeLogo}
                      alt="QR Center Logo"
                      className={`w-full h-full object-contain pointer-events-none select-none ${
                        logoShape === "circle" ? "rounded-full" : ""
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hint to switch to 3D */}
            <div className="absolute bottom-3 right-3 pointer-events-none flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-stone-500 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-stone-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tap to view 3D
            </div>
          </div>
        </div>
      </main>

      {/* Primary Interaction Pill Buttons (Matching tree.icqr.com + Mode AR + Direct QR Download) */}
      <div className="flex flex-wrap items-center justify-center -mt-1 mb-2 z-30 gap-2.5">
        <button
          onClick={handleToggleViewMode}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-stone-800 text-xs sm:text-sm font-semibold tracking-tight shadow-md hover:shadow-lg border border-stone-200/90 backdrop-blur-md transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            {viewMode === "3d"
              ? "Tap the tree to see QR code"
              : "Tap to see 3D model"}
          </span>
        </button>

        <button
          onClick={() => setShowARModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold tracking-tight shadow-md hover:shadow-lg border border-emerald-500/80 backdrop-blur-md transition-all active:scale-95"
          title="View Tree in Your Real Room (AR Mode)"
        >
          <CameraPhoto className="w-4 h-4" />
          <span>AR Mode</span>
        </button>

        <button
          onClick={handleDownloadPrintQr}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold tracking-tight shadow-md hover:shadow-lg border border-stone-800 backdrop-blur-md transition-all active:scale-95"
          title="Download Scannable QR Code (PNG 1024x1024)"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download QR Code</span>
        </button>
      </div>

      {/* Bottom Controls Bar & Link Studio */}
      <footer className="w-full max-w-xl mx-auto px-4 pb-8 flex flex-col items-center gap-3 z-30">
        {/* Semantic Headings for Google SEO */}
        <h1 className="sr-only">
          official.id — QR CODE ANIMATE, ANIMASI QR CODE, QR CODE GENERATOR INOVATIVE
        </h1>
        <h2 className="sr-only">
          Innovative 3D Animated QR Code Generator & WebAR Interactive Experience
        </h2>

        {/* Creation & Customization Card */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveLink();
          }}
          className="w-full bg-white/95 rounded-2xl shadow-md border border-stone-200/90 p-3 sm:p-4 backdrop-blur-md flex flex-col gap-3 relative"
        >
          {/* Honeypot field (hidden from human users, traps automated spam bots) */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}>
            <input
              type="text"
              name="_hp_company"
              value={honeypotVal}
              onChange={(e) => setHoneypotVal(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          {/* 3D Theme & Animation Variant (Located above Destination URL input) */}
          <div className="flex flex-col gap-1.5 pb-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-stone-500" />
                <span>3D Theme &amp; Animation Variant</span>
              </label>
              {isSeasonLocked && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/90 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Locked</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 underline transition"
                    title="Create a new link and unlock theme selection"
                  >
                    Create New Link
                  </button>
                </div>
              )}
            </div>

            {/* Grid of 6 Theme Variant Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 w-full text-xs font-medium">
              <button
                type="button"
                disabled={isSeasonLocked}
                onClick={() => {
                  if (isSeasonLocked) return;
                  setSeason("summer");
                }}
                className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl transition border text-center ${
                  season === "summer"
                    ? "bg-[#EFE8DA] text-stone-900 border-stone-400 font-bold shadow-sm ring-2 ring-stone-400/40"
                    : isSeasonLocked
                    ? "opacity-35 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200 pointer-events-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200/80 active:scale-[0.98]"
                }`}
                title={isSeasonLocked ? "Theme is locked for saved link" : "Select Summer Green theme"}
              >
                <span>🌳 Summer Green</span>
              </button>

              <button
                type="button"
                disabled={isSeasonLocked}
                onClick={() => {
                  if (isSeasonLocked) return;
                  setSeason("spring");
                }}
                className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl transition border text-center ${
                  season === "spring"
                    ? "bg-pink-50 text-pink-950 border-pink-300 font-bold shadow-sm ring-2 ring-pink-400/40"
                    : isSeasonLocked
                    ? "opacity-35 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200 pointer-events-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200/80 active:scale-[0.98]"
                }`}
                title={isSeasonLocked ? "Theme is locked for saved link" : "Select Sakura Spring theme"}
              >
                <span>🌸 Sakura Spring</span>
              </button>

              <button
                type="button"
                disabled={isSeasonLocked}
                onClick={() => {
                  if (isSeasonLocked) return;
                  setSeason("autumn");
                }}
                className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl transition border text-center ${
                  season === "autumn"
                    ? "bg-amber-50 text-amber-950 border-amber-300 font-bold shadow-sm ring-2 ring-amber-400/40"
                    : isSeasonLocked
                    ? "opacity-35 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200 pointer-events-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200/80 active:scale-[0.98]"
                }`}
                title={isSeasonLocked ? "Theme is locked for saved link" : "Select Golden Autumn theme"}
              >
                <span>🍂 Golden Autumn</span>
              </button>

              <button
                type="button"
                disabled={isSeasonLocked}
                onClick={() => {
                  if (isSeasonLocked) return;
                  setSeason("flower");
                }}
                className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl transition border text-center ${
                  season === "flower"
                    ? "bg-rose-50 text-rose-950 border-rose-300 font-bold shadow-sm ring-2 ring-rose-400/40"
                    : isSeasonLocked
                    ? "opacity-35 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200 pointer-events-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200/80 active:scale-[0.98]"
                }`}
                title={isSeasonLocked ? "Theme is locked for saved link" : "Select Patrakomala Bloom theme"}
              >
                <span>🌺 Patrakomala</span>
              </button>

              <button
                type="button"
                disabled={isSeasonLocked}
                onClick={() => {
                  if (isSeasonLocked) return;
                  setSeason("building");
                }}
                className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl transition border text-center ${
                  season === "building"
                    ? "bg-slate-100 text-slate-950 border-slate-400 font-bold shadow-sm ring-2 ring-red-500/40"
                    : isSeasonLocked
                    ? "opacity-35 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200 pointer-events-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200/80 active:scale-[0.98]"
                }`}
                title={isSeasonLocked ? "Theme is locked for saved link" : "Select Heritage Landmark theme"}
              >
                <span>🏛️ Heritage Landmark</span>
              </button>

              <button
                type="button"
                disabled={isSeasonLocked}
                onClick={() => {
                  if (isSeasonLocked) return;
                  setSeason("hero");
                }}
                className={`flex items-center justify-center gap-1 px-2.5 py-2 rounded-xl transition border text-center ${
                  season === "hero"
                    ? "bg-amber-100/80 text-amber-950 border-amber-400 font-bold shadow-sm ring-2 ring-amber-400/50"
                    : isSeasonLocked
                    ? "opacity-35 cursor-not-allowed bg-stone-50 text-stone-400 border-stone-200 pointer-events-none"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50 border-stone-200/80 active:scale-[0.98]"
                }`}
                title={isSeasonLocked ? "Theme is locked for saved link" : "Select Mythic Hero theme"}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Mythic Hero</span>
              </button>
            </div>
            {isSeasonLocked && (
              <p className="text-[10px] text-stone-400 italic">
                * Theme variation and 3D animation are locked to match your shortlink ({slug}).
              </p>
            )}
          </div>

          {/* Row 1: Destination URL Input */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-stone-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-500" />
                <span>Destination URL</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                (Where the QR/shortlink will redirect)
              </span>
            </label>
            <div className="flex items-center bg-stone-50/80 rounded-xl border border-stone-200 px-3 py-2.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveLink();
                  }
                }}
                placeholder="https://your-website.com..."
                className="w-full bg-transparent text-stone-800 text-xs sm:text-sm font-medium outline-none placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Row 2: Custom Slug Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-500" />
                <span>Custom Slug / Shortlink</span>
              </label>
              <div className="flex items-center gap-1">
                {slugCheckStatus === "checking" && (
                  <span className="text-[10px] text-stone-500 font-medium animate-pulse">
                    Checking...
                  </span>
                )}
                {slugCheckStatus === "available" && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    <Check className="w-2.5 h-2.5" />
                    <span>Available</span>
                  </span>
                )}
                {slugCheckStatus === "taken" && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-semibold">
                    <Close className="w-2.5 h-2.5" />
                    <span>Already taken</span>
                  </span>
                )}
                {slugCheckStatus === "invalid" && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-semibold" title={slugError}>
                    {slugError}
                  </span>
                )}
                {slugCheckStatus === "idle" && (
                  <span className="text-[10px] text-stone-400 font-medium">
                    (Empty = auto-generated)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-stone-50/80 rounded-xl border border-stone-200 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
                <span className="text-xs text-stone-400 font-mono font-medium select-none mr-1">
                  official.id/
                </span>
                <input
                  type="text"
                  value={customSlugInput}
                  onChange={(e) => setCustomSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveLink();
                    }
                  }}
                  placeholder="your-custom-slug (optional)"
                  className="flex-1 bg-transparent text-stone-800 text-xs sm:text-sm font-mono font-semibold outline-none placeholder:text-stone-300"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateRandomSlug}
                className="px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition shrink-0 border border-stone-200"
                title="Generate random 6-character slug"
              >
                <Refresh className="w-3.5 h-3.5 text-stone-500" />
                <span>Random</span>
              </button>
            </div>
          </div>

          {/* Catatan UX Ramah: Peringatan Tautan Permanen (Bahasa Inggris Santai & Tepat Grammar) */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50/85 border border-amber-200/80 text-[11px] text-amber-900 leading-snug">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 select-none" />
            <p>
              <strong className="font-semibold text-amber-950">Heads up:</strong> Links can&apos;t be edited once created—make sure everything looks good before saving!
            </p>
          </div>

          {/* PNG Logo Center & Whitelabel Branding Settings */}
          <div className="border-t border-stone-100 pt-2">
            <button
              type="button"
              onClick={() => setShowBrandConfig(!showBrandConfig)}
              className="text-[11px] text-stone-600 hover:text-stone-900 flex items-center justify-between w-full font-semibold py-1 transition group"
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                <Image className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="text-stone-700 font-bold">QR Center Logo &amp; Branding</span>
                {activeLogo ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" />
                    <span>Logo Applied</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 font-normal">
                    (Optional)
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-stone-400 group-hover:text-stone-600 font-medium">
                {showBrandConfig ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Customize Logo</span>
                  </>
                )}
              </span>
            </button>

            {showBrandConfig && (
              <div className="mt-2.5 p-3 sm:p-4 bg-stone-50/90 rounded-2xl border border-stone-200/90 flex flex-col gap-3.5 animate-in fade-in duration-200 shadow-inner">
                {/* Short explanation of Level H QR error correction */}
                <div className="flex items-start gap-2 text-[10px] text-stone-500 bg-white/80 p-2.5 rounded-xl border border-stone-200/60 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 select-none mt-0.5" />
                  <p>
                    <strong className="text-stone-800 font-semibold">Level H QR Error Correction (30%):</strong>{" "}
                    The logo is centered in the QR code with a clean protective margin, ensuring the QR code remains 100% instantly scannable by all smartphone cameras.
                  </p>
                </div>

                {/* File Upload & Drag-and-Drop Dropzone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-stone-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-stone-500" />
                      <span>Upload Logo File (PNG / Image)</span>
                    </span>
                    {activeLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition"
                      >
                        <TrashBin className="w-3 h-3" />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/webp,image/jpeg,image/svg+xml"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleLogoFileUpload(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {activeLogo ? (
                    /* Active Logo Preview Card */
                    <div className="p-3 bg-white rounded-xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div
                          className={`w-14 h-14 bg-stone-50 border border-stone-200 flex items-center justify-center p-1.5 shadow-xs shrink-0 ${
                            logoShape === "circle"
                              ? "rounded-full"
                              : logoShape === "square"
                              ? "rounded-md"
                              : "rounded-xl"
                          }`}
                        >
                          <img
                            src={activeLogo}
                            alt="Preview Logo"
                            className="w-full h-full object-contain pointer-events-none select-none"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-stone-800 truncate">
                            {logoFileName || (brandLogoUrl ? "External Logo" : "PNG Logo")}
                          </p>
                          <p className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active on QR Code center
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition flex items-center gap-1"
                        >
                          <FileImage className="w-3 h-3" />
                          <span>Change File</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-semibold transition flex items-center gap-1 border border-rose-200/60"
                        >
                          <TrashBin className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Dropzone when no logo uploaded */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        if (e.dataTransfer.files?.[0]) {
                          handleLogoFileUpload(e.dataTransfer.files[0]);
                        }
                      }}
                      className={`cursor-pointer border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all bg-white hover:bg-stone-50 ${
                        isDragOver
                          ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
                          : "border-stone-300 hover:border-stone-400"
                      }`}
                    >
                      {isProcessingLogo ? (
                        <div className="flex items-center gap-2 text-stone-600 text-xs font-medium py-2">
                          <Refresh className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>Processing and optimizing image...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 shadow-2xs">
                            <Upload className="w-5 h-5" />
                          </div>
                          <p className="text-xs font-bold text-stone-800">
                            Click to upload PNG logo or drag file here
                          </p>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            PNG format (transparent recommended), WebP, JPG, or SVG (Max 2MB)
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {logoError && (
                    <p className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-medium">
                      <ExclamationCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{logoError}</span>
                    </p>
                  )}
                </div>

                {/* Logo Style Options (Only shown when an active logo exists) */}
                {activeLogo && (
                  <div className="flex flex-col gap-3.5 pt-2 border-t border-stone-200/60">
                    {/* Badge Protection Shape */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-700">
                          Logo Badge Shape
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Circle Recommended
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setLogoShape("circle")}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 border ${
                            logoShape === "circle"
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-current shrink-0" />
                          <span>Circle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoShape("rounded")}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 border ${
                            logoShape === "rounded"
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-xs border-2 border-current shrink-0" />
                          <span>Rounded</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoShape("square")}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 border ${
                            logoShape === "square"
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-none border-2 border-current shrink-0" />
                          <span>Square</span>
                        </button>
                      </div>
                    </div>

                    {/* Logo Size Proportion */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-700">
                          Size Proportion on QR (Diameter)
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {logoSizePercent}% • 100% Scannable
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setLogoSizePercent(19)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border ${
                            logoSizePercent === 19
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span>Standard (19%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoSizePercent(22)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border ${
                            logoSizePercent === 22
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span>Ideal (22%)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoSizePercent(25)}
                          className={`py-2 px-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border ${
                            logoSizePercent === 25
                              ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                              : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"
                          }`}
                        >
                          <span>Max (25%)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Alternative Input: External Logo URL & Brand Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-stone-200/60">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-stone-500 font-semibold">
                      Brand / Business Name
                    </span>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Example: Kailoka Coffee"
                      className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-stone-500 font-semibold">
                      Or External Logo URL (HTTPS)
                    </span>
                    <input
                      type="url"
                      value={brandLogoUrl}
                      onChange={(e) => {
                        setBrandLogoUrl(e.target.value);
                        if (e.target.value.trim() && !logoDataUrl) {
                          setLogoFileName("External Logo");
                        }
                      }}
                      placeholder="https://example.com/logo.png"
                      className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button: Save & Generate QR Code */}
          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] ${
              saveStatus === "saved"
                ? "bg-emerald-600 hover:bg-emerald-500"
                : saveStatus === "saving"
                ? "bg-stone-400 cursor-wait"
                : saveStatus === "error"
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {saveStatus === "saving" ? (
              <>
                <Refresh className="w-4 h-4 animate-spin" />
                <span>Saving &amp; Generating QR Code...</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Saved! QR Code Created Successfully</span>
              </>
            ) : saveStatus === "error" ? (
              <span>{errorMessage || "Please enter a destination URL first!"}</span>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                <span>Save &amp; Generate QR Code</span>
              </>
            )}
          </button>

          {/* Explicit Error Notification */}
          {saveStatus === "error" && errorMessage && (
            <p className="inline-flex items-center justify-center gap-1.5 text-[11px] text-rose-600 font-semibold text-center -mt-1 w-full">
              <ExclamationCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}

          {/* Success Notification */}
          {saveStatus === "saved" && slug && (
            <p className="inline-flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-semibold text-center -mt-1 w-full">
              <WandMagicSparkles className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>
                QR Code &amp; Shortlink active: <span className="font-mono font-bold">official.id/{slug}</span>
              </span>
            </p>
          )}
        </form>

        {/* Dynamic 3-Channel URLs Capsule (The 3 Faces of official.id) */}
        <div className="w-full flex flex-col gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 text-xs shadow-md">
          {/* Face 1: Physical Print QR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-stone-100">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-stone-800 font-bold text-[11px]">1. Physical Print QR:</span>
                  <span className="font-mono text-emerald-800 font-bold text-[11px] truncate">
                    {qrText}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">
                  Embedded in physical QR. Smartphone camera scans $\rightarrow$ WebAR 10s $\rightarrow$ auto-redirects to destination.
                </p>
                {destinationUrl.trim() && (
                  <p className="text-[10px] text-stone-600 truncate mt-0.5">
                    <span className="text-stone-400">Redirect target:</span>{" "}
                    <span className="font-mono text-emerald-800 font-semibold">{destinationUrl}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <a
                href={slug ? `/${slug}/q` : `/ar`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                title="Open simulated WebAR poster scan"
              >
                <span>Test AR</span>
                <ArrowUpRightFromSquare className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleDownloadPrintQr}
                className="px-2 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition flex items-center gap-1 border border-stone-200"
                title="Download print-ready QR Code (high-resolution PNG)"
              >
                <Download className="w-3 h-3" />
                <span>PNG</span>
              </button>
            </div>
          </div>

          {/* Face 2: Social Share Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-stone-100">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-stone-800 font-bold text-[11px]">2. Social Share Link:</span>
                  <span className="font-mono text-sky-800 font-bold text-[11px] truncate">
                    {shareLink}
                  </span>
                  {!slug && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                      not saved yet
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-stone-500">
                  Share via WhatsApp / social bio. Displays an interactive white-label 3D voxel tree.
                </p>
                {destinationUrl.trim() && (
                  <p className="text-[10px] text-stone-600 truncate mt-0.5">
                    <span className="text-stone-400">Redirects to:</span>{" "}
                    <span className="font-mono text-sky-800 font-semibold">{destinationUrl}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={async () => {
                  if (slug) {
                    window.open(`/${slug}`, "_blank");
                  } else {
                    if (!destinationUrl.trim()) {
                      setErrorMessage("Please enter a Destination URL first!");
                      setSaveStatus("error");
                      setTimeout(() => {
                        setSaveStatus("idle");
                        setErrorMessage("");
                      }, 3000);
                      return;
                    }
                    const newSlug = await handleSaveLink();
                    if (newSlug) {
                      window.open(`/${newSlug}`, "_blank");
                    }
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-semibold flex items-center gap-1 transition"
                title={slug ? "Open white-label share page" : "Save & open share page"}
              >
                <span>View</span>
                <ArrowUpRightFromSquare className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition border border-stone-200"
                title="Copy Share URL"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <FileCopyAlt className="w-3 h-3 text-stone-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Face 3: Embed on Website */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0" />
              <div className="min-w-0">
                <span className="text-stone-800 font-bold text-[11px]">3. Embed on Website:</span>
                <p className="text-[10px] text-stone-500">
                  Embed a transparent 3D interactive tree on your website with 2 lines of HTML code.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <a
                href={slug ? `/embed/${slug}` : `/embed/demo`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-semibold flex items-center gap-1 transition"
                title="Preview embed view"
              >
                <span>Preview</span>
                <ArrowUpRightFromSquare className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(embedSnippet);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="px-2 py-1 rounded-xl bg-stone-800 hover:bg-stone-900 active:scale-95 text-white text-[10px] font-semibold transition shadow-sm"
                title="Copy embed HTML snippet for your website"
              >
                Copy Embed HTML
              </button>
            </div>
          </div>
        </div>

      </footer>

      {/* Info & About Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CubesStacked className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  About official.id
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
                title="Close"
              >
                <Close className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-4 leading-relaxed">
              <p>
                <strong>official.id</strong> is a free service for creating
                animated QR codes that can be reused and embedded on websites
                using a white-label integration.
              </p>

              <div className="text-stone-700 space-y-1">
                <p>
                  <strong>Created by</strong> Official.ID
                </p>
                <p>
                  <strong>Inspired by</strong>{" "}
                  <a
                    href="https://x.com/reactiive_"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-semibold hover:text-emerald-800 inline-flex items-center gap-0.5"
                  >
                    Enzo Manuel Mangano
                    <ArrowUpRightFromSquare className="w-3 h-3 ml-0.5" />
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://x.com/msiddique26"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-semibold hover:text-emerald-800 inline-flex items-center gap-0.5"
                  >
                    Mohamed Siddique
                    <ArrowUpRightFromSquare className="w-3 h-3 ml-0.5" />
                  </a>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                <h4 className="font-bold text-stone-900 text-sm">
                  Support Us
                </h4>
                <p className="text-stone-600">
                  Help us continuously improve the quality of our service by
                  supporting us with a cup of coffee through Trakteer.
                </p>
                <div
                  id="trakteer-btn-container"
                  className="pt-1 flex flex-wrap items-center gap-3 min-h-[44px]"
                >
                  <button
                    onClick={openTrakteerModal}
                    type="button"
                    className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#be1e2d] hover:bg-[#a01824] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <img
                      src="https://edge-cdn.trakteer.id/images/embed/trbtn-icon.png?v=14-05-2025"
                      alt="Trakteer"
                      className="w-4 h-4 object-contain"
                    />
                    <span>Support on Trakteer</span>
                  </button>

                  <a
                    href="https://trakteer.id/officialid"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-stone-400 hover:text-[#be1e2d] underline font-medium inline-flex items-center gap-0.5"
                  >
                    Open in new tab
                    <ArrowUpRightFromSquare className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              {/* Partnerships & Feedback Card in English */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 space-y-2.5">
                <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Partnerships & Feedback</span>
                </h4>
                <p className="text-stone-600 text-xs">
                  For collaborations, business partnerships, ideas, or feedback, please contact <strong>Harizal</strong> directly:
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <a
                    href="https://wa.me/6281283835553"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs transition active:scale-95"
                  >
                    <Messages className="w-3.5 h-3.5 shrink-0" />
                    <span>WhatsApp (+62 812-8383-5553)</span>
                    <ArrowUpRightFromSquare className="w-3 h-3" />
                  </a>
                  <a
                    href="https://instagram.com/harizal.official"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-semibold text-xs shadow-xs transition active:scale-95"
                  >
                    <CameraPhoto className="w-3.5 h-3.5 shrink-0" />
                    <span>Instagram (@harizal.official)</span>
                    <ArrowUpRightFromSquare className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export & 3D Voxel Tools Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  Export Snapshot & Voxel Data
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
                title="Close"
              >
                <Close className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Download your 3D Voxel Tree creation as high-resolution images or 3D voxel model files:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={handleDownloadPrintQr}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/60 text-left transition group shadow-xs"
              >
                <div>
                  <p className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Download Scannable QR Code (PNG)</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold">100% SCAN READY</span>
                  </p>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    1024x1024 high-resolution QR Code, 100% scannable by smartphone cameras for posters, menus, &amp; stickers
                  </p>
                </div>
                <Download className="w-5 h-5 text-emerald-700 shrink-0 ml-2" />
              </button>

              <button
                onClick={handleDownloadSnapshot}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-100/50 text-left transition group"
              >
                <div>
                  <p className="font-bold text-xs text-stone-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-stone-600 shrink-0" />
                    <span>Download 3D Wallpaper (Artwork)</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Artistic 3D perspective voxel illustration for wallpapers &amp; social media (not for scanning)
                  </p>
                </div>
                <CameraPhoto className="w-4 h-4 text-stone-400 group-hover:text-stone-600 shrink-0 ml-2" />
              </button>

              <button
                onClick={handleExportGoxelJson}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 text-left transition group"
              >
                <div>
                  <p className="font-bold text-xs text-stone-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-stone-600 group-hover:text-emerald-600 shrink-0" />
                    <span>Export Goxel JSON (.json)</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Universal voxel format compatible with Goxel &amp; MagicaVoxel
                  </p>
                </div>
                <CubesStacked className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportGoxelCsv}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 text-left transition group"
              >
                <div>
                  <p className="font-bold text-xs text-stone-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                    <FileCsv className="w-4 h-4 text-stone-600 group-hover:text-emerald-600 shrink-0" />
                    <span>Export Voxel Coordinates (.csv)</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    List of coordinates (X, Y, Z) and hex color codes per voxel
                  </p>
                </div>
                <Layers className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WebAR Augmented Reality Modal */}
      <WebARModal
        url={destinationUrl}
        qrText={qrText}
        season={season}
        isOpen={showARModal}
        mode="preview"
        onClose={() => setShowARModal(false)}
        onSeasonChange={(s) => setSeason(s)}
      />
    </div>
  );
}
