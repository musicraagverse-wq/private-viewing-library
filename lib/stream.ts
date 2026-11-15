/**
 * Watch-time stream resolution for rows whose stored video URLs expire
 * (AnyDrama/DramaDb play links live ~6h). The client asks our own
 * /api/stream route for a fresh URL at watch time; the server resolves
 * the episodeId from the drama's stored episode_ids map — the client
 * never sends a raw episodeId, so the route can't be used as an open proxy.
 */

export type StreamFormat = "hls" | "mp4";

export interface ResolvedStream {
  url: string;
  format: StreamFormat;
  expiresAt: string | null;
}

/** Sources whose rows carry episode_ids and resolve via /api/stream. */
export const RESOLVABLE_SOURCES = ["anydrama", "dramadb"] as const;

export function isResolvableSource(source: string | null | undefined): boolean {
  return !!source && (RESOLVABLE_SOURCES as readonly string[]).includes(source);
}

export class StreamResolveError extends Error {
  code: string;
  retryable: boolean;
  constructor(code: string, retryable: boolean, message?: string) {
    super(message ?? code);
    this.name = "StreamResolveError";
    this.code = code;
    this.retryable = retryable;
  }
}

const MAX_ATTEMPTS = 6;
const BACKOFF_MS = [0, 500, 1000, 2000, 4000, 8000];

/** Fetch a fresh stream URL for one episode, retrying transient failures. */
export async function resolveStream(dramaId: string, episode: number): Promise<ResolvedStream> {
  let last: StreamResolveError = new StreamResolveError("upstream_unavailable", true);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt] ?? 8000));
    }
    try {
      const res = await fetch(
        `/api/stream?drama_id=${encodeURIComponent(dramaId)}&episode=${episode}`
      );
      const data: any = await res.json().catch(() => null);
      if (
        res.ok &&
        data &&
        typeof data.url === "string" &&
        (data.format === "hls" || data.format === "mp4")
      ) {
        return { url: data.url, format: data.format, expiresAt: data.expiresAt ?? null };
      }
      const code = typeof data?.error === "string" ? data.error : "upstream_unavailable";
      const retryable = data?.retryable === true;
      last = new StreamResolveError(code, retryable);
      if (!retryable) break; // episode_unavailable / not_resolvable: retrying won't help
    } catch {
      last = new StreamResolveError("upstream_unavailable", true);
    }
  }
  throw last;
}
