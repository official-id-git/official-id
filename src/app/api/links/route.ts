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
import {
  checkRateLimit,
  getClientIp,
  isAutomatedScraper,
  isSafeDestinationUrl,
  verifyHumanSubmission,
} from "@/lib/security";

const SEASONS = new Set(["summer", "spring", "autumn"]);

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    // 1. Blokir Bot & Scraper Otomatis yang tidak wajar
    if (isAutomatedScraper(userAgent)) {
      return NextResponse.json(
        { error: "Akses ditolak. Permintaan otomatis tidak diizinkan." },
        { status: 403 }
      );
    }

    // 2. Rate Limiting: Maksimal 6 pembuatan QR link per menit per IP
    const rateCheck = checkRateLimit(`links_create_${clientIp}`, 6, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak permintaan. Silakan tunggu ${rateCheck.retryAfterSec} detik sebelum membuat QR baru.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSec) },
        }
      );
    }

    // 3. Batasi Ukuran Payload (Max 10KB) untuk mencegah serangan memory exhaustion
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 10_240) {
      return NextResponse.json(
        { error: "Ukuran payload melebihi batas keamanan (Maksimal 10KB)." },
        { status: 413 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }

    // 4. Verifikasi Honeypot & Kecepatan Pengiriman (Human Timing Verification)
    const humanCheck = verifyHumanSubmission(body as Record<string, unknown>);
    if (!humanCheck.ok) {
      // Jika tertangkap jebakan honeypot, tolak tanpa memproses ke database
      return NextResponse.json(
        { error: "Permintaan ditolak oleh sistem keamanan anti-bot." },
        { status: 400 }
      );
    }

    const rawUrl = body.url || body.destination;
    const dest = validateDestination(rawUrl);
    if (!dest.ok) {
      return NextResponse.json({ error: dest.error }, { status: 400 });
    }

    // 5. Proteksi SSRF: Pastikan bukan IP privat, localhost, atau link internal
    const ssrfCheck = isSafeDestinationUrl(dest.value);
    if (!ssrfCheck.ok) {
      return NextResponse.json({ error: ssrfCheck.error }, { status: 400 });
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
