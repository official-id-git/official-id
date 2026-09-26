import PixelQRStudio from "@/components/qr/PixelQRStudio";
import { Sparkles, QrCode, Box, ShieldCheck, Cpu, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-between overflow-hidden bg-slate-950 px-4 py-8 md:py-16 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[550px] bg-gradient-to-tr from-emerald-600/15 via-teal-600/15 to-indigo-500/10 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute bottom-10 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/10 via-purple-600/10 to-emerald-500/5 blur-[120px] rounded-full" />

      {/* Top Navbar */}
      <nav className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between pb-8 border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-950/50">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white">official.id</span>
            <span className="hidden sm:inline-block ml-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Magic 3D Pixel QR
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Live Production Ready
          </span>
          <a
            href="https://github.com/official-id-git/official-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition"
          >
            GitHub Repo
          </a>
        </div>
      </nav>

      {/* Hero Header */}
      <header className="relative z-10 flex flex-col items-center gap-4 text-center max-w-3xl mx-auto mt-8 mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span>Terinspirasi dari ICQR Magic Tree & Obelisk.js</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Ubah QR Code Menjadi{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Pixel Art 3D Voxel
          </span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
          Karena struktur dasar QR Code adalah matriks kotak, kita dapat mentransisikannya menjadi karya seni pixel isometrik bertingkat yang tetap dapat di-scan oleh kamera smartphone Anda.
        </p>
      </header>

      {/* Main Interactive Studio */}
      <main className="relative z-10 w-full mb-20">
        <PixelQRStudio />
      </main>

      {/* Feature Architecture Cards */}
      <section className="relative z-10 w-full max-w-6xl mx-auto my-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Reed-Solomon 30% Error Tolerance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menggunakan koreksi error level High (H). Sampai 30% modul dapat diubah ketinggian dan warnanya tanpa merusak kemampuan baca scanner kamera smartphone.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Box className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Isometric Voxel Algorithm</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Setiap modul QR diproyeksikan secara isometrik dengan rasio 1:2 (22.6°). Menghitung shading permukaan atas, kiri, dan kanan untuk efek 3D nyata tanpa GPU berat.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-900 bg-slate-900/40 p-6 backdrop-blur-md shadow-lg space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Cpu className="h-5 w-5" />
          </div>
          <h3 className="text-base font-semibold text-white">Transisi Animasi Morphing</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Pengguna dapat menggeser tingkat ekstrusi dari 0% (2D Flat Scannable) hingga 100% (3D Voxel Sculpture bertema Pohon, Kota, atau Piramida).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <div>
          &copy; {new Date().getFullYear()} <strong className="text-slate-400">official.id</strong>. Built with Next.js, Canvas, Supabase, Cloudinary & Vercel.
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Inspirasi: ICQR Magic Tree & Obelisk.js</span>
        </div>
      </footer>
    </div>
  );
}
