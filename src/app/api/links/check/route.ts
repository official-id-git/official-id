import { NextResponse } from "next/server";
import { getLinkBySlug } from "@/lib/links";
import { validateCustomSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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
