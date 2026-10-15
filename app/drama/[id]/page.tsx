import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getDrama, getProgress, pingDb, getRelatedDramas } from "@/lib/db";
import { parseEpisodeUrls, dailymotionId } from "@/lib/types";
import DramaCard from "@/components/DramaCard";
import DramaHero from "@/components/DramaHero";
import PlatformMark from "@/components/PlatformMark";
import Rail from "@/components/Rail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const drama = await getDrama(decodeURIComponent(params.id));
    if (!drama) return { title: "Drama not found" };
    const desc = drama.synopsis?.slice(0, 160) ?? `Watch ${drama.title} — short drama.`;
    return {
      title: drama.title,
      description: desc,
      openGraph: {
        title: drama.title,
        description: desc,
        images: drama.poster_url ? [{ url: drama.poster_url, alt: drama.title }] : undefined,
      },
    };
  } catch {
    return { title: "Short Drama" };
  }
}

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

  // Cast from IMDB mapping
  let cast: { actor: string; character: string }[] = [];
  try {
    if (drama.cast_data) cast = JSON.parse(drama.cast_data);
  } catch {}

  // Genres + tropes
  let genreList: string[] = [];
  try {
    if (drama.genres) genreList = JSON.parse(drama.genres);
  } catch {}
  let tropeList: string[] = [];
  try {
    if ((drama as any).tropes) tropeList = JSON.parse((drama as any).tropes);
  } catch {}

  // More Like This: shared genres, tropes, cast
  let related: any[] = [];
  try {
    const { getRelatedDramas } = await import("@/lib/db");
    related = await getRelatedDramas(
      drama.id,
      genreList,
      tropeList,
      cast.map((c) => c.actor).filter(Boolean),
      12
    );
  } catch {}

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-muted hover:text-primary">← Back</Link>

      {/* Hero: poster/info, or embedded player + episode grid when watching */}
      <DramaHero
        dramaId={drama.id}
        title={drama.title}
        platform={drama.platform}
        posterUrl={drama.poster_url}
        episodeUrls={urls}
        episodeCount={epCount}
        resumeEp={resumeEp}
        hasProgress={!!progress}
        resumeSeconds={progress && progress.episode === resumeEp ? progress.position_seconds : 0}
        dailymotionId={dm}
        upNext={related.slice(0, 6).map((d: any) => ({ id: d.id, title: d.title, poster_url: d.poster_url }))}
      />

      {/* Synopsis */}
      {drama.synopsis && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Synopsis</h2>
          <p className="max-w-4xl text-sm leading-relaxed text-text/90">{drama.synopsis}</p>
        </section>
      )}

      {/* Cast */}
      {cast.length > 0 && (
        <section aria-label="Cast">
          <h2 className="mb-3 text-xl font-bold">Cast</h2>
          <div className="flex flex-wrap gap-2">
            {cast.map((c, i) => (
              <Link
                key={i}
                href={`/actor/${encodeURIComponent(c.actor)}`}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm transition-colors hover:border-primary hover:text-primary"
              >
                <span className="font-semibold">{c.actor}</span>
                {c.character && <span className="text-muted"> as {c.character}</span>}
              </Link>
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
        <section aria-label="Genres">
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

      {/* Tropes */}
      {tropeList.length > 0 && (
        <section aria-label="Tropes">
          <h2 className="mb-3 text-xl font-bold">Tropes</h2>
          <div className="flex flex-wrap gap-2">
            {tropeList.map((t) => (
              <Link
                key={t}
                href={`/trope/${encodeURIComponent(t)}`}
                className="rounded-full border border-border bg-surface px-4 py-1.5 text-sm hover:border-primary hover:text-primary"
              >
                {t}
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
            <span className="text-sm text-primary font-semibold">
              {drama.platform ? <PlatformMark platform={drama.platform} /> : "—"}
            </span>
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

      {/* More Like This */}
      {related.length > 0 && (
        <Rail title="More Like This">
          {related.map((d: any) => (
            <DramaCard key={d.id} drama={d} fixedWidth />
          ))}
        </Rail>
      )}
    </div>
  );
}
