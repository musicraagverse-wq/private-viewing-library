import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getDrama, getDuplicatesOf, getProgress, pingDb, browseByGenre, getPlatforms } from "@/lib/db";
import { parseEpisodeUrls, dailymotionId } from "@/lib/types";
import { Poster } from "@/components/DramaCard";
import DramaCard from "@/components/DramaCard";

export const dynamic = "force-dynamic";

export default async function DramaDetail({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let drama;
  try {
    await pingDb();
    drama = await getDrama(id);
  } catch {
    return (
      <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-primary">
        Database is busy. Please refresh in a moment.
      </div>
    );
  }
  if (!drama) notFound();

  if (drama.is_duplicate && drama.duplicate_of) {
    redirect(`/drama/${encodeURIComponent(drama.duplicate_of)}`);
  }

  const urls = parseEpisodeUrls(drama.episode_urls);
  const epCount = urls.length || drama.episode_count || 0;
  const progress = await getProgress(drama.id);
  const resumeEp = progress ? progress.episode : 1;
  const dm = dailymotionId(drama.alt_source);

  const episodes: number[] = [];
  for (let i = 1; i <= Math.min(epCount, 100); i++) episodes.push(i);

  // Cast from IMDB mapping
  let cast: { actor: string; character: string }[] = [];
  try {
    if (drama.cast_data) cast = JSON.parse(drama.cast_data);
  } catch {}

  // Related: same platform
  let moreFromPlatform: any[] = [];
  let popular: any[] = [];
  try {
    if (drama.platform) {
      const { browseDramas } = await import("@/lib/db");
      moreFromPlatform = (await browseDramas({ q: "", source: "", platform: drama.platform, page: 1, perPage: 12, onlyWithVideos: false }))
        .filter((d: any) => d.id !== drama.id).slice(0, 6);
    }
    // Popular: get some with videos
    const { browseDramas } = await import("@/lib/db");
    popular = (await browseDramas({ q: "", source: "", platform: "", page: 1, perPage: 12, onlyWithVideos: true }))
      .filter((d: any) => d.id !== drama.id).slice(0, 6);
  } catch {}

  // Genres list
  let genreList: string[] = [];
  try {
    if (drama.genres) genreList = JSON.parse(drama.genres);
  } catch {}

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-muted hover:text-primary">← Back</Link>

      {/* Main info */}
      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="w-40 shrink-0 sm:w-52">
            <div className="aspect-[3/4] overflow-hidden rounded-lg">
              <Poster title={drama.title} posterUrl={drama.poster_url} className="h-full w-full" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold sm:text-3xl">{drama.title}</h1>
            <div className="mt-2 text-sm text-primary font-semibold">
              {drama.platform ?? ""}
            </div>
            <div className="mt-1 text-sm text-muted">
              {epCount > 0 ? `${epCount} Episodes` : "Episodes unknown"}
            </div>

            <div className="mt-6">
              {urls.length > 0 ? (
                <Link
                  href={`/watch/${encodeURIComponent(drama.id)}/${resumeEp}`}
                  className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primarydark"
                >
                  ▶ {progress ? `Resume EP ${resumeEp}` : "Watch All Episodes"}
                </Link>
              ) : dm ? (
                <Link
                  href={`/watch/${encodeURIComponent(drama.id)}/1`}
                  className="inline-block rounded-lg bg-gold px-8 py-3 text-sm font-bold text-black hover:opacity-90"
                >
                  ◈ Watch on Dailymotion
                </Link>
              ) : (
                <span className="inline-block rounded-lg border border-border px-8 py-3 text-sm font-semibold text-muted">
                  Not streaming here yet
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Synopsis */}
      {drama.synopsis && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Synopsis</h2>
          <p className="max-w-4xl text-sm leading-relaxed text-text/90">{drama.synopsis}</p>
        </section>
      )}

      {/* Cast */}
      {cast.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Cast</h2>
          <div className="flex flex-wrap gap-2">
            {cast.map((c, i) => (
              <span key={i} className="rounded-full border border-border bg-surface px-4 py-2 text-sm">
                <span className="font-semibold">{c.actor}</span>
                {c.character && <span className="text-muted"> as {c.character}</span>}
              </span>
            ))}
          </div>
          {drama.imdb_id && (
            <a
              href={`https://www.imdb.com/title/${drama.imdb_id}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-primary hover:underline"
            >
              View on IMDB →
            </a>
          )}
        </section>
      )}

      {/* Genres */}
      {genreList.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Genres</h2>
          <div className="flex flex-wrap gap-2">
            {genreList.map((g) => (
              <Link
                key={g}
                href={`/genre/${encodeURIComponent(g)}`}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm hover:border-primary hover:text-primary"
              >
                {g}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Where to Watch */}
      <section>
        <h2 className="mb-3 text-xl font-bold">Where to Watch</h2>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold">Primary Platform</span>
            <span className="text-sm text-primary font-semibold">{drama.platform ?? "—"}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border py-2">
            <span className="text-sm font-semibold">Episodes</span>
            <span className="text-sm text-muted">{epCount > 0 ? `${epCount} Episodes` : "—"}</span>
          </div>
          {urls.length > 0 && (
            <div className="flex items-center justify-between border-t border-border py-2">
              <span className="text-sm font-semibold">Status</span>
              <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white">▶ Free</span>
            </div>
          )}
        </div>
      </section>

      {/* Episodes */}
      {episodes.length > 0 && urls.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Episodes</h2>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {episodes.map((n) => {
              const watched = progress && n < progress.episode;
              const current = progress && n === progress.episode;
              return (
                <Link
                  key={n}
                  href={`/watch/${encodeURIComponent(drama.id)}/${n}`}
                  className={`rounded-lg border py-2 text-center text-sm font-bold transition-colors hover:border-primary hover:text-primary ${
                    current ? "border-primary text-primary" : watched ? "border-border text-muted/50" : "border-border text-text"
                  }`}
                >
                  {n}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* More from platform */}
      {moreFromPlatform.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">More from {drama.platform}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {moreFromPlatform.map((d: any) => (
              <DramaCard key={d.id} drama={d} />
            ))}
          </div>
        </section>
      )}

      {/* Popular */}
      {popular.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Popular & New Short Dramas</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {popular.map((d: any) => (
              <DramaCard key={d.id} drama={d} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
