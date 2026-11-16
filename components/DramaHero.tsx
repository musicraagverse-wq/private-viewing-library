"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import dynamic from "next/dynamic";

const Player = dynamic(() => import("@/components/Player"), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video items-center justify-center rounded-xl bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-label="Loading player" />
    </div>
  ),
});
import { Poster } from "@/components/DramaCard";
import PlatformMark from "@/components/PlatformMark";
import EpisodeGrid from "@/components/EpisodeGrid";
import FavoriteButton from "@/components/FavoriteButton";
import ShareRow from "@/components/ShareRow";
import RatingButtons from "@/components/RatingButtons";
import StreamErrorCard from "@/components/StreamErrorCard";
import HideDmToggle from "@/components/HideDmToggle";
import { useResolvedStream } from "@/lib/use-resolved-stream";
import { isResolvableSource } from "@/lib/stream";

type UpNextItem = { id: string; title: string; poster_url: string | null };

export default function DramaHero({
  dramaId,
  title,
  platform,
  posterUrl,
  episodeUrls,
  episodeCount,
  resumeEp,
  hasProgress,
  resumeSeconds,
  dailymotionId,
  dmHidden,
  upNext,
  source,
  episodeIds,
  synopsis,
  genres,
  tropes,
  cast,
  watchedEpisodes,
}: {
  dramaId: string;
  title: string;
  platform: string | null;
  posterUrl: string | null;
  episodeUrls: string[];
  episodeCount: number;
  resumeEp: number;
  hasProgress: boolean;
  resumeSeconds: number;
  dailymotionId: string | null;
  /** True when this drama is Dailymotion-only and the user turned on
   *  "Hide Dailymotion" — the redirect is suppressed, not offered. */
  dmHidden?: boolean;
  upNext: UpNextItem[];
  /** Row source; resolvable rows fetch a fresh stream at watch time. */
  source: string | null;
  /** Parsed episode_ids map, or null when the row has none. */
  episodeIds: Record<string, number> | null;
  /** Synopsis for the watch sidebar. */
  synopsis: string | null;
  /** Canonical genre/trope labels for the watch sidebar. */
  genres: string[];
  tropes: string[];
  /** Cast for the watch sidebar. */
  cast: { actor: string; character: string | null }[];
  /** Episodes the user has watched (checkmarks), from watch_progress. */
  watchedEpisodes: number[];
}) {
  const [watching, setWatching] = useState(false);
  const [episode, setEpisode] = useState(resumeEp);
  const [showUpNext, setShowUpNext] = useState(false);
  // Backdrop: res.chartdrama.com throws random 403s — hide the blurred
  // backdrop img on error instead of leaving a broken black slab.
  const [backdropFailed, setBackdropFailed] = useState(false);
  // Autoplay next episode: persisted, default ON (same key as the watch page).
  const [autoplay, setAutoplay] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sd_autoplay_next") !== "0" : true
  );

  // Resolvable rows: episode count from the map, fresh stream per episode.
  const resolvable =
    isResolvableSource(source) &&
    episodeIds != null &&
    Object.keys(episodeIds).length > 0;
  const totalEps = resolvable
    ? Object.keys(episodeIds).length
    : episodeUrls.length || episodeCount;
  const isLastEp = totalEps > 0 && episode >= totalEps;
  const videoUrl = episode >= 1 && episode <= episodeUrls.length ? episodeUrls[episode - 1] : null;

  const startWatching = useCallback((ep: number) => {
    setEpisode(ep);
    setShowUpNext(false);
    setWatching(true);
  }, []);

  const onEnded = useCallback(() => {
    if (isLastEp) {
      setShowUpNext(true);
    } else if (autoplay && totalEps > 0) {
      setEpisode((e) => e + 1);
      setShowUpNext(false);
    }
    // Autoplay off: the video simply stops at the end.
  }, [isLastEp, totalEps, autoplay]);

  function toggleAutoplay() {
    setAutoplay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sd_autoplay_next", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  const onNavigate = useCallback((ep: number) => {
    setEpisode(ep);
    setShowUpNext(false);
  }, []);

  const { status, stream, error, retry } = useResolvedStream(
    dramaId,
    episode,
    resolvable && watching && !showUpNext
  );

  // Legacy player: stored URL. Resolvable rows use a fresh stream instead.
  const legacyPlayer = videoUrl ? (
    <Player
      dramaId={dramaId}
      episode={episode}
      totalEps={totalEps}
      videoUrl={videoUrl}
      posterUrl={posterUrl}
      resumeAt={episode === resumeEp ? resumeSeconds : 0}
      onEnded={onEnded}
      onNavigate={onNavigate}
      onClose={() => setWatching(false)}
    />
  ) : (
    <div className="rounded-xl bg-card p-10 text-center">
      {dmHidden ? (
        <>
          <p className="text-lg font-extrabold text-text">Only on Dailymotion</p>
          <p className="mt-2 text-sm font-semibold text-muted">Hidden by your Dailymotion filter — turn it off to watch here.</p>
          <div className="mt-4 flex justify-center">
            <HideDmToggle />
          </div>
        </>
      ) : (
        <p className="text-lg font-extrabold text-text">No video available yet</p>
      )}
    </div>
  );

  const heroPlayer = !resolvable ? (
    legacyPlayer
  ) : status === "ready" && stream ? (
    <Player
      dramaId={dramaId}
      episode={episode}
      totalEps={totalEps}
      videoUrl={stream.url}
      format={stream.format}
      posterUrl={posterUrl}
      resumeAt={episode === resumeEp ? resumeSeconds : 0}
      onEnded={onEnded}
      onNavigate={onNavigate}
      onClose={() => setWatching(false)}
    />
  ) : status === "error" && error ? (
    error.code === "not_resolvable" ? (
      legacyPlayer
    ) : (
      <StreamErrorCard
        error={error}
        episode={episode}
        totalEps={totalEps}
        onRetry={retry}
        onNextEpisode={!isLastEp ? () => onNavigate(episode + 1) : undefined}
      />
    )
  ) : (
    <div className="mx-auto flex aspect-[9/16] max-h-[82vh] w-full max-w-[420px] items-center justify-center rounded-xl bg-black">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-label="Loading video" />
      <span className="ml-3 text-sm font-semibold text-muted">Loading episode…</span>
    </div>
  );

  // ---------- Watch mode: embedded player + episode grid (EveryDrama style) ----------
  if (watching) {
    const tags = [...genres, ...tropes];
    return (
      <section className="animate-fade-up rounded-lg border border-border bg-surface p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0">
            {showUpNext ? (
              <div className="w-full select-none overflow-hidden rounded-xl bg-black p-6">
                <p className="text-center text-lg font-extrabold text-white">
                  Up next <span className="font-semibold text-muted">· free to watch</span>
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  {upNext.map((d) => (
                    <Link
                      key={d.id}
                      href={`/drama/${encodeURIComponent(d.id)}`}
                      className="flex items-center gap-3 rounded-lg bg-surface p-2 transition hover:border-primary"
                    >
                      <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md">
                        <Poster title={d.title} posterUrl={d.poster_url} className="h-full w-full" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text">
                        {d.title}
                      </span>
                      <span className="shrink-0 px-2 text-sm font-bold text-primary">▶ Play</span>
                    </Link>
                  ))}
                  {upNext.length === 0 && (
                    <p className="text-center text-sm text-muted">No recommendations yet.</p>
                  )}
                </div>
                <button
                  onClick={() => setShowUpNext(false)}
                  className="mt-6 w-full rounded-lg border border-border py-2.5 text-sm font-semibold text-muted hover:text-text"
                >
                  Replay episode {episode}
                </button>
              </div>
            ) : (
              heroPlayer
            )}
          </div>

          <aside className="min-w-0 space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-text">{title}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm">
                {platform && (
                  <span className="rounded-md border border-border bg-surface px-2.5 py-1 font-semibold text-text">
                    <PlatformMark platform={platform} />
                  </span>
                )}
                <span className="text-muted">
                  {totalEps > 0 ? `${totalEps} Episodes` : "Episodes unknown"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => episode > 1 && onNavigate(episode - 1)}
                disabled={episode <= 1}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold text-text disabled:opacity-30"
              >
                ‹ Prev
              </button>
              <p className="flex-1 text-center text-sm font-bold text-text">
                Episode {episode}{totalEps > 0 ? ` of ${totalEps}` : ""}
              </p>
              <button
                onClick={() => (totalEps === 0 || episode < totalEps) && onNavigate(episode + 1)}
                disabled={totalEps > 0 && episode >= totalEps}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-bold text-text disabled:opacity-30"
              >
                Next ›
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            {synopsis && (
              <p className="text-sm leading-relaxed text-text/90">{synopsis}</p>
            )}

            <FavoriteButton dramaId={dramaId} />
            <ShareRow dramaId={dramaId} title={title} />

            {cast.length > 0 && (
              <div className="border-t border-border pt-4">
                <h2 className="text-base font-extrabold text-text">Cast</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {cast.map((c, i) => (
                    <Link
                      key={i}
                      href={`/actor/${encodeURIComponent(c.actor)}`}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
                    >
                      <span className="font-semibold">{c.actor}</span>
                      {c.character && <span className="text-muted"> as {c.character}</span>}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-extrabold text-text">All Episodes</h2>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-muted">
                  Autoplay next
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoplay}
                    aria-label="Autoplay next episode"
                    onClick={toggleAutoplay}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      autoplay ? "bg-primary" : "bg-border"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        autoplay ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>
              <div className="mt-3">
                <EpisodeGrid
                  episode={episode}
                  totalEps={totalEps}
                  watched={watchedEpisodes}
                  onNavigate={onNavigate}
                />
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  // ---------- Browse mode: cinematic backdrop + poster + info (default) ----------
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border">
      {/* Ambient backdrop: blurred poster */}
      {posterUrl && !backdropFailed && (
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src={posterUrl}
            alt=""
            onError={() => setBackdropFailed(true)}
            className="h-full w-full scale-110 object-cover blur-2xl brightness-[0.35] saturate-150"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" aria-hidden="true" />

      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="w-40 shrink-0 sm:w-52">
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10">
              <Poster title={title} posterUrl={posterUrl} className="h-full w-full" />
            </div>
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{title}</h1>
            <div className="mt-2 text-sm font-semibold text-primary">
              {platform ? <PlatformMark platform={platform} /> : ""}
            </div>
            <div className="mt-1 text-sm text-white/60">
              {episodeCount > 0 ? `${episodeCount} Episodes` : "Episodes unknown"}
            </div>

            <div className="mt-6">
              {episodeUrls.length > 0 || resolvable ? (
                <button
                  onClick={() => startWatching(resumeEp)}
                  className="inline-block rounded-full bg-primary px-8 py-3 text-sm font-bold text-black shadow-lg shadow-primary/30 transition hover:bg-primaryhover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  ▶ {hasProgress ? `Resume EP ${resumeEp}` : "Watch All Episodes"}
                </button>
              ) : dmHidden ? (
                <div className="space-y-3">
                  <span className="inline-block rounded-full border border-white/25 bg-white/5 px-8 py-3 text-sm font-semibold text-white/70">
                    Only on Dailymotion — hidden by your filter
                  </span>
                  <div className="flex justify-center">
                    <HideDmToggle />
                  </div>
                </div>
              ) : dailymotionId ? (
                <a
                  href={`https://www.dailymotion.com/video/${dailymotionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-full bg-gold px-8 py-3 text-sm font-bold text-black hover:opacity-90"
                >
                  ◈ Watch on Dailymotion
                </a>
              ) : (
                <span className="inline-block rounded-full border border-white/25 bg-white/5 px-8 py-3 text-sm font-semibold text-white/70">
                  Not streaming here yet
                </span>
              )}
            </div>

            <div className="mt-4">
              <RatingButtons dramaId={dramaId} title={title} />
            </div>
          </div>
        </div>

        {/* Episodes — tap a number to play it right here */}
        {(() => {
          const gridEps = resolvable ? totalEps : episodeUrls.length;
          return gridEps > 0 ? (
            <div className="mt-6">
              <h2 className="mb-3 text-lg font-bold text-white">
                Episodes <span className="text-sm font-semibold text-white/50">({gridEps})</span>
              </h2>
              <EpisodeGrid
                episode={resumeEp}
                totalEps={gridEps}
                watched={watchedEpisodes}
                onNavigate={startWatching}
              />
            </div>
          ) : null;
        })()}
      </div>
    </section>
  );
}
