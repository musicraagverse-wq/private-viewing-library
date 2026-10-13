import { neon } from "@neondatabase/serverless";
import type { DramaRow, WatchProgress } from "./types";

const sql = neon(process.env.DATABASE_URL!);

/** Slim column list for tile/card listings — never fetch episode_urls/synopsis/cast_data per tile. */
const CARD_COLS = "id, title, poster_url, platform, episode_count, has_videos, alt_source";

/** Build WHERE clause with $n placeholders for Postgres. */
function buildWhere(
  q: string,
  source: string,
  platform: string,
  onlyWithVideos: boolean,
  params: (string | number)[]
): string {
  const where: string[] = ["COALESCE(is_duplicate,0) = 0"];
  if (q) {
    params.push(`%${q}%`, `%${q}%`);
    where.push(`(title ILIKE $${params.length - 1} OR synopsis ILIKE $${params.length})`);
  }
  if (source) {
    params.push(source);
    where.push(`source = $${params.length}`);
  }
  if (platform) {
    params.push(platform);
    where.push(`platform = $${params.length}`);
  }
  if (onlyWithVideos) {
    where.push("has_videos = 1");
  }
  return where.join(" AND ");
}

export async function pingDb(): Promise<void> {
  await sql`SELECT 1`;
}

export async function countDramas(q: string, source: string, platform: string): Promise<number> {
  const params: (string | number)[] = [];
  const where = buildWhere(q, source, platform, false, params);
  const rows = await sql.query(`SELECT COUNT(*) AS c FROM dramas WHERE ${where}`, params);
  return Number(rows[0].c);
}

export interface BrowseOpts {
  q: string;
  source: string;
  platform: string;
  page: number;
  perPage: number;
  onlyWithVideos: boolean;
}

export async function browseDramas(opts: BrowseOpts): Promise<DramaRow[]> {
  const { q, source, platform, page, perPage, onlyWithVideos } = opts;
  const params: (string | number)[] = [];
  const where = buildWhere(q, source, platform, onlyWithVideos, params);
  const offset = (page - 1) * perPage;
  params.push(perPage, offset);
  const limitPh = params.length - 1;
  const offsetPh = params.length;
  return (await sql.query(
    `SELECT ${CARD_COLS} FROM dramas WHERE ${where} ORDER BY scraped_at DESC LIMIT $${limitPh} OFFSET $${offsetPh}`,
    params
  )) as DramaRow[];
}

export async function getDrama(id: string): Promise<DramaRow | null> {
  const rows = (await sql`SELECT * FROM dramas WHERE id = ${id}`) as DramaRow[];
  return rows[0] ?? null;
}

export async function getDuplicatesOf(
  id: string
): Promise<{ id: string; source: string | null; has_videos: number }[]> {
  return (await sql`SELECT id, source, has_videos FROM dramas WHERE duplicate_of = ${id}`) as {
    id: string;
    source: string | null;
    has_videos: number;
  }[];
}

export async function getPlatforms(): Promise<{ platform: string; c: number }[]> {
  return (await sql`
    SELECT platform, COUNT(*) AS c FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND platform IS NOT NULL AND platform != ''
    GROUP BY platform ORDER BY c DESC
  `) as { platform: string; c: number }[];
}

export async function getSources(): Promise<{ source: string; c: number }[]> {
  return (await sql`
    SELECT source, COUNT(*) AS c FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND source IS NOT NULL
    GROUP BY source ORDER BY c DESC
  `) as { source: string; c: number }[];
}

export async function getContinueWatching(
  limit = 8
): Promise<(DramaRow & { episode: number; position_seconds: number })[]> {
  return (await sql`
    SELECT d.*, w.episode, w.position_seconds
    FROM watch_progress w JOIN dramas d ON d.id = w.drama_id
    ORDER BY w.updated_at DESC LIMIT ${limit}
  `) as (DramaRow & { episode: number; position_seconds: number })[];
}

export async function getProgress(dramaId: string): Promise<WatchProgress | null> {
  const rows = (await sql`SELECT * FROM watch_progress WHERE drama_id = ${dramaId}`) as WatchProgress[];
  return rows[0] ?? null;
}

export async function saveProgress(dramaId: string, episode: number, positionSeconds: number): Promise<void> {
  await sql`
    INSERT INTO watch_progress (drama_id, episode, position_seconds, updated_at)
    VALUES (${dramaId}, ${episode}, ${positionSeconds}, NOW())
    ON CONFLICT (drama_id) DO UPDATE SET
      episode = EXCLUDED.episode,
      position_seconds = EXCLUDED.position_seconds,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function deleteProgress(dramaId: string): Promise<void> {
  await sql`DELETE FROM watch_progress WHERE drama_id = ${dramaId}`;
}

export async function getStats(): Promise<{ total: number; withVideos: number; withAlt: number }> {
  const nd = "COALESCE(is_duplicate,0) = 0";
  const [t, v, a] = await Promise.all([
    sql.query(`SELECT COUNT(*) AS c FROM dramas WHERE ${nd}`, []),
    sql.query(`SELECT COUNT(*) AS c FROM dramas WHERE ${nd} AND has_videos = 1`, []),
    sql.query(`SELECT COUNT(*) AS c FROM dramas WHERE ${nd} AND alt_source IS NOT NULL AND alt_source != ''`, []),
  ]);
  return {
    total: Number(t[0].c),
    withVideos: Number(v[0].c),
    withAlt: Number(a[0].c),
  };
}

export async function getGenres(): Promise<{ genre: string; c: number }[]> {
  // Genres stored as JSON array in genres column
  const rows = (await sql`
    SELECT genres FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND genres IS NOT NULL AND genres != ''
  `) as { genres: string }[];
  const counter = new Map<string, number>();
  for (const r of rows) {
    try {
      const g = JSON.parse(r.genres);
      if (Array.isArray(g)) {
        for (const genre of g) {
          const name = String(genre).trim();
          if (name) counter.set(name, (counter.get(name) || 0) + 1);
        }
      }
    } catch { /* skip */ }
  }
  return Array.from(counter.entries())
    .map(([genre, c]) => ({ genre, c }))
    .sort((a, b) => b.c - a.c);
}

export async function getTropes(): Promise<{ trope: string; c: number }[]> {
  const rows = (await sql`
    SELECT tropes FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND tropes IS NOT NULL AND tropes != ''
  `) as { tropes: string }[];
  const counter = new Map<string, number>();
  for (const r of rows) {
    try {
      const t = JSON.parse(r.tropes);
      if (Array.isArray(t)) {
        for (const trope of t) {
          const name = String(trope).trim();
          if (name) counter.set(name, (counter.get(name) || 0) + 1);
        }
      }
    } catch { /* skip */ }
  }
  return Array.from(counter.entries())
    .map(([trope, c]) => ({ trope, c }))
    .sort((a, b) => b.c - a.c);
}

export async function browseByGenre(genre: string, page: number, perPage: number): Promise<{ dramas: DramaRow[]; total: number }> {
  const offset = (page - 1) * perPage;
  // Genres is JSON array; match genre name within it
  const pattern = `%"${genre.replace(/"/g, '\\"')}"%`;
  const [dramas, countRows] = await Promise.all([
    sql.query(
      `SELECT ${CARD_COLS} FROM dramas WHERE COALESCE(is_duplicate,0) = 0 AND genres ILIKE $1 ORDER BY scraped_at DESC LIMIT $2 OFFSET $3`,
      [pattern, perPage, offset]
    ),
    sql.query(
      `SELECT COUNT(*) AS c FROM dramas WHERE COALESCE(is_duplicate,0) = 0 AND genres ILIKE $1`,
      [pattern]
    ),
  ]);
  return { dramas: dramas as DramaRow[], total: Number(countRows[0].c) };
}

export async function browseByTrope(trope: string, page: number, perPage: number): Promise<{ dramas: DramaRow[]; total: number }> {
  const offset = (page - 1) * perPage;
  const pattern = `%"${trope.replace(/"/g, '\\"')}"%`;
  const [dramas, countRows] = await Promise.all([
    sql.query(
      `SELECT ${CARD_COLS} FROM dramas WHERE COALESCE(is_duplicate,0) = 0 AND tropes ILIKE $1 ORDER BY scraped_at DESC LIMIT $2 OFFSET $3`,
      [pattern, perPage, offset]
    ),
    sql.query(
      `SELECT COUNT(*) AS c FROM dramas WHERE COALESCE(is_duplicate,0) = 0 AND tropes ILIKE $1`,
      [pattern]
    ),
  ]);
  return { dramas: dramas as DramaRow[], total: Number(countRows[0].c) };
}

export async function getMarathons(limit = 24): Promise<DramaRow[]> {
  // Longest series (most episodes) — perfect for binge-watching
  return (await sql`
    SELECT ${sql.unsafe(CARD_COLS)} FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND has_videos = 1 AND episode_count > 0
    ORDER BY episode_count DESC LIMIT ${limit}
  `) as DramaRow[];
}

export async function getFreshArrivals(limit = 24): Promise<DramaRow[]> {
  return (await sql`
    SELECT ${sql.unsafe(CARD_COLS)} FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0
    ORDER BY scraped_at DESC LIMIT ${limit}
  `) as DramaRow[];
}

// Curated collections — unique groupings for the theater
export interface Collection {
  slug: string;
  title: string;
  description: string;
  icon: string;
}

export const COLLECTIONS: Collection[] = [
  { slug: "divorce-revenge", title: "Divorce & Revenge", description: "She left, now he regrets. She returns, now they pay.", icon: "💔" },
  { slug: "supernatural", title: "Supernatural", description: "Werewolves, vampires, and cultivators.", icon: "🌙" },
  { slug: "billionaire-romance", title: "Billionaire Romance", description: "CEOs, heirs, and secret fortunes.", icon: "💎" },
  { slug: "family-drama", title: "Family Drama", description: "Stepfamilies, in-laws, and household wars.", icon: "🏠" },
  { slug: "second-chances", title: "Second Chances", description: "Rebirth, time travel, and fresh starts.", icon: "🔄" },
  { slug: "crime-underworld", title: "Crime & Underworld", description: "Mafia bosses, undercover agents, kidnappings.", icon: "🎭" },
];

const COLLECTION_TROPES: Record<string, string[]> = {
  "divorce-revenge": ["Divorce", "Ex-Husband Regret", "Revenge", "Betrayal"],
  "supernatural": ["Werewolf", "Vampire", "Cultivation", "Time Travel"],
  "billionaire-romance": ["Billionaire", "CEO Romance", "Heir Revealed", "Rags to Riches"],
  "family-drama": ["Stepfamily Drama", "Evil Mother-in-Law", "Orphan", "Twins"],
  "second-chances": ["Rebirth Revenge", "Amnesia", "Time Travel"],
  "crime-underworld": ["Mafia", "Undercover", "Kidnapping"],
};

export async function browseCollection(slug: string, page: number, perPage: number): Promise<{ dramas: DramaRow[]; total: number }> {
  const tropes = COLLECTION_TROPES[slug];
  if (!tropes) return { dramas: [], total: 0 };
  const offset = (page - 1) * perPage;
  // Match any of the collection's tropes
  const conditions = tropes.map((t) => `tropes ILIKE '%"${t.replace(/"/g, '\\"')}"%'`).join(" OR ");
  const [dramas, countRows] = await Promise.all([
    sql.query(
      `SELECT ${CARD_COLS} FROM dramas WHERE COALESCE(is_duplicate,0) = 0 AND (${conditions}) ORDER BY scraped_at DESC LIMIT $1 OFFSET $2`,
      [perPage, offset]
    ),
    sql.query(
      `SELECT COUNT(*) AS c FROM dramas WHERE COALESCE(is_duplicate,0) = 0 AND (${conditions})`,
      []
    ),
  ]);
  return { dramas: dramas as DramaRow[], total: Number(countRows[0].c) };
}

export interface ArtistEntry {
  actor: string;
  count: number;
  nconst: string | null;
  photo_url: string | null;
}

function parseCast(raw: string | null): { actor: string; character: string; nconst: string | null }[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter((e) => e && typeof e.actor === "string" && e.actor.trim())
      .map((e) => ({
        actor: e.actor.trim(),
        character: typeof e.character === "string" ? e.character : "",
        nconst: typeof e.nconst === "string" && e.nconst ? e.nconst : null,
      }));
  } catch {
    return [];
  }
}

/** All actors aggregated from cast_data, with drama counts + headshots. */
export async function getArtists(): Promise<ArtistEntry[]> {
  const rows = (await sql`
    SELECT cast_data FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND cast_data IS NOT NULL AND cast_data != ''
  `) as { cast_data: string | null }[];
  const counts = new Map<string, { actor: string; count: number }>();
  for (const r of rows) {
    for (const c of parseCast(r.cast_data)) {
      const key = c.nconst ?? `name:${c.actor}`;
      const e = counts.get(key) ?? { actor: c.actor, count: 0 };
      e.count++;
      counts.set(key, e);
    }
  }
  const entries = Array.from(counts.entries());
  const nconsts = entries.map(([k]) => k).filter((k) => k.startsWith("nm"));
  const photoMap = new Map<string, string>();
  for (let i = 0; i < nconsts.length; i += 500) {
    const pr = (await sql.query(
      "SELECT nconst, photo_url FROM artists WHERE nconst = ANY($1) AND photo_url IS NOT NULL",
      [nconsts.slice(i, i + 500)]
    )) as { nconst: string; photo_url: string }[];
    for (const r of pr) photoMap.set(r.nconst, r.photo_url);
  }
  return entries
    .map(([key, e]) => ({
      actor: e.actor,
      count: e.count,
      nconst: key.startsWith("nm") ? key : null,
      photo_url: photoMap.get(key) ?? null,
    }))
    .sort((a, b) => a.actor.localeCompare(b.actor));
}

/** Headshot URL for an actor by name (used on the artist detail page). */
export async function getArtistPhoto(actor: string): Promise<string | null> {
  const rows = (await sql`
    SELECT a.photo_url AS p FROM artists a
    WHERE a.name = ${actor} AND a.photo_url IS NOT NULL
    LIMIT 1
  `) as { p: string | null }[];
  return rows[0]?.p ?? null;
}

/** Dramas featuring a given actor (case-insensitive exact name match). */
export async function browseByArtist(
  actor: string,
  page: number,
  perPage: number
): Promise<{ dramas: DramaRow[]; total: number }> {
  // NOTE: never SELECT * here — the full row is ~16MB across all matches,
  // which blows Next.js's 2MB fetch-cache limit and 500s the page.
  const rows = (await sql`
    SELECT id, title, poster_url, episode_count, platform, has_videos,
           alt_source, scraped_at, cast_data FROM dramas
    WHERE COALESCE(is_duplicate,0) = 0 AND cast_data IS NOT NULL AND cast_data != ''
  `) as (DramaRow & { scraped_at: string | Date | null; cast_data: string })[];
  const want = actor.toLowerCase();
  const matched = rows.filter((d) =>
    parseCast(d.cast_data).some((c) => c.actor.toLowerCase() === want)
  );
  // scraped_at arrives as a Date from the driver — compare numerically.
  const ts = (v: string | Date | null | undefined) =>
    v instanceof Date ? v.getTime() : Date.parse(String(v ?? "")) || 0;
  matched.sort((a, b) => ts(b.scraped_at) - ts(a.scraped_at));
  const total = matched.length;
  const offset = (page - 1) * perPage;
  return { dramas: matched.slice(offset, offset + perPage), total };
}

export interface TopImdbEntry {
  id: string;
  title: string;
  poster_url: string | null;
  imdb_id: string | null;
  imdb_rating: number | null;
  imdb_votes: number | null;
  imdb_wr: number | null;
}

/** Top IMDb-rated dramas by weighted rating (IMDb Top-250 formula).
 *  minVotes=25 keeps ratings meaningful; maxVotes=5000 excludes a small set
 *  of short dramas wrongly mapped to famous TV series with the same title. */
export type TopImdbSort = "weighted" | "rating" | "votes";

export async function getTopImdb(limit: number, sort: TopImdbSort = "weighted"): Promise<TopImdbEntry[]> {
  try {
    const orderBy =
      sort === "rating"
        ? sql`ORDER BY imdb_rating DESC, imdb_votes DESC`
        : sort === "votes"
          ? sql`ORDER BY imdb_votes DESC`
          : sql`ORDER BY imdb_wr DESC`;
    const rows = (await sql`
      SELECT id, title, poster_url, imdb_id, imdb_rating, imdb_votes, imdb_wr
      FROM dramas
      WHERE COALESCE(is_duplicate,0) = 0
        AND imdb_wr IS NOT NULL
        AND imdb_votes >= 25 AND imdb_votes <= 5000
      ${orderBy}
      LIMIT ${limit}
    `) as TopImdbEntry[];
    return rows;
  } catch {
    return [];
  }
}

/** Newest dramas added to the collection, optionally filtered by source. */
export async function getNewArrivals(source: string, page: number, perPage: number): Promise<{ dramas: DramaRow[]; total: number }> {
  const cond = source === "all" ? "COALESCE(is_duplicate,0)=0" : "COALESCE(is_duplicate,0)=0 AND source=$1";
  const args = source === "all" ? [] : [source];
  const [dramas, countRows] = await Promise.all([
    sql.query(
      `SELECT ${CARD_COLS} FROM dramas WHERE ${cond} ORDER BY scraped_at DESC LIMIT ${perPage} OFFSET ${(page - 1) * perPage}`,
      args
    ),
    sql.query(`SELECT COUNT(*) AS c FROM dramas WHERE ${cond}`, args),
  ]);
  return { dramas: dramas as DramaRow[], total: Number((countRows as { c: string }[])[0]?.c ?? 0) };
}

/* ---------- Saved lists: favourites + watch later ---------- */

export type ListType = "favourite" | "watchlater";

async function ensureSavedTable(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS saved_dramas (
      drama_id TEXT NOT NULL,
      list_type TEXT NOT NULL CHECK (list_type IN ('favourite','watchlater')),
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (drama_id, list_type)
    )
  `;
}

/** All saved drama ids, grouped by list. Used to hydrate the client once per page. */
export async function getSavedIds(): Promise<{ favourite: string[]; watchlater: string[] }> {
  await ensureSavedTable();
  const rows = (await sql`SELECT drama_id, list_type FROM saved_dramas`) as { drama_id: string; list_type: ListType }[];
  const out = { favourite: [] as string[], watchlater: [] as string[] };
  for (const r of rows) {
    if (r.list_type === "favourite") out.favourite.push(r.drama_id);
    else if (r.list_type === "watchlater") out.watchlater.push(r.drama_id);
  }
  return out;
}

export async function addSaved(dramaId: string, listType: ListType): Promise<void> {
  await ensureSavedTable();
  await sql`
    INSERT INTO saved_dramas (drama_id, list_type) VALUES (${dramaId}, ${listType})
    ON CONFLICT (drama_id, list_type) DO NOTHING
  `;
}

export async function removeSaved(dramaId: string, listType: ListType): Promise<void> {
  await ensureSavedTable();
  await sql`DELETE FROM saved_dramas WHERE drama_id = ${dramaId} AND list_type = ${listType}`;
}

/** Saved dramas with full rows, newest first. */
export async function getSavedDramas(
  listType: ListType,
  page: number,
  perPage: number
): Promise<{ dramas: DramaRow[]; total: number }> {
  await ensureSavedTable();
  const offset = (page - 1) * perPage;
  const [dramas, countRows] = await Promise.all([
    sql`
      SELECT ${sql.unsafe(CARD_COLS.replace(/(\w+)/g, "d.$1"))} FROM saved_dramas s JOIN dramas d ON d.id = s.drama_id
      WHERE s.list_type = ${listType}
      ORDER BY s.added_at DESC LIMIT ${perPage} OFFSET ${offset}
    `,
    sql`SELECT COUNT(*) AS c FROM saved_dramas WHERE list_type = ${listType}`,
  ]);
  return { dramas: dramas as DramaRow[], total: Number((countRows as { c: string }[])[0]?.c ?? 0) };
}
