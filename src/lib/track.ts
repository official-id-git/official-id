/**
 * Helper pengiriman analitik via sendBeacon ke /api/track
 */
export function track(
  slug: string,
  event: string,
  source = "page",
  meta?: Record<string, unknown>
) {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  try {
    const payload = JSON.stringify({
      slug,
      event,
      source,
      timestamp: Date.now(),
      ...meta,
    });
    navigator.sendBeacon(
      "/api/track",
      new Blob([payload], { type: "application/json" })
    );
  } catch {
    /* ignore network failure on analytics */
  }
}
