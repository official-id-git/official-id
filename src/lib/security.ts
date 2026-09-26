/**
 * official.id Enterprise Security Suite
 *
 * Proteksi komprehensif terhadap:
 * 1. Bot, Spammer, & Crawler massal (Anti-Spam & Anti-DDoS)
 * 2. Rate Limiting per IP dengan Sliding Window
 * 3. Server-Side Request Forgery (SSRF) pada URL tujuan
 * 4. Honeypot & Kecepatan Pengiriman (Human Timing Verification)
 * 5. Sanitasi & Validasi Input Ketat
 */

import { NextRequest } from "next/server";

// -----------------------------------------------------------------------------
// 1. Sliding Window Rate Limiter (Memory-Safe dengan Pembersihan Otomatis)
// -----------------------------------------------------------------------------
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Pembersihan berkala setiap 5 menit agar tidak memakan RAM
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      // Buang timestamp yang lebih lama dari 5 menit
      record.timestamps = record.timestamps.filter((t) => now - t < 300_000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000);
}

/**
 * Memeriksa apakah IP telah melebihi batas request
 * @param ip Alamat IP klien
 * @param limit Jumlah maksimal request dalam jendela waktu
 * @param windowMs Ukuran jendela waktu dalam milidetik (default: 60 detik)
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60_000
): { allowed: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip) || { timestamps: [] };

  // Filter hanya timestamp dalam jendela aktif
  const validTimestamps = record.timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= limit) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldestTimestamp)) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  validTimestamps.push(now);
  record.timestamps = validTimestamps;
  rateLimitStore.set(ip, record);

  return {
    allowed: true,
    remaining: limit - validTimestamps.length,
    retryAfterSec: 0,
  };
}

/**
 * Mengambil IP klien dari request headers (mendukung Vercel, Cloudflare, Proxy)
 */
export function getClientIp(req: Request | NextRequest): string {
  const headers = req.headers;
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",");
    return ips[0].trim();
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  return "127.0.0.1";
}

// -----------------------------------------------------------------------------
// 2. Deteksi Bot, Crawler, & Scraper Otomatis
// -----------------------------------------------------------------------------
const SUSPICIOUS_USER_AGENTS = [
  "python-requests",
  "python-urllib",
  "aiohttp",
  "curl/",
  "wget/",
  "scrapy",
  "httpclient",
  "libwww",
  "zgrab",
  "postmanruntime",
  "phantomjs",
  "headlesschrome",
  "selenium",
  "puppeteer",
  "playwright",
  "bytespider",
  "yandexbot",
  "semrushbot",
  "ahrefsbot",
  "dotbot",
  "petalbot",
];

export function isAutomatedScraper(userAgent: string | null): boolean {
  if (!userAgent || userAgent.trim().length === 0) return true; // Bot seringkali tanpa User-Agent
  const ua = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some((pattern) => ua.includes(pattern));
}

// -----------------------------------------------------------------------------
// 3. Proteksi SSRF (Server-Side Request Forgery) pada URL Tujuan
// -----------------------------------------------------------------------------
const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254", // AWS/GCP metadata
  "metadata.google.internal",
  "instance-data",
]);

export function isSafeDestinationUrl(rawUrl: string): { ok: boolean; error?: string } {
  try {
    const parsed = new URL(rawUrl);

    // Hanya izinkan HTTP dan HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, error: "Hanya protokol HTTP atau HTTPS yang diizinkan." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Blokir host lokal / loopback / cloud metadata
    if (BLOCKED_HOSTS.has(hostname)) {
      return { ok: false, error: "Alamat jaringan internal / localhost tidak diizinkan." };
    }

    // Blokir IP privat RFC 1918 & link-local
    if (
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^169\.254\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return { ok: false, error: "Alamat IP privat / lokal tidak diizinkan." };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Format URL tujuan tidak valid." };
  }
}

// -----------------------------------------------------------------------------
// 4. Verifikasi Honeypot & Human Timing
// -----------------------------------------------------------------------------
export function verifyHumanSubmission(body: Record<string, unknown>): {
  ok: boolean;
  isBotTrap: boolean;
  error?: string;
} {
  // 1. Honeypot check: jika field honeypot terisi, pasti bot
  if (body._hp_company || body.company_website_hp || body.honeypot) {
    return { ok: false, isBotTrap: true, error: "Spam detected." };
  }

  // 2. Submission speed check: jika submit di bawah 800ms dari render form
  if (typeof body._render_t === "number") {
    const timeSpentMs = Date.now() - body._render_t;
    if (timeSpentMs < 800) {
      return { ok: false, isBotTrap: true, error: "Pengiriman terlalu cepat (Bot detected)." };
    }
  }

  return { ok: true, isBotTrap: false };
}
