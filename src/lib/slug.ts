/**
 * Aturan slug & URL official.id — aman dipakai di server maupun client.
 */
export const BASE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://official.id"
).replace(/\/$/, "");

/** Tanpa karakter yang mirip: 0/o, 1/l/i */
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const CODE_LENGTH = 6;

/**
 * 3–20 karakter. 20 adalah batas agar `https://official.id/<slug>/q` tetap muat di
 * QR versi 3 (29×29, kapasitas 42 byte pada level M) → ukuran pohon selalu konsisten.
 */
export const SLUG_MIN = 3;
export const SLUG_MAX = 20;

export const RESERVED_SLUGS = new Set([
  "api",
  "embed",
  "embed.js",
  "q",
  "s",
  "t",
  "ar",
  "app",
  "www",
  "static",
  "assets",
  "_next",
  "dashboard",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "auth",
  "account",
  "settings",
  "admin",
  "pricing",
  "about",
  "help",
  "support",
  "docs",
  "blog",
  "terms",
  "privacy",
  "contact",
  "official",
  "officialid",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export const shareUrl = (slug: string) => `${BASE_URL}/${slug}`;
/** URL yang DITANAM di QR cetak → pengalaman AR lalu redirect */
export const qrUrl = (slug: string) => `${BASE_URL}/${slug}/q`;
export const embedUrl = (slug: string) => `${BASE_URL}/embed/${slug}`;

export const embedSnippet = (slug: string) =>
  `<div class="official-id-tree" data-slug="${slug}"></div>\n<script src="${BASE_URL}/embed.js" async></script>`;

/** Kode acak 6 karakter, tanpa bias modulo (rejection sampling) */
export function generateCode(length = CODE_LENGTH): string {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  const buf = new Uint8Array(length * 2);
  while (out.length < length) {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      crypto.getRandomValues(buf);
    } else {
      // Fallback untuk environment tanpa crypto global
      for (let i = 0; i < buf.length; i++) {
        buf[i] = Math.floor(Math.random() * 256);
      }
    }
    for (const b of buf) {
      if (b < limit) out += ALPHABET[b % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

export const normalizeSlug = (input: string) => input.trim().toLowerCase();

export type Check<T> = { ok: true; value: T } | { ok: false; error: string };

export function validateCustomSlug(input: unknown): Check<string> {
  if (typeof input !== "string") return { ok: false, error: "Slug tidak valid." };
  const slug = normalizeSlug(input);
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX)
    return { ok: false, error: `Slug harus ${SLUG_MIN}–${SLUG_MAX} karakter.` };
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(slug))
    return { ok: false, error: "Hanya huruf kecil, angka, dan tanda hubung (tidak di awal/akhir)." };
  if (slug.includes("--")) return { ok: false, error: "Tidak boleh ada tanda hubung ganda." };
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: "Slug ini dicadangkan sistem." };
  return { ok: true, value: slug };
}

export function validateDestination(input: unknown): Check<string> {
  if (typeof input !== "string" || !input.trim()) return { ok: false, error: "URL tujuan wajib diisi." };
  let raw = input.trim();
  if (raw.length > 2048) return { ok: false, error: "URL terlalu panjang." };
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "Format URL tidak valid." };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return { ok: false, error: "Hanya URL http/https yang diizinkan." };
  if (!url.hostname.includes(".")) return { ok: false, error: "Domain tidak valid." };

  try {
    const own = new URL(BASE_URL).hostname;
    if (url.hostname === own || url.hostname.endsWith(`.${own}`))
      return { ok: false, error: "URL tujuan tidak boleh mengarah ke official.id (redirect berputar)." };
  } catch {
    /* ignore hostname comparison on invalid base */
  }

  return { ok: true, value: url.toString() };
}
