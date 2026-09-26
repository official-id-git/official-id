import { NextResponse } from "next/server";
import { getLinkBySlug } from "@/lib/links";
import { validateCustomSlug } from "@/lib/slug";
import { checkRateLimit, getClientIp, isAutomatedScraper } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  // 1. Blokir Bot & Scraper Otomatis
  if (isAutomatedScraper(userAgent)) {
    return NextResponse.json(
      { ok: false, available: false, error: "Akses otomatis ditolak." },
      { status: 403 }
    );
  }

  // 2. Rate Limiting: Maksimal 25 pemeriksaan slug per menit per IP
  const rateCheck = checkRateLimit(`slug_check_${clientIp}`, 25, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        error: `Terlalu banyak permintaan. Silakan tunggu ${rateCheck.retryAfterSec} detik.`,
      },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSec) },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug");

  if (!rawSlug || !rawSlug.trim()) {
    return NextResponse.json(
      { ok: false, available: false, error: "Slug tidak boleh kosong." },
      { status: 400 }
    );
  }

  const check = validateCustomSlug(rawSlug);
  if (!check.ok) {
    return NextResponse.json({ ok: false, available: false, error: check.error });
  }

  const existing = await getLinkBySlug(check.value);
  if (existing) {
    return NextResponse.json({
      ok: false,
      available: false,
      error: "Slug sudah dipakai. Coba yang lain.",
    });
  }

  return NextResponse.json({
    ok: true,
    available: true,
    slug: check.value,
  });
}
