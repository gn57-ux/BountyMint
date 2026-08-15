const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

// In-memory sliding-window limiter — matches the project's no-database
// constraint (PRD §15.2). Per-process only, resets on restart; good enough to
// blunt anonymous cost-exhaustion abuse of the paid OpenAI generation endpoint
// for a single-instance hackathon deployment, not a substitute for real
// infrastructure rate limiting in production.
const hits = new Map<string, number[]>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "unknown";
}

export function isRequestRateLimited(request: Request): boolean {
  const key = clientKey(request);
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > MAX_REQUESTS_PER_WINDOW;
}
