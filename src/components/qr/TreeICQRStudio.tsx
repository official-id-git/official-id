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
  Share2,
  Volume2,
  VolumeX,
  Info,
  Download,
  Copy,
  Check,
  Box,
  Eye,
  Sparkles,
  ExternalLink,
  Layers,
} from "lucide-react";

import ThreeVoxelTreeScene from "@/components/qr/ThreeVoxelTreeScene";

export default function TreeICQRStudio() {
  const [url, setUrl] = useState("https://official.id/harizal");
  const [season, setSeason] = useState<SeasonType>("summer");
  const [viewMode, setViewMode] = useState<"3d" | "qr">("3d");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const captureFuncRef = useRef<(() => string | null) | null>(null);
  const voxelCountRef = useRef<number>(3200);

  const currentTheme = SEASONS[season];

  const handleAudioToggle = () => {
    const active = ambientAudio.toggle();
    setIsPlayingAudio(active);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My 3D Voxel Magic Tree QR Code — official.id",
          text: `Check out my 3D Voxel Magic Tree QR Code generated on official.id: ${url}`,
          url: window.location.href,
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
        a.download = `official-id-voxel-tree-${season}-${viewMode}.png`;
        a.click();
      }
    }
  };

  const handleExportGoxelJson = () => {
    const { matrix, size } = generateQrMatrix(url);
    const voxels = generateVoxelTree(matrix, size, season);

    const json = exportVoxelsToJson(voxels, {
      title: "official.id 3D Voxel Magic Tree QR",
      url,
    });

    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `official-id-voxel-tree.json`;
    a.click();
  };

  const handleExportGoxelCsv = () => {
    const { matrix, size } = generateQrMatrix(url);
    const voxels = generateVoxelTree(matrix, size, season);

    const csv = exportVoxelsToCsv(voxels);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `official-id-voxel-tree.csv`;
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

        {/* Action Controls (Audio, Snapshot/Export, Info) */}
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
              <Volume2 className="w-4 h-4 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Export & 3D Voxel Tools */}
          <button
            onClick={() => setShowExportModal(true)}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center shadow-sm transition"
            title="Export Gambar & Model Voxel (Goxel / MagicaVoxel)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Info Modal Trigger */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-stone-700 flex items-center justify-center shadow-sm transition"
            title="Tentang official.id 3D Voxel Tree"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Studio Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center relative px-4 py-2 z-10">
        {/* 3D Scene Viewport Container */}
        <div className="w-full max-w-[560px] aspect-square max-h-[62vh] relative rounded-3xl overflow-hidden shadow-2xl shadow-stone-900/10 border border-stone-300/40">
          {isMounted && (
            <ThreeVoxelTreeScene
              url={url}
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

      {/* Primary Interaction Pill Button (Matching tree.icqr.com) */}
      <div className="flex justify-center -mt-1 mb-2 z-30">
        <button
          onClick={() => setViewMode(viewMode === "3d" ? "qr" : "3d")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/95 hover:bg-white text-stone-800 text-xs sm:text-sm font-semibold tracking-tight shadow-md hover:shadow-lg border border-stone-200/90 backdrop-blur-md transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            {viewMode === "3d"
              ? "Tap the tree to see QR code"
              : "Tap to see 3D model"}
          </span>
        </button>
      </div>

      {/* Bottom Controls Bar (Exactly matching tree.icqr.com) */}
      <footer className="w-full max-w-xl mx-auto px-4 pb-8 flex flex-col items-center gap-3 z-30">
        {/* URL Input & Share Capsule Bar */}
        <div className="w-full flex items-center bg-white/95 rounded-2xl shadow-sm border border-stone-200/80 p-1.5 pl-4 gap-2 backdrop-blur-md transition-all focus-within:ring-2 focus-within:ring-stone-400/40">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Ketik URL tujuan..."
            className="flex-1 bg-transparent text-stone-800 text-sm font-medium outline-none placeholder:text-stone-400 truncate"
          />

          <button
            onClick={handleShare}
            className="h-10 px-4 rounded-xl bg-[#c5793e] hover:bg-[#b06730] text-white flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm transition active:scale-95"
            title="Bagikan atau Copy link"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Disalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </>
            )}
          </button>
        </div>

        {/* Season Switcher Pills */}
        <div className="flex items-center gap-2 w-full justify-center text-xs font-medium">
          <button
            onClick={() => setSeason("summer")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "summer"
                ? "bg-[#EFE8DA] text-stone-900 shadow-sm border border-stone-300 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🌳 Summer Green</span>
          </button>

          <button
            onClick={() => setSeason("spring")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "spring"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🌸 Sakura Spring</span>
          </button>

          <button
            onClick={() => setSeason("autumn")}
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
                <Box className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-stone-900 text-base">
                  3D Voxel Magic Tree QR Code
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
              <p>
                <strong>official.id</strong> menghadirkan generator QR Code 3D
                Voxel revolusioner yang terinspirasi dari{" "}
                <a
                  href="https://tree.icqr.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline font-semibold"
                >
                  tree.icqr.com
                </a>
                .
              </p>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
                <h4 className="font-semibold text-stone-800">
                  Fitur Unggulan:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>
                    <strong>Animasi Angin Alami:</strong> Daun pohon bergoyang lembut terkena hembusan angin sejuk di mode 3D.
                  </li>
                  <li>
                    <strong>Pohon Menjulang Tinggi:</strong> Batang pohon yang kokoh dan cabang rimbun menjulang ke kanopi kubah megah.
                  </li>
                  <li>
                    <strong>100% Smartphone Camera Scannable:</strong> Di mode QR (tampilan atas), daun berhenti bergerak dan tersusun tepat sejajar grid QR code.
                  </li>
                  <li>
                    <strong>Taman Pelataran Rerumputan:</strong> Lantai batu sandstone dengan rumput hijau segar di sekeliling border teras.
                  </li>
                </ul>
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
              >
                ✕
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
                <Download className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
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
                <Box className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
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
    </div>
  );
}
