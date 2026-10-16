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

const SEASONS = new Set(["summer", "spring", "autumn", "flower", "building", "hero"]);

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    // 1. Block Automated Bots & Scrapers
    if (isAutomatedScraper(userAgent)) {
      return NextResponse.json(
        { error: "Access denied. Automated requests are not permitted." },
        { status: 403 }
      );
    }

    // 2. Rate Limiting: Max 6 QR link creations per minute per IP
    const rateCheck = checkRateLimit(`links_create_${clientIp}`, 6, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many requests. Please wait ${rateCheck.retryAfterSec} seconds before creating a new QR code.`,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSec) },
        }
      );
    }

    // 3. Limit Payload Size (Max 256KB) to prevent memory exhaustion and support PNG logos
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > 262_144) {
      return NextResponse.json(
        { error: "Payload size exceeds security limit (Maximum 256KB)." },
        { status: 413 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    // 4. Honeypot & Human Timing Verification
    const humanCheck = verifyHumanSubmission(body as Record<string, unknown>);
    if (!humanCheck.ok) {
      return NextResponse.json(
        { error: "Request blocked by anti-bot security." },
        { status: 400 }
      );
    }

    const rawUrl = body.url || body.destination;
    const dest = validateDestination(rawUrl);
    if (!dest.ok) {
      return NextResponse.json({ error: dest.error }, { status: 400 });
    }

    // 5. SSRF Protection: Ensure not private IP, localhost, or circular link
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
          { error: "Slug already taken. Please choose another." },
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
          { error: "Failed to generate a unique code. Please try again." },
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
        qrUrl: qrUrl(saved.slug), // ← Embedded in print QR (AR -> redirect)
        embedUrl: embedUrl(saved.slug),
        embedSnippet: embedSnippet(saved.slug),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
