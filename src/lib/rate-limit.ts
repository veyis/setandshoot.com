/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * State lives per serverless instance. With Vercel Fluid Compute reusing
 * instances this meaningfully throttles bursts from a single source; it is not
 * a substitute for a shared store (Redis/KV) at high scale, but it is a cheap,
 * dependency-free first line of defense for low-traffic public endpoints.
 */
const buckets = new Map<string, number[]>();

// Guard against unbounded growth from unique keys (e.g. spoofed IPs).
const MAX_KEYS = 10_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size > MAX_KEYS) buckets.clear();

  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }

  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Resolve the client IP from proxy headers, falling back to a stable token. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
