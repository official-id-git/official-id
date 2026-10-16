import { NextResponse } from "next/server";
import { getLinkBySlug } from "@/lib/links";
import { validateCustomSlug } from "@/lib/slug";
import { checkRateLimit, getClientIp, isAutomatedScraper } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const clientIp = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  // 1. Block Automated Bots & Scrapers
  if (isAutomatedScraper(userAgent)) {
    return NextResponse.json(
      { ok: false, available: false, error: "Automated access denied." },
      { status: 403 }
    );
  }

  // 2. Rate Limiting: Max 25 slug checks per minute per IP
  const rateCheck = checkRateLimit(`slug_check_${clientIp}`, 25, 60_000);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        available: false,
        error: `Too many requests. Please wait ${rateCheck.retryAfterSec} seconds.`,
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
      { ok: false, available: false, error: "Slug cannot be empty." },
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
      error: "Slug already taken. Please choose another.",
    });
  }

  return NextResponse.json({
    ok: true,
    available: true,
    slug: check.value,
  });
}
