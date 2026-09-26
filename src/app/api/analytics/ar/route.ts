import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (process.env.NODE_ENV === "development" && body) {
      console.log(`[WebAR Analytics] ${body.event}:`, body);
    }
    // Ready for Supabase event recording or warehouse ingestion
    return NextResponse.json({ ok: true, timestamp: Date.now() });
  } catch (err) {
    console.warn("Analytics beacon parsing error:", err);
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
