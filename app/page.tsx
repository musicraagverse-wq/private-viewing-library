import Link from "next/link";
import { browseDramas, countDramas, getPlatforms, getSources, getContinueWatching, getStats, getMarathons, getFreshArrivals, pingDb } from "@/lib/db";
import DramaCard, { Poster } from "@/components/DramaCard";
import Pagination from "@/components/Pagination";

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
  let dbError = false;

  try {
    await pingDb();
    [dramas, total, platforms, sources, stats, marathons, freshArrivals] = await Promise.all([
      browseDramas({ q, source, platform, page, perPage: PER_PAGE, onlyWithVideos }),
      countDramas(q, source, platform),
      getPlatforms(),
      getSources(),
      getStats(),
      getMarathons(12),
      getFreshArrivals(12),
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
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          Now <span className="marquee-text">Showing</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          {stats.total.toLocaleString()} titles · {stats.withVideos.toLocaleString()} playable
          {stats.withAlt > 0 && ` · ${stats.withAlt.toLocaleString()} alt source`}
        </p>
        <form action="/" method="get" className="mt-4 flex gap-2">
          {source && <input type="hidden" name="source" value={source} />}
          {platform && <input type="hidden" name="platform" value={platform} />}
          {onlyWithVideos && <input type="hidden" name="videos" value="1" />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            className="w-full rounded-lg border border-rope bg-lounge px-4 py-2.5 text-sm text-cream placeholder:text-muted/60 focus:border-marquee/60 focus:outline-none"
          />
          <button type="submit" className="rounded-lg bg-marquee px-5 py-2.5 text-sm font-bold text-screen hover:bg-spotlight">
            Search
          </button>
        </form>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Source:</span>
          <Link
            href={href(base, { source: undefined, page: undefined })}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${!source ? "border-marquee/60 bg-marquee/15 text-marquee" : "border-rope text-muted hover:text-marquee"}`}
          >
            All
          </Link>
          {sources.map((s) => (
            <Link
              key={s.source}
              href={href(base, { source: s.source, page: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${source === s.source ? "border-marquee/60 bg-marquee/15 text-marquee" : "border-rope text-muted hover:text-marquee"}`}
            >
              {s.source} ({s.c.toLocaleString()})
            </Link>
          ))}
          <span className="ml-2 text-xs font-bold uppercase tracking-wide text-muted">Platform:</span>
          <Link
            href={href(base, { platform: undefined, page: undefined })}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${!platform ? "border-marquee/60 bg-marquee/15 text-marquee" : "border-rope text-muted hover:text-marquee"}`}
          >
            All
          </Link>
          {platforms.slice(0, 8).map((p) => (
            <Link
              key={p.platform}
              href={href(base, { platform: p.platform, page: undefined })}
              className={`rounded-full border px-3 py-1 text-xs font-bold ${platform === p.platform ? "border-marquee/60 bg-marquee/15 text-marquee" : "border-rope text-muted hover:text-marquee"}`}
            >
              {p.platform} ({p.c.toLocaleString()})
            </Link>
          ))}
          <Link
            href={href(base, { videos: onlyWithVideos ? undefined : "1", page: undefined })}
            className={`rounded-full border px-3 py-1 text-xs font-bold ${onlyWithVideos ? "border-marquee/60 bg-marquee/15 text-marquee" : "border-rope text-muted hover:text-marquee"}`}
          >
            ▶ Playable only
          </Link>
        </div>
      </section>

      {dbError && (
        <div className="rounded-lg border border-rope bg-lounge p-6 text-center text-sm text-marquee">
          Library is busy (import in progress). Please refresh in a moment.
        </div>
      )}

      {/* Continue watching */}
      {continueWatching.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl tracking-wide">Continue Watching</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {continueWatching.map((d) => (
              <Link
                key={d.id}
                href={`/watch/${encodeURIComponent(d.id)}/${d.episode}`}
                className="ticket ticket-hover group overflow-hidden"
              >
                <div className="relative aspect-[3/4]">
                  <Poster title={d.title} posterUrl={d.poster_url} className="h-full w-full" />
                  <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[11px] font-bold text-marquee">
                    EP {d.episode}
                  </div>
                </div>
                <div className="line-clamp-1 p-2 text-xs font-bold text-cream group-hover:text-marquee">
                  {d.title}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grid */}
      <section>
        <h2 className="mb-3 font-display text-xl tracking-wide">
          {q ? `Results for “${q}”` : "The Collection"} <span className="text-sm font-normal text-muted">({total.toLocaleString()})</span>
        </h2>
        {dramas.length === 0 && !dbError ? (
          <div className="rounded-lg border border-rope bg-lounge p-10 text-center text-sm text-muted">
            No titles found. Try a different search or clear the filters.
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
            <h2 className="font-display text-xl tracking-wide">🎬 Marathon Picks</h2>
            <span className="text-xs text-muted">Longest series for binge-watching</span>
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
            <h2 className="font-display text-xl tracking-wide">✨ Fresh Arrivals</h2>
            <span className="text-xs text-muted">Recently added to the library</span>
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
