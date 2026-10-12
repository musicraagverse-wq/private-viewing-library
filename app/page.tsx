import Link from "next/link";
import { browseDramas, countDramas, getPlatforms, getContinueWatching, getStats, getFreshArrivals, getGenres, getTropes, getTopImdb, pingDb } from "@/lib/db";
import DramaCard, { Poster } from "@/components/DramaCard";
import Pagination from "@/components/Pagination";
import ContinueWatching from "@/components/ContinueWatching";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

/** 4-hour rotation slot — homepage picks reshuffle every 4 hours. */
function rotationSlot() {
  return Math.floor(Date.now() / (4 * 3600 * 1000));
}

/** Deterministic shuffle seeded by the rotation slot (mulberry32). */
function rotatingPick<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  let seed = rotationSlot();
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    const j = ((t ^ (t >>> 14)) >>> 0) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

function href(params: Record<string, string | undefined>, overrides: Record<string, string | undefined> = {}) {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) {
    if (v) qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

export default async function Home({
  searchParams,
}: {
  searchParams: { q?: string; platform?: string; page?: string; videos?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const platform = searchParams.platform ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const onlyWithVideos = searchParams.videos === "1";

  let dramas: Awaited<ReturnType<typeof browseDramas>> = [];
  let total = 0;
  let platforms: Awaited<ReturnType<typeof getPlatforms>> = [];
  let stats = { total: 0, withVideos: 0, withAlt: 0 };
  let continueWatching: Awaited<ReturnType<typeof getContinueWatching>> = [];
  let trending: Awaited<ReturnType<typeof browseDramas>> = [];
  let freshArrivals: Awaited<ReturnType<typeof getFreshArrivals>> = [];
  let topImdb: Awaited<ReturnType<typeof getTopImdb>> = [];
  let genres: Awaited<ReturnType<typeof getGenres>> = [];
  let tropes: Awaited<ReturnType<typeof getTropes>> = [];
  let dbError = false;

  try {
    await pingDb();
    [dramas, total, platforms, stats, freshArrivals, genres, tropes, topImdb] = await Promise.all([
      browseDramas({ q, source: "", platform, page, perPage: PER_PAGE, onlyWithVideos }),
      countDramas(q, "", platform),
      getPlatforms(),
      getStats(),
      getFreshArrivals(12),
      getGenres(),
      getTropes(),
      getTopImdb(50),
    ]);
    // "Watch Free Now": rotate through watchable dramas every 4 hours
    const watchable = await browseDramas({ q: "", source: "", platform: "", page: 1, perPage: 60, onlyWithVideos: true });
    trending = rotatingPick(watchable, 12);
    if (!q && !platform && page === 1) {
      continueWatching = await getContinueWatching(10);
    }
  } catch {
    dbError = true;
  }

  const base = { q: q || undefined, platform: platform || undefined, videos: onlyWithVideos ? "1" : undefined };
  const isHome = !q && !platform && page === 1;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="py-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Discover Your Next <span className="text-primary">Short Drama</span> Obsession
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-muted">
          Explore trending mini series, full episode guides, and streaming platforms all in one place.
        </p>
        <form action="/" method="get" className="mx-auto mt-6 flex max-w-xl gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search dramas..."
            className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primarydark">
            Search
          </button>
        </form>
      </section>

      {dbError && (
        <div className="rounded-lg border border-border bg-surface p-6 text-center text-sm text-primary">
          Busy right now — please refresh in a moment.
        </div>
      )}

      {isHome ? (
        <>
          {/* Continue Watching */}
          {continueWatching.length > 0 && <ContinueWatching items={continueWatching} />}

          {/* Watch Free Now */}
          <section>
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-2xl font-bold">Watch Free Now</h2>
              <Link href="/?videos=1" className="text-sm font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {trending.map((d) => (
                <DramaCard key={d.id} drama={d} />
              ))}
            </div>
          </section>

          {/* Top IMDb — rotates every 4 hours */}
          {topImdb.length > 0 && (
            <section>
              <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-2xl font-bold">Top IMDb Rated</h2>
                <Link href="/top-imdb" className="text-sm font-semibold text-primary hover:underline">
                  View all →
                </Link>
              </div>
              <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
                {rotatingPick(topImdb, 10).map((d, i) => (
                  <Link
                    key={d.id}
                    href={`/drama/${encodeURIComponent(d.id)}`}
                    className="card-hover w-36 shrink-0 overflow-hidden rounded-xl border border-border bg-surface"
                  >
                    <div className="relative">
                      <span className="absolute left-2 top-2 z-10 rounded-md bg-primary px-2 py-0.5 text-sm font-extrabold text-white">
                        {i + 1}
                      </span>
                      <Poster title={d.title} posterUrl={d.poster_url} className="aspect-[3/4] w-full" />
                    </div>
                    <div className="p-2">
                      <p className="truncate text-sm font-semibold">{d.title}</p>
                      <p className="text-xs text-muted">★ {d.imdb_rating?.toFixed(1)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recently Added */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Recently Added</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {freshArrivals.map((d) => (
                <DramaCard key={d.id} drama={d} />
              ))}
            </div>
          </section>

          {/* Popular Tropes */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Popular Tropes & Themes</h2>
            <div className="flex flex-wrap gap-2">
              {tropes.slice(0, 20).map((t) => (
                <Link
                  key={t.trope}
                  href={`/trope/${encodeURIComponent(t.trope)}`}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                  {t.trope} <span className="text-muted">({t.c.toLocaleString()})</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Browse by Genre */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Browse by Genre</h2>
            <div className="flex flex-wrap gap-2">
              {genres.slice(0, 20).map((g) => (
                <Link
                  key={g.genre}
                  href={`/genre/${encodeURIComponent(g.genre)}`}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                  {g.genre} <span className="text-muted">({g.c.toLocaleString()})</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Browse by Platform */}
          <section>
            <h2 className="mb-4 text-2xl font-bold">Browse by Platform</h2>
            <div className="flex flex-wrap gap-2">
              {platforms.slice(0, 20).map((p) => (
                <Link
                  key={p.platform}
                  href={href(base, { platform: p.platform, page: undefined })}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                >
                  {p.platform} <span className="text-muted">({p.c.toLocaleString()})</span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Search/Browse results */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {q ? `Results for "${q}"` : platform ? `${platform}` : "All Dramas"}
                <span className="ml-2 text-sm font-normal text-muted">({total.toLocaleString()})</span>
              </h2>
              <Link
                href={href(base, { videos: onlyWithVideos ? undefined : "1", page: undefined })}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold ${onlyWithVideos ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-primary"}`}
              >
                ▶ Watchable only
              </Link>
            </div>
            {platform && (
              <div className="mb-4">
                <Link href="/" className="text-sm text-primary hover:underline">← Clear filter</Link>
              </div>
            )}
            {dramas.length === 0 && !dbError ? (
              <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted">
                No dramas found.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {dramas.map((d) => (
                  <DramaCard key={d.id} drama={d} />
                ))}
              </div>
            )}
            <Pagination page={page} total={total} perPage={PER_PAGE} buildHref={(p) => href(base, { page: p === 1 ? undefined : String(p) })} />
          </section>
        </>
      )}
    </div>
  );
}
