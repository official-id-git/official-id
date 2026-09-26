import fs from "node:fs";
import path from "node:path";
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server";
import type { SeasonType } from "@/lib/voxel-tree-generator";

export interface MagicLink {
  id?: string;
  slug: string;
  destination: string; // URL tujuan pengguna
  season: SeasonType;
  title?: string;
  brand_name?: string | null;
  brand_logo_url?: string | null;
  brand_accent?: string | null;
  created_at?: string;
  updated_at?: string;
  clicks_count?: number;
}

// In-memory fallback untuk preview lokal atau jika database Supabase belum terhubung
const IN_MEMORY_LINKS: Record<string, MagicLink> = {
  demo: {
    slug: "demo",
    destination: "https://official.id",
    season: "summer",
    title: "Demo 3D Voxel Magic Tree",
  },
};

const CACHE_DIR = path.join(process.cwd(), ".data");
const CACHE_FILE = path.join(CACHE_DIR, "magic_links.json");

function readDiskCache(): Record<string, MagicLink> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }
  return {};
}

function writeDiskCache(links: Record<string, MagicLink>) {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(links, null, 2), "utf-8");
  } catch {
    /* ignore */
  }
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      key !== "your_supabase_anon_key"
  );
}

/**
 * Mengambil link berdasarkan slug dari database Supabase (dengan in-memory fallback)
 */
export async function getLinkBySlug(slug: string): Promise<MagicLink | null> {
  // 1. Query ke Supabase jika kredensial terpasang
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerClient();
      const { data, error } = await supabase
        .from("magic_links")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          slug: data.slug,
          destination: data.destination,
          season: data.season as SeasonType,
          title: data.title,
          clicks_count: data.clicks_count,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch {
      /* Fallback jika env bermasalah */
    }
  }

  // 2. Cek disk cache (berbagi antar worker Turbopack/Next.js)
  const disk = readDiskCache();
  if (disk[slug]) {
    return disk[slug];
  }

  // 3. In-memory dictionary
  if (IN_MEMORY_LINKS[slug]) {
    return IN_MEMORY_LINKS[slug];
  }

  // 4. Base64 URL-safe slug decoder
  try {
    const decoded = Buffer.from(slug, "base64url").toString("utf-8");
    if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
      return {
        slug,
        destination: decoded,
        season: "summer",
        title: "official.id — Magic Tree",
      };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/**
 * Menyimpan link baru atau memperbarui link yang ada di Supabase
 */
export async function saveMagicLink(
  link: Omit<MagicLink, "id" | "created_at" | "updated_at">
): Promise<MagicLink> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("magic_links")
        .upsert(
          {
            slug: link.slug,
            destination: link.destination,
            season: link.season,
            title: link.title || "official.id — Magic Tree",
            brand_name: link.brand_name || null,
            brand_logo_url: link.brand_logo_url || null,
            brand_accent: link.brand_accent || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        )
        .select()
        .single();

      if (!error && data) {
        return data as MagicLink;
      }
    } catch {
      /* simpan fallback ke memori jika offline */
    }
  }

  // Simpan ke memory dan disk cache
  IN_MEMORY_LINKS[link.slug] = link;
  const disk = readDiskCache();
  disk[link.slug] = link;
  writeDiskCache(disk);

  return link;
}
