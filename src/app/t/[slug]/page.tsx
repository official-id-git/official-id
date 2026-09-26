import React from "react";
import type { Metadata } from "next";
import { SeasonType } from "@/lib/voxel-tree-generator";
import { ArrowUpRightFromSquare, WandMagicSparkles } from "flowbite-react-icons/outline";

import ARExperience from "@/components/qr/ARExperience";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ to?: string; season?: string }>;
}

function resolveDestination(slug: string, queryTo?: string): string {
  if (queryTo && (queryTo.startsWith("http://") || queryTo.startsWith("https://"))) {
    return queryTo;
  }
  if (slug === "demo" || slug === "harizal" || slug === "welcome") {
    return "https://official.id";
  }
  try {
    const decoded = Buffer.from(slug, "base64url").toString("utf-8");
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      return decoded;
    }
  } catch {
    /* not base64 */
  }
  return "https://official.id";
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sParams = await searchParams;
  const target = resolveDestination(slug, sParams?.to);

  return {
    title: `WebAR Magic Tree — official.id/t/${slug}`,
    description: `Pindai dan nikmati pengalaman 3D Voxel Magic Tree di Augmented Reality menuju ${target}`,
    openGraph: {
      title: `WebAR Magic Tree — official.id`,
      description: `Official.ID Augmented Reality Magic Portal menuju ${target}`,
      type: "website",
    },
  };
}

export default async function ShortLinkPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sParams = await searchParams;

  const targetUrl = resolveDestination(slug, sParams?.to);
  const seasonParam = (sParams?.season || "summer") as SeasonType;
  const season: SeasonType = ["summer", "spring", "autumn"].includes(seasonParam)
    ? seasonParam
    : "summer";

  const qrText = `https://official.id/t/${slug}`;

  let targetHost = targetUrl;
  let targetOrigin = "";
  try {
    const parsed = new URL(targetUrl);
    targetHost = parsed.host;
    targetOrigin = parsed.origin;
  } catch {
    /* biarkan */
  }

  return (
    <>
      {/* Preconnect ke domain tujuan untuk mempercepat navigasi setelah AR */}
      {targetOrigin && <link rel="preconnect" href={targetOrigin} crossOrigin="anonymous" />}

      {/* Zero-JS Fallback: redirect otomatis setelah 10 detik jika browser mematikan JavaScript */}
      <noscript>
        <meta httpEquiv="refresh" content={`10;url=${targetUrl}`} />
        <div style={{ padding: "30px", background: "#0c0a09", color: "#fff", fontFamily: "sans-serif", textAlign: "center" }}>
          <h2>Membuka link tujuan...</h2>
          <p>Jika halaman tidak berpindah otomatis dalam 10 detik, klik tombol di bawah:</p>
          <a
            href={targetUrl}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#10b981",
              color: "#fff",
              borderRadius: "12px",
              textDecoration: "none",
              fontWeight: "bold",
              marginTop: "16px",
            }}
          >
            Buka Sekarang ({targetHost})
          </a>
        </div>
      </noscript>

      {/* SSR Shell: Bubble link langsung dapat diklik dalam milidetik pertama bahkan sebelum bundle JS selesai */}
      <div className="fixed top-4 left-4 right-4 z-40 max-w-md mx-auto pointer-events-auto">
        <div className="bg-stone-900/90 backdrop-blur-md border border-white/20 rounded-2xl p-3 shadow-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5 overflow-hidden pr-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <WandMagicSparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-stone-400 font-medium">Tujuan Link</p>
              <p className="text-xs font-bold text-white truncate font-mono">{targetHost}</p>
            </div>
          </div>

          <a
            href={targetUrl}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 shadow-md"
          >
            <span>Buka</span>
            <ArrowUpRightFromSquare className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Interactive WebAR Client Experience */}
      <main className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none">
        <ARExperience
          url={targetUrl}
          qrText={qrText}
          season={season}
          redirectSeconds={10}
        />
      </main>
    </>
  );
}
