import { NextRequest, NextResponse } from "next/server";
import { getDrama } from "@/lib/db";
import { parseEpisodeIds } from "@/lib/types";
import { isResolvableSource } from "@/lib/stream";

export const dynamic = "force-dynamic";

const PLAY_API = "https://api.any-drama.com/api/play";
const UPSTREAM_TIMEOUT_MS = 8000;

/**
 * Resolve a fresh stream URL at watch time.
 * GET /api/stream?drama_id=<id>&episode=<n>
 *
 * Open-proxy guard: the episodeId comes ONLY from the drama's stored
 * episode_ids map — the client sends drama_id + episode number, never a
 * raw episodeId, so only stored episodeIds can ever be resolved.
 */
export async function GET(req: NextRequest) {
  const dramaId = req.nextUrl.searchParams.get("drama_id");
  const epRaw = req.nextUrl.searchParams.get("episode");
  const episode = epRaw ? parseInt(epRaw, 10) : NaN;
  if (!dramaId || !Number.isFinite(episode) || episode < 1) {
    return NextResponse.json({ error: "drama_id and episode required" }, { status: 400 });
  }

  let drama;
  try {
    drama = await getDrama(dramaId);
  } catch {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
  if (!drama || !isResolvableSource(drama.source)) {
    return NextResponse.json({ error: "not_resolvable" }, { status: 404 });
  }
  const episodeId = parseEpisodeIds(drama.episode_ids)[String(episode)];
  if (!episodeId) {
    return NextResponse.json({ error: "not_resolvable" }, { status: 404 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(`${PLAY_API}/${episodeId}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) {
      return NextResponse.json(
        { error: "episode_unavailable", retryable: false },
        { status: 404 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "upstream_unavailable", retryable: true },
        { status: 502 }
      );
    }
    const data: any = await res.json().catch(() => null);
    const url = data && typeof data.url === "string" ? data.url : null;
    const format =
      data && (data.format === "hls" || data.format === "mp4") ? data.format : null;
    if (!url || !format) {
      return NextResponse.json(
        { error: "upstream_unavailable", retryable: true },
        { status: 502 }
      );
    }
    const out = NextResponse.json({ url, format, expiresAt: data.expiresAt ?? null });
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable", retryable: true },
      { status: 504 }
    );
  } finally {
    clearTimeout(timer);
  }
}
