"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  SeasonType,
  SEASONS,
  generateVoxelTree,
  generateQrMatrix,
  exportVoxelsToJson,
  exportVoxelsToCsv,
} from "@/lib/voxel-tree-generator";
import { ambientAudio } from "@/lib/ambient-audio";
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
} from "flowbite-react-icons/outline";

import ThreeVoxelTreeScene from "@/components/qr/ThreeVoxelTreeScene";
import WebARModal from "@/components/qr/WebARModal";

export default function TreeICQRStudio() {
  const [destinationUrl, setDestinationUrl] = useState("https://patrakomala.id");
  const [slug, setSlug] = useState("patrakomala");
  const [customSlugInput, setCustomSlugInput] = useState("patrakomala");
  const [slugCheckStatus, setSlugCheckStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("available");
  const [slugError, setSlugError] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [showBrandConfig, setShowBrandConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [shortlinkBase, setShortlinkBase] = useState("https://official.id");
  const [season, setSeason] = useState<SeasonType>("spring");
  const [viewMode, setViewMode] = useState<"3d" | "qr">("3d");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showARModal, setShowARModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setShortlinkBase(window.location.origin);
    }
  }, []);

  // 1. Teks yang benar-benar dicetak di QR code fisik: shortlink menuju mode scan AR /[slug]/q
  const qrText = `${shortlinkBase}/${slug}/q`;
  // 2. Link share untuk dibagikan di medsos / bio: /[slug]
  const shareLink = `${shortlinkBase}/${slug}`;
  // 3. Snippet embed untuk website / iframe:
  const embedSnippet = `<div class="official-id-tree" data-slug="${slug}"></div>\n<script src="${shortlinkBase}/embed.js" async></script>`;

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
      setSlugError("3-20 karakter, huruf kecil & angka");
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
          setSlugError(data.error || "Slug sudah dipakai");
        }
      } catch {
        setSlugCheckStatus("idle");
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [customSlugInput, slug]);

  // Simpan / update link ke Supabase & fail-safe cache
  const handleSaveLink = React.useCallback(
    async (overrideSlug?: string, overrideSeason?: SeasonType) => {
      if (!destinationUrl || !/^https?:\/\//i.test(destinationUrl)) return;
      setSaveStatus("saving");
      const chosenSlug = (overrideSlug !== undefined ? overrideSlug : customSlugInput).trim().toLowerCase();
      const chosenSeason = overrideSeason || season;

      try {
        const res = await fetch("/api/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination: destinationUrl,
            season: chosenSeason,
            slug: chosenSlug || undefined,
            brand: brandName ? { name: brandName, logoUrl: brandLogoUrl || null } : undefined,
            overwrite: chosenSlug === slug,
          }),
        });
        const data = await res.json();
        if (data.ok && data.slug) {
          setSlug(data.slug);
          setCustomSlugInput(data.slug);
          setSlugCheckStatus("available");
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2500);
        } else {
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      } catch {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    },
    [destinationUrl, customSlugInput, season, slug, brandName, brandLogoUrl]
  );

  // Buat kode acak 6 digit baru
  const handleGenerateRandomSlug = () => {
    setCustomSlugInput("");
    handleSaveLink("");
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
      closeBtn.innerHTML = "✕";
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
          text: `Buka 3D Voxel Magic Tree ini: ${shareLink}`,
          url: shareLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadSnapshot = () => {
    if (captureFuncRef.current) {
      const dataUrl = captureFuncRef.current();
      if (dataUrl) {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `official-id-magic-tree-${slug}-${season}-${viewMode}.png`;
        a.click();
      }
    }
  };

  const handleExportGoxelJson = () => {
    const { matrix, size } = generateQrMatrix(qrText);
    const voxels = generateVoxelTree(matrix, size, season);

    const json = exportVoxelsToJson(voxels, {
      title: "official.id 3D Voxel Magic Tree QR",
      url: qrText,
    });

    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `official-id-voxel-tree-${slug}.json`;
    a.click();
  };

  const handleExportGoxelCsv = () => {
    const { matrix, size } = generateQrMatrix(qrText);
    const voxels = generateVoxelTree(matrix, size, season);

    const csv = exportVoxelsToCsv(voxels);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `official-id-voxel-tree-${slug}.csv`;
    a.click();
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between transition-colors duration-700 font-sans selection:bg-stone-300 selection:text-stone-900"
      style={{ backgroundColor: currentTheme.bgColor }}
    >
      {/* Top Navbar Header (Matching tree.icqr.com style) */}
      <header className="w-full max-w-5xl mx-auto px-6 pt-6 flex items-center justify-between z-30">
        {/* Dot Matrix Style Brand Logo */}
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-1.5 text-stone-800 font-mono text-xl sm:text-2xl font-black tracking-widest uppercase">
            <span className="text-stone-400 font-normal">[</span>
            <span>official.id</span>
            <span className="text-stone-400 font-normal">]</span>
          </div>

          {/* Quick "I see QR" / View Mode Toggle Pill Button */}
          <button
            onClick={() => setViewMode(viewMode === "3d" ? "qr" : "3d")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/90 hover:bg-amber-400 text-stone-900 text-[11px] font-bold tracking-tight shadow-sm transition active:scale-95"
            title="Klik untuk mengubah sudut pandang seketika"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{viewMode === "3d" ? "👁 I see QR >" : "🌳 See 3D Tree >"}</span>
          </button>
        </div>

        {/* Action Controls (Audio, Mode AR, Snapshot/Export, Info) */}
        <div className="flex items-center gap-2">
          {/* Ambient Audio Toggle */}
          <button
            onClick={handleAudioToggle}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm ${
              isPlayingAudio
                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                : "bg-white/80 hover:bg-white text-stone-700"
            }`}
            title={isPlayingAudio ? "Matikan Suara Alam" : "Nyalakan Suara Alam (Breeze & Birds)"}
          >
            {isPlayingAudio ? (
              <VolumeUp className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeMute className="w-4 h-4" />
            )}
          </button>

          {/* Mode AR Button */}
          <button
            onClick={() => setShowARModal(true)}
            className="h-10 px-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white flex items-center justify-center gap-1.5 shadow-sm transition font-medium text-xs"
            title="Buka Mode AR (Augmented Reality) Kamera"
          >
            <CameraPhoto className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">Mode AR</span>
          </button>

          {/* Export & 3D Voxel Tools */}
          <button
            onClick={() => setShowExportModal(true)}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center shadow-sm transition active:scale-95"
            title="Export Gambar & Model Voxel (Goxel / MagicaVoxel)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Info Modal Trigger */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center shadow-sm transition active:scale-95"
            title="Tentang official.id 3D Voxel Tree"
          >
            <InfoCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Studio Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center relative px-4 py-2 z-10">
        {/* 3D Scene Viewport Container */}
        <div className="w-full max-w-[560px] aspect-square max-h-[62vh] relative rounded-3xl overflow-hidden shadow-2xl shadow-stone-900/10 border border-stone-300/40">
          {isMounted && (
            <ThreeVoxelTreeScene
              url={destinationUrl}
              qrText={qrText}
              season={season}
              viewMode={viewMode}
              onViewModeToggle={() => setViewMode(viewMode === "3d" ? "qr" : "3d")}
              onSceneReady={({ captureImage, getVoxelCount }) => {
                captureFuncRef.current = captureImage;
                voxelCountRef.current = getVoxelCount();
              }}
            />
          )}
        </div>
      </main>

      {/* Primary Interaction Pill Buttons (Matching tree.icqr.com + Mode AR) */}
      <div className="flex flex-wrap items-center justify-center -mt-1 mb-2 z-30 gap-2.5">
        <button
          onClick={() => setViewMode(viewMode === "3d" ? "qr" : "3d")}
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
          title="Lihat Pohon di Ruangan Nyata Anda (Mode AR)"
        >
          <CameraPhoto className="w-4 h-4" />
          <span>Mode AR</span>
        </button>
      </div>

      {/* Bottom Controls Bar & Link Studio */}
      <footer className="w-full max-w-xl mx-auto px-4 pb-8 flex flex-col items-center gap-3 z-30">
        {/* Creation & Customization Card */}
        <div className="w-full bg-white/95 rounded-2xl shadow-md border border-stone-200/90 p-3 sm:p-4 backdrop-blur-md flex flex-col gap-2.5">
          {/* Baris 1: Input URL Tujuan */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-stone-600 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-stone-500" />
                <span>URL Tujuan Pengguna</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">
                (Kemana QR/Link akan diarahkan)
              </span>
            </label>
            <div className="flex items-center bg-stone-50/80 rounded-xl border border-stone-200 px-3 py-2 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
              <input
                type="url"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://patrakomala.id atau https://kailoka.com..."
                className="w-full bg-transparent text-stone-800 text-xs sm:text-sm font-medium outline-none placeholder:text-stone-400"
              />
            </div>
          </div>

          {/* Baris 2: Input Custom Slug */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-500" />
                <span>Custom Slug / Link Pendek</span>
              </label>
              <div className="flex items-center gap-1">
                {slugCheckStatus === "checking" && (
                  <span className="text-[10px] text-stone-500 font-medium animate-pulse">
                    Memeriksa...
                  </span>
                )}
                {slugCheckStatus === "available" && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                    ✓ Tersedia
                  </span>
                )}
                {slugCheckStatus === "taken" && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full font-semibold">
                    ✕ Sudah dipakai
                  </span>
                )}
                {slugCheckStatus === "invalid" && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-semibold" title={slugError}>
                    {slugError}
                  </span>
                )}
                {slugCheckStatus === "idle" && (
                  <span className="text-[10px] text-stone-400 font-medium">
                    (Kosong = acak 6 digit)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-stone-50/80 rounded-xl border border-stone-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500 transition-all">
                <span className="text-xs text-stone-400 font-mono font-medium select-none mr-1">
                  official.id/
                </span>
                <input
                  type="text"
                  value={customSlugInput}
                  onChange={(e) => setCustomSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="kailoka / patrakomala"
                  className="flex-1 bg-transparent text-stone-800 text-xs sm:text-sm font-mono font-semibold outline-none placeholder:text-stone-300"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerateRandomSlug}
                className="px-2.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 text-xs font-semibold flex items-center gap-1 transition shrink-0 border border-stone-200"
                title="Buat kode unik 6 digit acak otomatis"
              >
                <Refresh className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acak</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveLink()}
                disabled={saveStatus === "saving" || slugCheckStatus === "taken" || slugCheckStatus === "invalid"}
                className={`px-3.5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0 ${
                  saveStatus === "saved"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : saveStatus === "saving"
                    ? "bg-stone-400 cursor-not-allowed"
                    : "bg-[#c5793e] hover:bg-[#b06730]"
                }`}
              >
                {saveStatus === "saving" ? (
                  <span>Menyimpan...</span>
                ) : saveStatus === "saved" ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Tersimpan</span>
                  </>
                ) : (
                  <>
                    <WandMagicSparkles className="w-4 h-4" />
                    <span>Terapkan</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pengaturan Brand Whitelabel (Accordion) */}
          <div className="border-t border-stone-100 pt-1.5">
            <button
              type="button"
              onClick={() => setShowBrandConfig(!showBrandConfig)}
              className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center justify-between w-full font-medium py-0.5"
            >
              <span>⚙️ Pengaturan Brand Whitelabel (Opsional)</span>
              <span>{showBrandConfig ? "▲ Sembunyikan" : "▼ Tampilkan"}</span>
            </button>

            {showBrandConfig && (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 animate-in fade-in duration-200">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-stone-500 font-semibold">Nama Brand</span>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="Contoh: Kailoka Coffee"
                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-stone-500 font-semibold">Logo URL Brand (HTTPS)</span>
                  <input
                    type="url"
                    value={brandLogoUrl}
                    onChange={(e) => setBrandLogoUrl(e.target.value)}
                    placeholder="https://.../logo.png"
                    className="bg-white border border-stone-200 rounded-lg px-2.5 py-1 text-xs text-stone-800 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic 3-Channel URLs Capsule (The 3 Faces of official.id) */}
        <div className="w-full flex flex-col gap-2 p-3 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 text-xs shadow-md">
          {/* Wajah 1: QR Cetak Fisik */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-stone-100">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-stone-800 font-bold text-[11px]">1. QR Cetak Fisik:</span>
                  <span className="font-mono text-emerald-800 font-bold text-[11px] truncate">
                    {qrText}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">
                  Ditanam di QR fisik. Kamera HP scan $\rightarrow$ WebAR 10s $\rightarrow$ auto-redirect ke tujuan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <a
                href={`/${slug}/q`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white text-[11px] font-semibold flex items-center gap-1 transition shadow-sm"
                title="Buka simulasi WebAR hasil scan poster"
              >
                <span>Test AR</span>
                <ArrowUpRightFromSquare className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                className="px-2 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition flex items-center gap-1 border border-stone-200"
                title="Unduh QR Code siap cetak"
              >
                <Download className="w-3 h-3" />
                <span>PNG</span>
              </button>
            </div>
          </div>

          {/* Wajah 2: Link Share Whitelabel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-stone-100">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 mt-1 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-stone-800 font-bold text-[11px]">2. Link Share Medsos:</span>
                  <span className="font-mono text-sky-800 font-bold text-[11px] truncate">
                    {shareLink}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">
                  Untuk dibagikan di WA / IG Bio. Menampilkan pohon voxel 3D whitelabel interaktif.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 text-[11px] font-semibold flex items-center gap-1 transition"
                title="Buka halaman share whitelabel"
              >
                <span>Lihat</span>
                <ArrowUpRightFromSquare className="w-3 h-3" />
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-semibold transition border border-stone-200"
                title="Salin URL Share"
              >
                {isCopied ? "Tersalin ✓" : "Copy"}
              </button>
            </div>
          </div>

          {/* Wajah 3: Embed Iframe */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
            <div className="flex items-start gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 mt-1 shrink-0" />
              <div className="min-w-0">
                <span className="text-stone-800 font-bold text-[11px]">3. Embed di Website:</span>
                <p className="text-[10px] text-stone-500">
                  Pasang pohon 3D transparan di website Anda dengan 2 baris kode HTML.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
              <a
                href={`/embed/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-[11px] font-semibold flex items-center gap-1 transition"
                title="Preview tampilan embed"
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
                title="Salin kode HTML embed untuk dipasang di website"
              >
                Copy Embed HTML
              </button>
            </div>
          </div>
        </div>

        {/* Season Switcher Pills */}
        <div className="flex items-center gap-2 w-full justify-center text-xs font-medium">
          <button
            onClick={() => {
              setSeason("summer");
              handleSaveLink(undefined, "summer");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "summer"
                ? "bg-[#EFE8DA] text-stone-900 shadow-sm border border-stone-300 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🌳 Summer Green</span>
          </button>

          <button
            onClick={() => {
              setSeason("spring");
              handleSaveLink(undefined, "spring");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "spring"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🌸 Sakura Spring</span>
          </button>

          <button
            onClick={() => {
              setSeason("autumn");
              handleSaveLink(undefined, "autumn");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "autumn"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🍂 Golden Autumn</span>
          </button>
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
                title="Tutup"
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
                    <span>Dukung Saya di Trakteer</span>
                  </button>

                  <a
                    href="https://trakteer.id/officialid"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-stone-400 hover:text-[#be1e2d] underline font-medium inline-flex items-center gap-0.5"
                  >
                    Buka tab baru
                    <ArrowUpRightFromSquare className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition"
              >
                Tutup
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
                title="Tutup"
              >
                <Close className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Download hasil karya 3D Voxel Tree Anda dalam format gambar definisi tinggi atau format model 3D Voxel:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={handleDownloadSnapshot}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 text-left transition group"
              >
                <div>
                  <p className="font-bold text-xs text-stone-800 group-hover:text-emerald-900">
                    📸 Download High-Res PNG Image
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Foto resolusi tinggi sudut pandang saat ini ({viewMode.toUpperCase()})
                  </p>
                </div>
                <CameraPhoto className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportGoxelJson}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 text-left transition group"
              >
                <div>
                  <p className="font-bold text-xs text-stone-800 group-hover:text-emerald-900">
                    📦 Export Goxel JSON (.json)
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Format voxel universal kompatibel dengan Goxel & MagicaVoxel
                  </p>
                </div>
                <CubesStacked className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
              </button>

              <button
                onClick={handleExportGoxelCsv}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-stone-200 hover:border-emerald-500 bg-stone-50/50 hover:bg-emerald-50/30 text-left transition group"
              >
                <div>
                  <p className="font-bold text-xs text-stone-800 group-hover:text-emerald-900">
                    📄 Export Voxel Coordinates (.csv)
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Daftar koordinat (X, Y, Z) dan kode warna hex per voxel
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
                Selesai
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
