import Link from "next/link";
import { browseDramas, countDramas, getPlatforms, getContinueWatching, getStats, getMarathons, getFreshArrivals, getGenres, getTropes, pingDb } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";
import ContinueWatching from "@/components/ContinueWatching";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

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
  let trending: Awaited<ReturnType<typeof getMarathons>> = [];
  let freshArrivals: Awaited<ReturnType<typeof getFreshArrivals>> = [];
  let genres: Awaited<ReturnType<typeof getGenres>> = [];
  let tropes: Awaited<ReturnType<typeof getTropes>> = [];
  let dbError = false;

  try {
    await pingDb();
    [dramas, total, platforms, stats, trending, freshArrivals, genres, tropes] = await Promise.all([
      browseDramas({ q, source: "", platform, page, perPage: PER_PAGE, onlyWithVideos }),
      countDramas(q, "", platform),
      getPlatforms(),
      getStats(),
      getMarathons(12),
      getFreshArrivals(12),
      getGenres(),
      getTropes(),
    ]);
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
