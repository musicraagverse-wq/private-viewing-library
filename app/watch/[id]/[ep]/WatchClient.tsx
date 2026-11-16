"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Player from "@/components/Player";
import StreamErrorCard from "@/components/StreamErrorCard";
import { isResolvableSource } from "@/lib/stream";
import { useResolvedStream } from "@/lib/use-resolved-stream";
import { Poster } from "@/components/DramaCard";
import PlatformMark from "@/components/PlatformMark";

import EpisodeGrid from "@/components/EpisodeGrid";
import FavoriteButton from "@/components/FavoriteButton";
import ShareRow from "@/components/ShareRow";

type UpNextItem = { id: string; title: string; poster_url: string | null };

export default function WatchClient({
  dramaId,
  dramaTitle,
  platform,
  posterUrl,
  episode,
  totalEps,
  videoUrl,
  dailymotionEmbed,
  resumeAt,
  upNext,
  source,
  episodeIds,
  genres,
  tropes,
  synopsis,
  cast,
  related,
  watchedEpisodes,
}: {
  dramaId: string;
  dramaTitle: string;
  platform: string | null;
  posterUrl: string | null;
  episode: number;
  totalEps: number;
  videoUrl: string | null;
  dailymotionEmbed: string | null;
  resumeAt: number;
  upNext: UpNextItem[];
  /** Row source; resolvable rows fetch a fresh stream at watch time. */
  source: string | null;
  /** Parsed episode_ids map, or null when the row has none. */
  episodeIds: Record<string, number> | null;
  genres: string[];
  tropes: string[];
  synopsis: string | null;
  /** Cast from the IMDb mapping (same JSON column the detail page reads). */
  cast: { actor: string; character: string }[];
  /** More Like This, same scoring as the detail page. */
  related: UpNextItem[];
  watchedEpisodes: number[];
}) {
  const router = useRouter();
  const [showUpNext, setShowUpNext] = useState(false);
  // Autoplay next episode: persisted, default ON (the previous behaviour was
  // unconditional auto-advance). When off, the video simply stops at the end.
  const [autoplay, setAutoplay] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sd_autoplay_next") !== "0" : true
  );
  // Theater mode: hides the sidebar for a distraction-free view (the player
  // itself is already full-height, so there is nothing wider to grow into).
  const [theater, setTheater] = useState(false);
  const isLastEp = totalEps > 0 && episode >= totalEps;

  // Resolvable rows (anydrama/dramadb with stored episodeIds) never play the
  // stored URL — it expires ~6h after issue. Resolve fresh per episode.
  const resolvable =
    isResolvableSource(source) &&
    episodeIds != null &&
    episodeIds[String(episode)] != null;
  const { status, stream, error, retry } = useResolvedStream(
    dramaId,
    episode,
    resolvable && !showUpNext
  );

  const onEnded = useCallback(() => {
    if (isLastEp) {
      setShowUpNext(true);
    } else if (autoplay && totalEps > 0) {
      router.push(`/watch/${encodeURIComponent(dramaId)}/${episode + 1}`);
    }
  }, [router, dramaId, episode, totalEps, isLastEp, autoplay]);

  const onNavigate = useCallback((ep: number) => {
    setShowUpNext(false);
    router.push(`/watch/${encodeURIComponent(dramaId)}/${ep}`);
  }, [router, dramaId]);

  function toggleAutoplay() {
    setAutoplay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sd_autoplay_next", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  // Legacy path: stored URLs / Dailymotion — unchanged for all 88k legacy rows.
  const legacyArea = videoUrl ? (
    <Player dramaId={dramaId} episode={episode} totalEps={totalEps} videoUrl={videoUrl} posterUrl={posterUrl} resumeAt={resumeAt} onEnded={onEnded} onNavigate={onNavigate} onTheaterChange={setTheater} fullWidthBar />
  ) : dailymotionEmbed ? (
    <div className="rounded-xl bg-card p-10 text-center">
      <div className="text-4xl mb-4">🎬</div>
      <p className="text-lg font-extrabold text-text">Available on Dailymotion</p>
      <p className="mt-2 text-sm font-semibold text-muted">Dailymotion blocks embeds, but you can watch it there directly! 👇</p>
      <a
        href={`https://www.dailymotion.com/video/${dailymotionEmbed.split("/").pop()}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block rounded-lg bg-primary px-8 py-3 text-sm font-extrabold text-black hover:bg-primaryhover"
      >
        ▶ Watch on Dailymotion
      </a>
    </div>
  ) : (
    <div className="rounded-xl bg-card p-10 text-center">
      <div className="text-4xl mb-4">🎭</div>
      <p className="text-lg font-extrabold text-text">No video available yet</p>
      <p className="mt-2 text-sm font-semibold text-muted">Check back soon! We're working on it. 🔄</p>
    </div>
  );

  // Resolvable rows: fresh stream per episode; never the expired stored URL.
  const resolveArea =
    status === "ready" && stream ? (
      <Player
        dramaId={dramaId}
        episode={episode}
        totalEps={totalEps}
        videoUrl={stream.url}
        format={stream.format}
        posterUrl={posterUrl}
        resumeAt={resumeAt}
        onEnded={onEnded}
        onNavigate={onNavigate}
        onTheaterChange={setTheater}
        fullWidthBar
      />
    ) : status === "error" && error ? (
      error.code === "not_resolvable" ? (
        legacyArea
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
      <div className="mx-auto flex aspect-[9/16] max-h-[100dvh] w-full max-w-[56.25dvh] items-center justify-center rounded-xl bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" aria-label="Loading video" />
        <span className="ml-3 text-sm font-semibold text-muted">Loading episode…</span>
      </div>
    );

  const playerArea = showUpNext ? (
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
  ) : resolvable ? (
    resolveArea
  ) : (
    legacyArea
  );

  const tags = [...genres, ...tropes];

  return (
    <div className="grid gap-6 lg:h-dvh lg:grid-cols-[1fr_400px]">
      {/* Player + floating prev/next chevrons + overlaid back arrow (reference style) */}
      <div className="relative min-w-0">
        <Link
          href={`/drama/${encodeURIComponent(dramaId)}`}
          aria-label="Back to drama"
          className="absolute left-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80"
        >
          ←
        </Link>
        {playerArea}
        <div className="absolute right-0 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          <button
            onClick={() => episode > 1 && onNavigate(episode - 1)}
            disabled={episode <= 1}
            aria-label="Previous episode"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden="true">
              <path d="M18 15l-6-6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={() => (totalEps === 0 || episode < totalEps) && onNavigate(episode + 1)}
            disabled={totalEps > 0 && episode >= totalEps}
            aria-label="Next episode"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-xl text-white transition hover:bg-black/80 disabled:opacity-30"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5" aria-hidden="true">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar: title, tags, synopsis, favourite, share, episodes.
          Hidden in theater mode; scrolls on its own when taller than the viewport. */}
      {!theater && (
      <aside className="min-w-0 space-y-4 lg:h-dvh lg:overflow-y-auto lg:py-6 lg:pr-2">
        <div>
          <h1 className="text-xl font-extrabold text-text sm:text-2xl">{dramaTitle}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-1 text-sm">
            <button
              onClick={() => episode > 1 && onNavigate(episode - 1)}
              disabled={episode <= 1}
              aria-label="Previous episode"
              className="rounded-md px-2 py-1 text-lg font-bold leading-none text-text transition hover:bg-surface disabled:opacity-30"
            >
              ‹
            </button>
            <span className="font-bold text-primary">
              Episode {episode}{totalEps > 0 ? ` / ${totalEps}` : ""}
            </span>
            <button
              onClick={() => (totalEps === 0 || episode < totalEps) && onNavigate(episode + 1)}
              disabled={totalEps > 0 && episode >= totalEps}
              aria-label="Next episode"
              className="rounded-md px-2 py-1 text-lg font-bold leading-none text-text transition hover:bg-surface disabled:opacity-30"
            >
              ›
            </button>
            {platform && (
              <span className="ml-2 rounded-md border border-border bg-surface px-2.5 py-1 font-semibold text-text">
                <PlatformMark platform={platform} />
              </span>
            )}
          </div>
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
        <ShareRow dramaId={dramaId} title={dramaTitle} />

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

        {related.length > 0 && (
          <div className="border-t border-border pt-4">
            <h2 className="text-base font-extrabold text-text">More Like This</h2>
            <div className="mt-3 flex flex-col gap-2">
              {related.map((d) => (
                <Link
                  key={d.id}
                  href={`/drama/${encodeURIComponent(d.id)}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2 transition hover:border-primary"
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
            </div>
          </div>
        )}
      </aside>
      )}
    </div>
  );
}
