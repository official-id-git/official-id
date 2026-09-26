import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.slug) {
      return NextResponse.json({ ok: true });
    }

    const { slug, event, source } = body;

    if (process.env.NODE_ENV === "development") {
      console.log(`[Track /api/track] Slug: ${slug}, Event: ${event}, Source: ${source || "unknown"}`);
    }

    try {
      const supabase = await createServerClient();
      await supabase.from("link_analytics").insert({
        slug,
        event: event || "unknown",
        source: source || "page",
        user_agent: req.headers.get("user-agent") || null,
      });
    } catch {
      /* silent fail on analytics */
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
