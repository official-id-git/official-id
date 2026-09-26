import { NextResponse } from "next/server";
import { getLinkBySlug, saveMagicLink } from "@/lib/links";
import {
  embedSnippet,
  embedUrl,
  generateCode,
  qrUrl,
  shareUrl,
  validateCustomSlug,
  validateDestination,
} from "@/lib/slug";

const SEASONS = new Set(["summer", "spring", "autumn"]);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }

    const rawUrl = body.url || body.destination;
    const dest = validateDestination(rawUrl);
    if (!dest.ok) {
      return NextResponse.json({ error: dest.error }, { status: 400 });
    }

    const season = SEASONS.has(body.season) ? body.season : "summer";
    const title = typeof body.title === "string" ? body.title.slice(0, 80) : null;

    let slug: string | null = null;

    if (typeof body.slug === "string" && body.slug.trim() !== "") {
      const check = validateCustomSlug(body.slug);
      if (!check.ok) {
        return NextResponse.json({ error: check.error }, { status: 400 });
      }

      const existing = await getLinkBySlug(check.value);
      if (existing && !body.overwrite) {
        return NextResponse.json(
          { error: "Slug sudah dipakai. Coba yang lain." },
          { status: 409 }
        );
      }
      slug = check.value;
    } else {
      for (let attempt = 0; attempt < 5 && !slug; attempt++) {
        const code = generateCode();
        const existing = await getLinkBySlug(code);
        if (!existing) {
          slug = code;
        }
      }
      if (!slug) {
        return NextResponse.json(
          { error: "Gagal membuat kode unik, coba lagi." },
          { status: 503 }
        );
      }
    }

    const saved = await saveMagicLink({
      slug,
      destination: dest.value,
      season,
      title: title || `official.id — ${slug}`,
      brand_name: body.brand?.name || null,
      brand_logo_url: body.brand?.logoUrl || null,
      brand_accent: body.brand?.accent || null,
    });

    return NextResponse.json(
      {
        ok: true,
        slug: saved.slug,
        destination: saved.destination,
        season: saved.season,
        shareUrl: shareUrl(saved.slug),
        qrUrl: qrUrl(saved.slug), // ← Ditanam di QR cetak (AR -> redirect)
        embedUrl: embedUrl(saved.slug),
        embedSnippet: embedSnippet(saved.slug),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
