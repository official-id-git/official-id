"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import {
  SeasonType,
  ModelStyleType,
  SEASONS,
  generateVoxelTree,
  generateVoxelSatria,
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
  Shield,
  Layers,
} from "lucide-react";
import Image from "next/image";

import ThreeVoxelTreeScene from "@/components/qr/ThreeVoxelTreeScene";

export default function TreeICQRStudio() {
  const [url, setUrl] = useState("https://official.id/harizal");
  const [season, setSeason] = useState<SeasonType>("summer");
  const [modelStyle, setModelStyle] = useState<ModelStyleType>("tree");
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
  const voxelCountRef = useRef<number>(2800);

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
          title: "My 3D Voxel QR Code — official.id",
          text: `Check out my 3D Voxel QR Code generated on official.id: ${url}`,
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
        a.download = `official-id-voxel-${modelStyle}-${season}-${viewMode}.png`;
        a.click();
      }
    }
  };

  const handleExportGoxelJson = () => {
    const { matrix, size } = generateQrMatrix(url);
    const voxels =
      modelStyle === "satria"
        ? generateVoxelSatria(matrix, size, season)
        : generateVoxelTree(matrix, size, season);

    const json = exportVoxelsToJson(voxels, {
      title: "official.id 3D Voxel Tree QR",
      url,
    });

    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `official-id-voxels-${modelStyle}.json`;
    a.click();
  };

  const handleExportGoxelCsv = () => {
    const { matrix, size } = generateQrMatrix(url);
    const voxels =
      modelStyle === "satria"
        ? generateVoxelSatria(matrix, size, season)
        : generateVoxelTree(matrix, size, season);

    const csv = exportVoxelsToCsv(voxels);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `official-id-voxels-${modelStyle}.csv`;
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

        {/* Right Action Icons: Audio, Export, Info */}
        <div className="flex items-center gap-2">
          {/* Audio Synthesizer Toggle */}
          <button
            onClick={handleAudioToggle}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition active:scale-90 ${
              isPlayingAudio
                ? "bg-amber-200 border-amber-300 text-stone-800 shadow-sm"
                : "bg-white/80 border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-white"
            }`}
            title={isPlayingAudio ? "Mute ambient breeze" : "Play ambient zen breeze"}
          >
            {isPlayingAudio ? (
              <Volume2 className="w-4 h-4 text-emerald-700 animate-pulse" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Export & 3D Voxel Tools */}
          <button
            onClick={() => setShowExportModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-stone-200 text-stone-600 hover:text-stone-900 shadow-sm transition active:scale-90"
            title="Export PNG / 3D Voxel Data (Goxel format)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Info Modal Trigger */}
          <button
            onClick={() => setShowInfoModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white border border-stone-200 text-stone-600 hover:text-stone-900 shadow-sm transition active:scale-90"
            title="Tentang 3D Voxel QR Engine"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main 3D Voxel Canvas Container */}
      <main className="w-full max-w-4xl mx-auto flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-1 my-auto">
        <div className="relative w-full max-w-[560px] aspect-square max-h-[62vh] flex items-center justify-center">
          {isMounted ? (
            <ThreeVoxelTreeScene
              url={url}
              season={season}
              modelStyle={modelStyle}
              viewMode={viewMode}
              onViewModeToggle={() =>
                setViewMode(viewMode === "3d" ? "qr" : "3d")
              }
              onSceneReady={(exporter) => {
                captureFuncRef.current = exporter.captureImage;
                voxelCountRef.current = exporter.getVoxelCount();
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-stone-400">
              <div className="w-10 h-10 rounded-2xl bg-stone-200/50 animate-pulse" />
              <span className="text-xs font-mono">Loading 3D Voxel Engine...</span>
            </div>
          )}
        </div>
      </main>

      {/* Tap the tree to see QR code / Tap to see 3D model Button (Positioned cleanly under the canvas) */}
      <div className="flex justify-center -mt-1 mb-2 z-30">
        <button
          onClick={() => setViewMode(viewMode === "3d" ? "qr" : "3d")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/95 hover:bg-white text-stone-800 text-xs sm:text-sm font-semibold tracking-tight shadow-md hover:shadow-lg border border-stone-200/90 backdrop-blur-md transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>
            {viewMode === "3d"
              ? modelStyle === "satria"
                ? "Tap Satria to see QR code"
                : "Tap the tree to see QR code"
              : "Tap to see 3D model"}
          </span>
        </button>
      </div>

      {/* Bottom Controls Bar (Exactly matching tree.icqr.com) */}
      <footer className="w-full max-w-xl mx-auto px-4 pb-8 flex flex-col items-center gap-3 z-30">
        {/* Model Style Selector Pills (Magic Tree vs Gatotkaca Satria Pixel Art) */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-stone-200/50 backdrop-blur-md border border-stone-300/40 text-xs">
          <button
            onClick={() => {
              setModelStyle("tree");
              if (season === "satria") setSeason("summer");
              setViewMode("3d");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              modelStyle === "tree"
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <span>🌳 Magic Tree (ICQR)</span>
          </button>

          <button
            onClick={() => {
              setModelStyle("satria");
              setSeason("satria");
              setViewMode("3d");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              modelStyle === "satria"
                ? "bg-amber-400 text-stone-950 font-semibold shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>🛡️ Satria Gatotkaca 3D</span>
          </button>
        </div>

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
            onClick={() => {
              setSeason("spring");
              if (modelStyle === "satria") setModelStyle("tree");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "spring"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🌸 Spring</span>
          </button>

          <button
            onClick={() => {
              setSeason("summer");
              if (modelStyle === "satria") setModelStyle("tree");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "summer"
                ? "bg-[#EFE8DA] text-stone-900 shadow-sm border border-stone-300 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>☀️ Summer</span>
          </button>

          <button
            onClick={() => {
              setSeason("autumn");
              if (modelStyle === "satria") setModelStyle("tree");
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition ${
              season === "autumn"
                ? "bg-white text-stone-900 shadow-sm border border-stone-200/80 font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🌧 Autumn</span>
          </button>

          <button
            onClick={() => {
              setSeason("satria");
              setModelStyle("satria");
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
              season === "satria"
                ? "bg-stone-900 text-amber-300 shadow-sm font-bold"
                : "text-stone-600 hover:text-stone-900 hover:bg-white/40"
            }`}
          >
            <span>🛡️ Gold</span>
          </button>
        </div>
      </footer>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-lg">
                  Tentang 3D Voxel QR Engine
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-stone-600 space-y-3 leading-relaxed">
              <p>
                <strong>official.id 3D Voxel Engine</strong> mereplikasi dan
                menyempurnakan teknologi <em>ICQR Magic Tree</em> dengan WebGL
                Three.js InstancedMesh murni.
              </p>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Bagaimana Cara Kerjanya?
                </h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  <li>
                    Setiap modul QR dipetakan ke kubus 3D voxel bertingkat.
                  </li>
                  <li>
                    Bagian batang dan dedaunan pohon dirancang sejajar dengan sel
                    gelap QR code.
                  </li>
                  <li>
                    Saat dilihat tegak lurus (Top-Down), proyeksi orthografis
                    menghasilkan <strong>QR code 100% scannable</strong> oleh
                    kamera smartphone.
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-700" />
                  Aset Pixel Art Satria Gatotkaca
                </h4>
                <p className="text-amber-800">
                  Aset kustom Anda di{" "}
                  <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">
                    /pixel/README.md.png
                  </code>{" "}
                  kini telah diintegrasikan sebagai patung voxel 3D heroik di
                  tengah plinth QR code!
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 rounded-xl border border-amber-300 bg-white overflow-hidden p-1 shadow-inner relative">
                    <img
                      src="/pixel/satria.png"
                      alt="Satria Gatotkaca"
                      className="w-full h-full object-contain [image-rendering:pixelated]"
                    />
                  </div>
                  <div className="text-[11px] text-amber-900">
                    <p className="font-semibold">Satria Pixel Character</p>
                    <p className="text-amber-700">
                      Voxelized with Gold Winged Helm & Star Armor.
                    </p>
                  </div>
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
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <p>
                Unduh gambar snapshot beresolusi tinggi atau export data koordinat
                voxel untuk dibuka di <strong>Goxel</strong> (Voxel Editor) &
                MagicaVoxel.
              </p>

              <div className="grid grid-cols-1 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    handleDownloadSnapshot();
                    setShowExportModal(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group text-left"
                >
                  <div>
                    <div className="font-semibold text-stone-900 group-hover:text-emerald-800">
                      📸 Unduh Snapshot PNG (High-Res)
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Menyimpan sudut pandang saat ini ({viewMode === "3d" ? "3D Isometric Tree" : "2D Flat QR"})
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-stone-400 group-hover:text-emerald-600" />
                </button>

                <button
                  onClick={() => {
                    handleExportGoxelJson();
                    setShowExportModal(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-amber-500 hover:bg-amber-50/50 transition group text-left"
                >
                  <div>
                    <div className="font-semibold text-stone-900 group-hover:text-amber-800">
                      🧊 Export Goxel JSON
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Data koordinat (x,y,z,color) untuk Goxel & 3D Web Tools
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-400 group-hover:text-amber-600" />
                </button>

                <button
                  onClick={() => {
                    handleExportGoxelCsv();
                    setShowExportModal(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-stone-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition group text-left"
                >
                  <div>
                    <div className="font-semibold text-stone-900 group-hover:text-indigo-800">
                      📊 Export Voxel Matrix CSV
                    </div>
                    <div className="text-[11px] text-stone-500">
                      Format tabel voxel untuk import ke blender / voxel parser
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-stone-400 group-hover:text-indigo-600" />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
