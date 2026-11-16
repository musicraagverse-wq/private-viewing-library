export interface DramaRow {
  id: string;
  title: string;
  poster_url: string | null;
  synopsis: string | null;
  platform: string | null;
  episode_count: number;
  genres: string | null;
  tropes: string | null;
  everydrama_url: string | null;
  episode_urls: string | null;
  episode_ids: string | null;
  has_videos: number;
  source: string | null;
  alt_source: string | null;
  alt_source_title: string | null;
  is_duplicate: number;
  duplicate_of: string | null;
  scraped_at: string | null;
  imdb_id: string | null;
  cast_data: string | null;
}

export interface WatchProgress {
  drama_id: string;
  episode: number;
  position_seconds: number;
  duration_seconds: number | null;
  updated_at: string | null;
}

export function parseEpisodeUrls(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
}

/** Parse the episode_ids JSON map {"1": <episodeId>, "2": <episodeId>, ...}. */
export function parseEpisodeIds(raw: string | null): Record<string, number> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) return {};
    const out: Record<string, number> = {};
    for (const [k, val] of Object.entries(v)) {
      const n = typeof val === "number" ? val : Number(val);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch {
    return {};
  }
}

export function dailymotionId(altSource: string | null): string | null {
  if (!altSource) return null;
  const m = altSource.match(/^dailymotion:(.+)$/);
  return m ? m[1] : null;
}
