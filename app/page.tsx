import Link from "next/link";
import { browseDramas, countDramas, getPlatforms, getSources, getContinueWatching, getStats, getMarathons, getFreshArrivals, getGenres, getTropes, pingDb } from "@/lib/db";
import DramaCard, { Poster } from "@/components/DramaCard";
import Pagination from "@/components/Pagination";
import BrowseTabs from "@/components/BrowseTabs";

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
  searchParams: { q?: string; source?: string; platform?: string; page?: string; videos?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const source = searchParams.source ?? "";
  const platform = searchParams.platform ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const onlyWithVideos = searchParams.videos === "1";

  let dramas: Awaited<ReturnType<typeof browseDramas>> = [];
  let total = 0;
  let platforms: Awaited<ReturnType<typeof getPlatforms>> = [];
  let sources: Awaited<ReturnType<typeof getSources>> = [];
  let stats = { total: 0, withVideos: 0, withAlt: 0 };
  let continueWatching: Awaited<ReturnType<typeof getContinueWatching>> = [];
  let marathons: Awaited<ReturnType<typeof getMarathons>> = [];
  let freshArrivals: Awaited<ReturnType<typeof getFreshArrivals>> = [];
  let genres: Awaited<ReturnType<typeof getGenres>> = [];
  let tropes: Awaited<ReturnType<typeof getTropes>> = [];
  let dbError = false;

  try {
    await pingDb();
    [dramas, total, platforms, sources, stats, marathons, freshArrivals, genres, tropes] = await Promise.all([
      browseDramas({ q, source, platform, page, perPage: PER_PAGE, onlyWithVideos }),
      countDramas(q, source, platform),
      getPlatforms(),
      getSources(),
      getStats(),
      getMarathons(12),
      getFreshArrivals(12),
      getGenres(),
      getTropes(),
    ]);
    if (!q && !source && !platform && page === 1) {
      continueWatching = await getContinueWatching(8);
    }
  } catch {
    dbError = true;
  }

  const base = { q: q || undefined, source: source || undefined, platform: platform || undefined, videos: onlyWithVideos ? "1" : undefined };

  return (
    <div className="space-y-8">
      {/* Hero / search */}
      <section>
        <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          🎭 <span className="pop-text">The Drama Den</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          {stats.total.toLocaleString()} dramas · {stats.withVideos.toLocaleString()} ready to watch
          {stats.withAlt > 0 && ` · ${stats.withAlt.toLocaleString()} with backup`}
        </p>
        <form action="/" method="get" className="mt-4 flex gap-2">
          {source && <input type="hidden" name="source" value={source} />}
          {platform && <input type="hidden" name="platform" value={platform} />}
          {onlyWithVideos && <input type="hidden" name="videos" value="1" />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="🔍 Find your next obsession…"
            className="w-full rounded-den border-2 border-edge bg-denlight px-5 py-3 text-sm font-semibold text-cream placeholder:text-muted/60 focus:border-pop focus:outline-none"
          />
          <button type="submit" className="rounded-den bg-pop px-6 py-3 text-sm font-extrabold text-white hover:bg-popdark">
            Go!
          </button>
        </form>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2 font-display">
          <Link
            href={href(base, { videos: onlyWithVideos ? undefined : "1", page: undefined })}
            className={`rounded-full border-2 px-4 py-1.5 text-xs font-extrabold ${onlyWithVideos ? "border-teal bg-teal/20 text-teal" : "border-edge text-muted hover:text-teal"}`}
          >
            ▶ Watchable only
          </Link>
        </div>
      </section>

      {dbError && (
        <div className="den-card p-6 text-center text-sm font-bold text-sunny">
          Busy right now — give it a moment and refresh! 🔄
        </div>
      )}

      {/* Browse by Category / Platform / Trope - Tabbed */}
      {!q && !source && !platform && (
        <BrowseTabs
          genres={genres.slice(0, 30).map((g) => ({
            name: g.genre,
            count: g.c,
            href: `/genre/${encodeURIComponent(g.genre)}`,
          }))}
          platforms={platforms.slice(0, 30).map((p) => ({
            name: p.platform,
            count: p.c,
            href: href(base, { platform: p.platform, page: undefined }),
          }))}
          tropes={tropes.slice(0, 30).map((t) => ({
            name: t.trope,
            count: t.c,
            href: `/trope/${encodeURIComponent(t.trope)}`,
          }))}
        />
      )}

      {/* Continue watching */}
      {continueWatching.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-extrabold">📺 Continue Watching</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {continueWatching.map((d) => (
              <Link
                key={d.id}
                href={`/watch/${encodeURIComponent(d.id)}/${d.episode}`}
                className="den-card den-card-hover group"
              >
                <div className="relative aspect-[3/4]">
                  <Poster title={d.title} posterUrl={d.poster_url} className="h-full w-full" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[11px] font-extrabold text-sunny">
                    EP {d.episode}
                  </div>
                </div>
                <div className="line-clamp-1 p-2 text-xs font-extrabold text-cream group-hover:text-pop">
                  {d.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section>
        <h2 className="mb-3 font-display text-2xl font-extrabold">
          {q ? `🔍 “${q}”` : "✨ All Dramas"} <span className="text-sm font-bold text-muted">({total.toLocaleString()})</span>
        </h2>
        {dramas.length === 0 && !dbError ? (
          <div className="den-card p-10 text-center text-sm font-bold text-muted">
            Nothing found! Try a different search 🎭
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {dramas.map((d) => (
              <DramaCard key={d.id} drama={d} />
            ))}
          </div>
        )}
        <Pagination
          page={page}
          total={total}
          perPage={PER_PAGE}
          buildHref={(p) => href(base, { page: p === 1 ? undefined : String(p) })}
        />
      </section>

      {/* Marathon: longest series */}
      {!q && !source && !platform && marathons.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold">🎬 Marathon Picks</h2>
            <span className="text-xs font-bold text-muted">Longest series for binge sessions</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {marathons.map((d) => (
              <DramaCard key={d.id} drama={d} />
            ))}
          </div>
        </section>
      )}

      {/* Fresh arrivals */}
      {!q && !source && !platform && freshArrivals.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold">✨ Fresh Arrivals</h2>
            <span className="text-xs font-bold text-muted">Just added to the Den</span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {freshArrivals.map((d) => (
              <DramaCard key={d.id} drama={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
