import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TreeViewer from "@/components/TreeViewer";
import { getLinkBySlug } from "@/lib/links";
import { qrUrl, shareUrl } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) return {};
  const brandTitle = link.brand_name ? `${link.brand_name} — official.id` : (link.title ?? "official.id — 3D Magic Tree");
  return {
    title: brandTitle,
    robots: { index: true, follow: true },
    openGraph: {
      title: brandTitle,
      url: shareUrl(slug),
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link || !/^https?:\/\//i.test(link.destination)) notFound();

  let destinationOrigin = "";
  try {
    destinationOrigin = new URL(link.destination).origin;
  } catch {
    /* ignore */
  }

  const printedQrUrl = qrUrl(slug);
  const userShareUrl = shareUrl(slug);

  return (
    <>
      {destinationOrigin && (
        <link rel="preconnect" href={destinationOrigin} crossOrigin="anonymous" />
      )}

      <TreeViewer
        slug={slug}
        destination={link.destination}
        qrText={printedQrUrl}
        season={link.season}
        shareUrl={userShareUrl}
        arUrl={printedQrUrl}
        brand={{
          name: link.brand_name,
          logoUrl: link.brand_logo_url,
          accent: link.brand_accent,
        }}
        variant="page"
        showBadge={true}
      />
    </>
  );
}
