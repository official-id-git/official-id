"use client";

import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import {
  generateQRMatrix,
  renderQRPixelCanvas,
  QR_THEMES,
  ThemeId,
  QRPixelData,
} from "@/lib/qr-pixel-engine";
import {
  Sparkles,
  Download,
  Share2,
  Box,
  TreePine,
  Building2,
  Triangle,
  Layers,
  Play,
  RotateCcw,
  Check,
  QrCode,
  Sliders,
} from "lucide-react";

export default function PixelQRStudio() {
  const [text, setText] = useState("https://official.id/harizal");
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>("magic-tree");
  const [shapeType, setShapeType] = useState<"tree" | "city" | "pyramid" | "flat">("tree");
  const [morphValue, setMorphValue] = useState<number>(0.85); // 0.0 (flat 2D) to 1.0 (full 3D)
  const [isAnimating, setIsAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const qrDataRef = useRef<QRPixelData | null>(null);

  // Generate QR Matrix on text change
  useEffect(() => {
    try {
      qrDataRef.current = generateQRMatrix(text.trim() || "https://official.id");
    } catch (e) {
      console.error("QR Generation error:", e);
    }
  }, [text]);

  // Re-render canvas whenever controls change
  useEffect(() => {
    if (!canvasRef.current || !qrDataRef.current) return;
    const canvas = canvasRef.current;
    const theme = QR_THEMES[selectedTheme];

    renderQRPixelCanvas(canvas, qrDataRef.current, theme, morphValue, shapeType);
  }, [selectedTheme, shapeType, morphValue, text]);

  // Animate morph transition back and forth
  const handlePlayMorph = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    const startVal = morphValue;
    const targetVal = morphValue > 0.5 ? 0 : 0.9;
    const duration = 900;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeInOutCubic
      const ease =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      setMorphValue(startVal + (targetVal - startVal) * ease);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#10b981", "#38bdf8", "#fbbf24", "#a855f7"],
    });

    const link = document.createElement("a");
    link.download = `official-id-pixel-qr-${selectedTheme}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTheme = QR_THEMES[selectedTheme];

  return (
    <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Canvas Preview & Morph Bar */}
      <div className="lg:col-span-7 flex flex-col items-center gap-6">
        <div className="relative group w-full max-w-[500px] aspect-square rounded-3xl p-3 border border-slate-800 bg-slate-900/80 backdrop-blur-2xl shadow-2xl shadow-indigo-950/30 flex items-center justify-center overflow-hidden">
          {/* Ambient Glow */}
          <div
            className="absolute inset-0 opacity-20 blur-3xl pointer-events-none transition-colors duration-500"
            style={{ backgroundColor: currentTheme.accent }}
          />

          <canvas
            ref={canvasRef}
            width={1000}
            height={1000}
            className="w-full h-full rounded-2xl object-contain shadow-inner cursor-pointer transition-transform duration-300 group-hover:scale-[1.01]"
            onClick={handlePlayMorph}
            title="Klik untuk menganimasikan transisi QR Pixel!"
          />

          {/* Morph Floating Badge */}
          <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md text-[11px] font-medium text-slate-200">
            {morphValue <= 0.05 ? (
              <>
                <QrCode className="h-3.5 w-3.5 text-emerald-400" />
                <span>2D Flat Pixel QR (Scan Ready)</span>
              </>
            ) : (
              <>
                <Box className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                <span>3D Isometric Voxel ({Math.round(morphValue * 100)}%)</span>
              </>
            )}
          </div>

          {/* Quick Animate Button */}
          <button
            onClick={handlePlayMorph}
            disabled={isAnimating}
            className="absolute bottom-6 right-6 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-900/90 px-3.5 py-1.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md transition hover:bg-slate-800 hover:text-white active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-3 w-3 ${isAnimating ? "animate-spin" : ""}`} />
            <span>{morphValue > 0.5 ? "Flaten ke 2D" : "Morph ke 3D"}</span>
          </button>
        </div>

        {/* Morph Slider Bar */}
        <div className="w-full max-w-[500px] rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-indigo-400" />
              Tingkat Ekstrusi Voxel 3D
            </span>
            <span className="font-mono text-indigo-400">{Math.round(morphValue * 100)}%</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMorphValue(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                morphValue === 0
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              2D Flat
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={morphValue}
              onChange={(e) => setMorphValue(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <button
              onClick={() => setMorphValue(1)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition ${
                morphValue === 1
                  ? "bg-indigo-600 text-white font-semibold"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              3D Max
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Customization Controls */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        {/* Input Target URL */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Link / Data QR Code
            </label>
            <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
              Reed-Solomon 30% Error Margin
            </span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://official.id/nama-anda"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleCopyLink}
              className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Salin Link"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "harizal", val: "https://official.id/harizal" },
              { label: "kartu-bisnis", val: "https://official.id/c/kartu-bisnis" },
              { label: "organisasi", val: "https://official.id/o/komunitas-resmi" },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => setText(preset.val)}
                className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/40 transition"
              >
                +{preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Shape Archetype Selector */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Box className="h-4 w-4 text-cyan-400" />
            Bentuk Arsitektur 3D (Voxel Topology)
          </label>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "tree", label: "Magic Tree (ICQR)", icon: TreePine, desc: "Kubah kanopi pohon bertingkat" },
              { id: "city", label: "Skyline City", icon: Building2, desc: "Gedung metropolis acak tinggi" },
              { id: "pyramid", label: "Pyramid Dome", icon: Triangle, desc: "Piramida dari pusat ke luar" },
              { id: "flat", label: "Uniform Block", icon: Layers, desc: "Tinggi balok seragam rata" },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = shapeType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setShapeType(item.id as any)}
                  className={`flex flex-col items-start p-3 rounded-2xl border text-left transition ${
                    isActive
                      ? "border-cyan-500/60 bg-cyan-500/10 text-white shadow-md shadow-cyan-950/40"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 leading-tight">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Theme Selector */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl space-y-4">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            Palet Warna Pixel Art
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.values(QR_THEMES).map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition ${
                    isSelected
                      ? "border-emerald-500/60 bg-emerald-500/10 text-white"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div
                    className="h-8 w-8 rounded-xl shadow-md flex-shrink-0 border border-white/20"
                    style={{
                      background: `linear-gradient(135deg, ${theme.palette.primaryTop}, ${theme.palette.primaryRight})`,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{theme.name}</p>
                    <p className="text-[10px] text-slate-500">{theme.category}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Download & Export Action */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:from-emerald-400 hover:to-teal-400 active:scale-98"
          >
            <Download className="h-4 w-4" />
            <span>Download PNG Pixel Art (HD)</span>
          </button>
          <button
            onClick={() => {
              setText("https://official.id/harizal");
              setMorphValue(0.85);
              setSelectedTheme("magic-tree");
              setShapeType("tree");
            }}
            className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            title="Reset ke Default"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
