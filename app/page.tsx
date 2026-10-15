import Link from "next/link";
import { browseDramas, countDramas, getPlatforms, getContinueWatching, getGenres, getTropes, getTopImdb, getFeaturedDrama, getTrending, getFreshArrivals, getHiddenGems, pingDb, COLLECTIONS } from "@/lib/db";
import { MOODS } from "@/lib/moods";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";
import ContinueWatching from "@/components/ContinueWatching";
import TasteQuiz from "@/components/TasteQuiz";
import ForYou from "@/components/ForYou";
import SortSelect from "@/components/SortSelect";
import EpRangeSelect from "@/components/EpRangeSelect";
import Hero from "@/components/Hero";
import Rail from "@/components/Rail";
import { platformLogo, platformInitial, formatPlatform, sortPlatforms } from "@/lib/platforms";
import { genreIcon, tropeIcon } from "@/lib/tag-icons";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

/** 4-hour rotation slot — homepage picks reshuffle every 4 hours. */
function rotationSlot() {
  return Math.floor(Date.now() / (4 * 3600 * 1000));
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
  searchParams: { q?: string; platform?: string; page?: string; videos?: string; sort?: string; ep?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const platform = searchParams.platform ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const onlyWithVideos = searchParams.videos === "1";
  const sort = searchParams.sort === "rating" ? "rating" : "newest";
  const epRange = (["short", "medium", "long"] as const).includes(searchParams.ep as any)
    ? (searchParams.ep as "short" | "medium" | "long")
    : "";

  let dramas: Awaited<ReturnType<typeof browseDramas>> = [];
  let total = 0;
  let platforms: Awaited<ReturnType<typeof getPlatforms>> = [];
  let continueWatching: Awaited<ReturnType<typeof getContinueWatching>> = [];
  let trending: Awaited<ReturnType<typeof getTrending>> = [];
  let freshArrivals: Awaited<ReturnType<typeof getFreshArrivals>> = [];
  let topImdb: Awaited<ReturnType<typeof getTopImdb>> = [];
  let genres: Awaited<ReturnType<typeof getGenres>> = [];
  let tropes: Awaited<ReturnType<typeof getTropes>> = [];
  let featured: Awaited<ReturnType<typeof getFeaturedDrama>> = null;
  let hiddenGems: Awaited<ReturnType<typeof getHiddenGems>> = [];
  let dbError = false;

  try {
    await pingDb();
    [dramas, total, platforms, freshArrivals, genres, tropes, topImdb] = await Promise.all([
      browseDramas({ q, source: "", platform, page, perPage: PER_PAGE, onlyWithVideos, sort, epRange }),
      countDramas(q, "", platform, epRange),
      getPlatforms(),
      getFreshArrivals(12),
      getGenres(),
      getTropes(),
      getTopImdb(50),
    ]);
    if (!q && !platform && page === 1) {
      [continueWatching, trending, featured, hiddenGems] = await Promise.all([
        getContinueWatching(10),
        getTrending(12),
        getFeaturedDrama(rotationSlot()),
        getHiddenGems(12),
      ]);
    }
  } catch {
    dbError = true;
  }

  const base = { q: q || undefined, platform: platform || undefined, videos: onlyWithVideos ? "1" : undefined, sort: sort === "rating" ? "rating" : undefined, ep: epRange || undefined };
  const isHome = !q && !platform && page === 1;

  return (
    <div className="space-y-10">
      {dbError && (
        <div className="callout-info text-center" role="status">
          Busy right now — please refresh in a moment.
        </div>
      )}

      {isHome ? (
        <>
          {/* Cinematic hero */}
          {featured && <Hero drama={featured} />}

          {/* Continue Watching */}
          {continueWatching.length > 0 && <ContinueWatching items={continueWatching} />}

          {/* Taste quiz — cold-start personalization */}
          <TasteQuiz tropes={tropes} />

          {/* For You — personalized rows */}
          <ForYou />

          {/* Trending — most-saved (real signal) */}
          {trending.length > 0 && (
            <Rail title="Trending Now" href="/explore">
              {trending.map((d) => (
                <DramaCard key={d.id} drama={d} fixedWidth />
              ))}
            </Rail>
          )}

          {/* Browse by Mood */}
          <section aria-label="Browse by mood" id="moods" className="scroll-mt-24">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Watch by Mood</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {MOODS.map((m) => (
                <Link
                  key={m.slug}
                  href={`/mood/${m.slug}`}
                  className="card-hover group rounded-2xl border border-border bg-surface p-5 text-center"
                >
                  <div className="text-3xl" aria-hidden="true">{m.icon}</div>
                  <h3 className="mt-2 text-sm font-bold text-text group-hover:text-primary">{m.title}</h3>
                </Link>
              ))}
            </div>
          </section>

          {/* Curated collections — editorial */}
          <section aria-label="Curated collections" id="collections" className="scroll-mt-24">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Curated Collections</h2>
              <Link href="/explore" className="shrink-0 text-sm font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {COLLECTIONS.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collection/${c.slug}`}
                  className="card-hover group overflow-hidden rounded-2xl border border-border bg-surface p-5"
                >
                  <div className="text-3xl" aria-hidden="true">{c.icon}</div>
                  <h3 className="mt-3 text-lg font-bold text-text group-hover:text-primary">{c.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{c.description}</p>
                  <p className="mt-3 border-l-2 border-primary/50 pl-3 text-sm italic leading-relaxed text-text/80">
                    {c.note}
                  </p>
                  <span className="mt-3 inline-block text-sm font-semibold text-primary">
                    Explore →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Top rated */}
          {topImdb.length > 0 && (
            <Rail title="Top Rated" href="/top-imdb">
              {topImdb.slice(0, 12).map((d, i) => (
                <div key={d.id} className="relative w-36 shrink-0 sm:w-40">
                  <span className="absolute left-2 top-2 z-10 rounded-md bg-primary px-2 py-0.5 text-sm font-extrabold text-white" aria-label={`Rank ${i + 1}`}>
                    {i + 1}
                  </span>
                  <DramaCard drama={d} fixedWidth />
                </div>
              ))}
            </Rail>
          )}

          {/* New arrivals */}
          {freshArrivals.length > 0 && (
            <Rail title="New Arrivals" href="/new">
              {freshArrivals.map((d) => (
                <DramaCard key={d.id} drama={d} fixedWidth />
              ))}
            </Rail>
          )}

          {/* Hidden gems — highly rated, rarely saved */}
          {hiddenGems.length > 0 && (
            <Rail title="Hidden Gems" subtitle="Highly rated dramas flying under the radar" href="/top-imdb">
              {hiddenGems.map((d) => (
                <DramaCard key={d.id} drama={d} fixedWidth />
              ))}
            </Rail>
          )}

          {/* Browse by Trope */}
          <section aria-label="Browse by trope">
            <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Browse by Trope</h2>
            <div className="flex flex-wrap gap-2">
              {tropes.slice(0, 20).map((t) => {
                const icon = tropeIcon(t.trope);
                return (
                  <Link
                    key={t.trope}
                    href={`/trope/${encodeURIComponent(t.trope)}`}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    {icon && <span aria-hidden="true">{icon}</span>}
                    {t.trope} <span className="text-muted">({t.c.toLocaleString()})</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Browse by Genre */}
          <section aria-label="Browse by genre">
            <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Browse by Genre</h2>
            <div className="flex flex-wrap gap-2">
              {genres.slice(0, 20).map((g) => {
                const icon = genreIcon(g.genre);
                return (
                  <Link
                    key={g.genre}
                    href={`/genre/${encodeURIComponent(g.genre)}`}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    {icon && <span aria-hidden="true">{icon}</span>}
                    {g.genre} <span className="text-muted">({g.c.toLocaleString()})</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Browse by Platform */}
          <section aria-label="Browse by platform">
            <h2 className="mb-4 text-xl font-bold tracking-tight sm:text-2xl">Browse by Platform</h2>
            <div className="flex flex-wrap gap-2">
              {sortPlatforms(platforms).slice(0, 20).map((p) => {
                const logo = platformLogo(p.platform);
                return (
                  <Link
                    key={p.platform}
                    href={href(base, { platform: p.platform, page: undefined })}
                    className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
                  >
                    {logo ? (
                      <img src={logo} alt="" className="h-4 w-4 rounded-sm" loading="lazy" />
                    ) : (
                      <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-white" aria-hidden="true">
                        {platformInitial(p.platform)}
                      </span>
                    )}
                    {formatPlatform(p.platform)} <span className="text-muted">({p.c.toLocaleString()})</span>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>
          {/* Search/Browse results */}
          <section aria-label="Search results">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {q ? `Results for "${q}"` : platform ? formatPlatform(platform) : "All Dramas"}
                <span className="ml-2 text-sm font-normal text-muted">({total.toLocaleString()})</span>
              </h2>
              <div className="flex items-center gap-2">
                <SortSelect value={sort} />
                <EpRangeSelect value={epRange} />
                <Link
                  href={href(base, { videos: onlyWithVideos ? undefined : "1", page: undefined })}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold ${onlyWithVideos ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-primary"}`}
                >
                  ▶ Watchable only
                </Link>
              </div>
            </div>
            {platform && (
              <div className="mb-4">
                <Link href="/" className="text-sm text-primary hover:underline">← Clear filter</Link>
              </div>
            )}
            {dramas.length === 0 && !dbError ? (
              <div className="rounded-lg border border-border bg-surface p-10 text-center">
                <p className="text-base font-semibold text-text">No dramas found</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  {q
                    ? `Nothing matches "${q}". Try a different title, an actor's name, or browse by trope or genre instead.`
                    : "Try clearing the filters or browsing a different platform."}
                </p>
                <Link href="/" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-white hover:bg-primaryhover">
                  Browse all dramas
                </Link>
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
