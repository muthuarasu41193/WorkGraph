type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  options?: { limit?: number; windowMs?: number },
): { allowed: boolean; retryAfterSec: number } {
  const limit =
    options?.limit ??
    (Number.parseInt(process.env.HIDDEN_JOBS_RATE_LIMIT || "60", 10) || 60);
  const windowMs =
    options?.windowMs ??
    (Number.parseInt(process.env.HIDDEN_JOBS_RATE_WINDOW_MS || "60000", 10) || 60_000);

  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  return { allowed: true, retryAfterSec: 0 };
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Test helper */
export function clearRateLimitBuckets(): void {
  buckets.clear();
}
