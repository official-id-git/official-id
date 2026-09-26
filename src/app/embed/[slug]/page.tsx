import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TreeViewer from "@/components/TreeViewer";
import { getLinkBySlug } from "@/lib/links";
import { qrUrl, shareUrl } from "@/lib/slug";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bg?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLinkBySlug(slug);
  if (!link) return {};
  return {
    title: link.title ?? `QR ${slug}`,
    robots: { index: false },
  };
}

export default async function EmbedPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { bg } = await searchParams;
  const link = await getLinkBySlug(slug);
  if (!link || !/^https?:\/\//i.test(link.destination)) notFound();

  const isSolid = bg === "solid";
  const printedQrUrl = qrUrl(slug);
  const userShareUrl = shareUrl(slug);

  return (
    <main className="w-full flex justify-center bg-transparent overflow-hidden">
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
        variant="embed"
        transparent={!isSolid}
        showBadge={true}
      />
    </main>
  );
}
