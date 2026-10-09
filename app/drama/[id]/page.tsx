import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getDrama, getDuplicatesOf, getProgress, pingDb } from "@/lib/db";
import { parseEpisodeUrls, dailymotionId } from "@/lib/types";
import { Poster, SourceBadge } from "@/components/DramaCard";

export const dynamic = "force-dynamic";

export default async function DramaDetail({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  let drama;
  try {
    await pingDb();
    drama = await getDrama(id);
  } catch {
    return (
      <div className="glass rounded-xl p-10 text-center text-sm text-amber-300">
        Library database is busy (bulk import in progress). Please refresh in a moment.
      </div>
    );
  }
  if (!drama) notFound();

  // Redirect duplicates to the primary record
  if (drama.is_duplicate && drama.duplicate_of) {
    redirect(`/drama/${encodeURIComponent(drama.duplicate_of)}`);
  }

  const urls = parseEpisodeUrls(drama.episode_urls);
  const epCount = urls.length || drama.episode_count || 0;
  const progress = await getProgress(drama.id);
  const resumeEp = progress ? progress.episode : 1;
  const altVersions = await getDuplicatesOf(drama.id);
  const dm = dailymotionId(drama.alt_source);

  const episodes: number[] = [];
  for (let i = 1; i <= epCount; i++) episodes.push(i);

  return (
    <div className="space-y-8">
      <Link href="/" className="text-sm text-muted hover:text-marquee">← Back to collection</Link>

      <section className="ticket flex flex-col gap-6 p-6 sm:flex-row">
        <div className="w-40 shrink-0 sm:w-52">
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <Poster title={drama.title} posterUrl={drama.poster_url} className="h-full w-full" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={drama.source} />
            {altVersions.length > 0 && (
              <span className="text-xs text-muted">
                Also on:{" "}
                {altVersions.map((v) => (
                  <span key={v.id} className="mr-1 rounded-full bg-seat px-2 py-0.5 text-[11px] font-bold text-cream">
                    {v.source ?? "other"}
                  </span>
                ))}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl tracking-wide sm:text-3xl">{drama.title}</h1>
          <div className="mt-2 text-sm text-muted">
            {epCount > 0 ? `${epCount} episodes` : "Episodes unknown"}
            {drama.platform ? ` · ${drama.platform}` : ""}
          </div>
          {drama.synopsis && <p className="mt-4 max-w-3xl text-sm leading-relaxed text-cream/80">{drama.synopsis}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            {urls.length > 0 ? (
              <Link
                href={`/watch/${encodeURIComponent(drama.id)}/${resumeEp}`}
                className="rounded-lg bg-marquee px-6 py-2.5 text-sm font-bold text-screen hover:bg-spotlight"
              >
                ▶ {progress ? `Resume EP ${resumeEp}` : "Play EP 1"}
              </Link>
            ) : dm ? (
              <Link
                href={`/watch/${encodeURIComponent(drama.id)}/1`}
                className="rounded-lg bg-marqueeDim px-6 py-2.5 text-sm font-bold text-cream hover:bg-marquee hover:text-screen"
              >
                ◈ Play via Dailymotion
              </Link>
            ) : (
              <span className="rounded-lg border border-rope px-6 py-2.5 text-sm font-bold text-muted">
                No video available yet
              </span>
            )}
          </div>
          {dm && urls.length === 0 && (
            <p className="mt-2 text-xs text-muted">Alternative source: Dailymotion{drama.alt_source_title ? ` — ${drama.alt_source_title}` : ""}</p>
          )}
        </div>
      </section>

      {episodes.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl tracking-wide">Episodes</h2>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {episodes.map((n) => {
              const watched = progress && n < progress.episode;
              const current = progress && n === progress.episode;
              return (
                <Link
                  key={n}
                  href={`/watch/${encodeURIComponent(drama.id)}/${n}`}
                  className={`ticket rounded-lg py-2 text-center text-sm font-bold transition-colors hover:border-marquee/60 hover:text-marquee ${
                    current ? "border-marquee/60 text-marquee" : watched ? "text-muted/50" : "text-cream"
                  }`}
                >
                  {n}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
