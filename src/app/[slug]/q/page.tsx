import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import ScanExperience from "./ScanExperience";
import { getLinkBySlug } from "@/lib/links";
import { qrUrl } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) return {};
  return {
    title: link.title ?? "official.id — WebAR Experience",
    robots: { index: false }, // Halaman redirect AR tidak perlu diindeks search engine
    openGraph: {
      title: link.title ?? "official.id",
      url: qrUrl(slug),
    },
  };
}

export default async function PhysicalQRScanPage({ params }: Props) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link || !/^https?:\/\//i.test(link.destination)) notFound();

  // Cek cookie 24 jam: jika pengguna sudah pernah memindai sebelumnya, countdown cukup 4 detik
  const cookieStore = await cookies();
  const hasScannedRecently = cookieStore.has(`oid_scanned_${slug}`);
  const redirectSeconds = hasScannedRecently ? 4 : 10;

  let destinationOrigin = "";
  try {
    destinationOrigin = new URL(link.destination).origin;
  } catch {
    /* ignore */
  }

  const printedQrUrl = qrUrl(slug);

  return (
    <>
      {/* Fallback tanpa JavaScript: tetap redirect otomatis */}
      <noscript>
        <meta httpEquiv="refresh" content={`${redirectSeconds};url=${link.destination}`} />
        <div
          style={{
            padding: "32px",
            background: "#0c0a09",
            color: "#fff",
            fontFamily: "sans-serif",
            textAlign: "center",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2 style={{ fontSize: "20px", marginBottom: "12px" }}>Membuka link tujuan...</h2>
          <p style={{ color: "#a8a29e", fontSize: "14px", marginBottom: "20px" }}>
            Anda akan diarahkan dalam {redirectSeconds} detik.
          </p>
          <a
            href={link.destination}
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "#10b981",
              color: "#fff",
              borderRadius: "14px",
              textDecoration: "none",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            Buka Sekarang
          </a>
        </div>
      </noscript>

      {destinationOrigin && (
        <link rel="preconnect" href={destinationOrigin} crossOrigin="anonymous" />
      )}

      <Suspense
        fallback={
          <div className="fixed inset-0 flex items-center justify-center bg-stone-950 text-stone-300 text-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium tracking-wide">Menyiapkan AR…</p>
            </div>
          </div>
        }
      >
        <ScanExperience
          slug={slug}
          destination={link.destination}
          qrText={printedQrUrl}
          season={link.season}
          redirectSeconds={redirectSeconds}
        />
      </Suspense>
    </>
  );
}
