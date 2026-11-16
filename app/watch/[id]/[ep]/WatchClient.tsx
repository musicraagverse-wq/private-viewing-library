"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Player from "@/components/Player";
import StreamErrorCard from "@/components/StreamErrorCard";
import { isResolvableSource } from "@/lib/stream";
import { useResolvedStream } from "@/lib/use-resolved-stream";
import { Poster } from "@/components/DramaCard";
import PlatformMark from "@/components/PlatformMark";
import { useSavedLists } from "@/components/SavedLists";

const RANGE = 20;

type UpNextItem = { id: string; title: string; poster_url: string | null };

/** Full-width favourite toggle, reusing the existing saved-lists mechanism. */
function FavoriteButton({ dramaId }: { dramaId: string }) {
  const { favourites, toggle } = useSavedLists();
  const isFav = favourites.has(dramaId);
  return (
    <button
      onClick={() => toggle(dramaId, "favourite")}
      aria-pressed={isFav}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-extrabold transition ${
        isFav
          ? "border-primary bg-primary text-black"
          : "border-border bg-surface text-text hover:border-primary"
      }`}
    >
      <span className="text-base leading-none">{isFav ? "♥" : "♡"}</span>
      {isFav ? "Favourited" : "Favourite"}
    </button>
  );
}

/** Facebook / X / WhatsApp / copy-link row. Share URL matches ShareButton (/s?d=...). */
function ShareRow({ dramaId, title }: { dramaId: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const url = origin ? `${window.location.origin}/s?d=${encodeURIComponent(dramaId)}` : "";

  function openShare(target: string) {
    if (!url) return;
    window.open(target, "_blank", "noopener,noreferrer,width=600,height=540");
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const circle =
    "flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold text-white transition hover:opacity-80";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-text">Share:</span>
      <button
        onClick={() =>
          openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
        }
        aria-label="Share on Facebook"
        title="Share on Facebook"
        className={`${circle} bg-[#1877F2]`}
      >
        f
      </button>
      <button
        onClick={() =>
          openShare(
            `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
          )
        }
        aria-label="Share on X"
        title="Share on X"
        className={`${circle} bg-black ring-1 ring-border`}
      >
        𝕏
      </button>
      <button
        onClick={() =>
          openShare(`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`)
        }
        aria-label="Share on WhatsApp"
        title="Share on WhatsApp"
        className={`${circle} bg-[#25D366]`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        onClick={copy}
        aria-label="Copy link"
        title={copied ? "Link copied!" : "Copy link"}
        className={`${circle} bg-surface text-text ring-1 ring-border hover:text-primary`}
      >
        {copied ? (
          <span className="text-sm">✓</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
            <path
              d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {copied && <span className="text-xs font-bold text-primary">Copied!</span>}
    </div>
  );
}

function EpisodeGrid({
  episode,
  totalEps,
  watched,
  onNavigate,
}: {
  episode: number;
  totalEps: number;
  watched: number[];
  onNavigate: (ep: number) => void;
}) {
  const count = totalEps > 0 ? totalEps : episode;
  const rangeCount = Math.max(1, Math.ceil(count / RANGE));
  const [rangeTab, setRangeTab] = useState<number | null>(null);
  // Follow the current episode across range boundaries (e.g. auto-advance
  // 20 -> 21); a manually picked tab sticks while the episode stays in it.
  const epRange = Math.floor((episode - 1) / RANGE);
  const range =
    rangeTab !== null && Math.floor((episode - 1) / RANGE) === rangeTab ? rangeTab : epRange;
  const start = range * RANGE + 1;
  const end = Math.min(count, (range + 1) * RANGE);
  const watchedSet = new Set(watched);

  return (
    <div className="space-y-3">
      {rangeCount > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Array.from({ length: rangeCount }, (_, r) => {
            const a = r * RANGE + 1;
            const b = Math.min(count, (r + 1) * RANGE);
            return (
              <button
                key={r}
                onClick={() => setRangeTab(r)}
                className={`text-sm font-bold transition ${
                  r === range ? "text-primary" : "text-muted hover:text-text"
                }`}
              >
                {a}–{b}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((ep) => {
          const isCurrent = ep === episode;
          const isWatched = !isCurrent && watchedSet.has(ep);
          return (
            <button
              key={ep}
              onClick={() => onNavigate(ep)}
              aria-label={`Episode ${ep}${isCurrent ? " (playing)" : isWatched ? " (watched)" : ""}`}
              className={`relative rounded-lg py-2.5 text-sm font-bold transition ${
                isCurrent
                  ? "bg-primary text-black"
                  : "border border-border bg-surface text-text hover:border-primary"
              }`}
            >
              {isCurrent ? (
                <span aria-hidden="true">❚❚</span>
              ) : (
                <>
                  {ep}
                  {isWatched && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 right-1 text-[10px] font-extrabold leading-none text-primary"
                    >
                      ✓
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  watchedEpisodes: number[];
}) {
  const router = useRouter();
  const [showUpNext, setShowUpNext] = useState(false);
  // Autoplay next episode: persisted, default ON (the previous behaviour was
  // unconditional auto-advance). When off, the video simply stops at the end.
  const [autoplay, setAutoplay] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem("sd_autoplay_next") !== "0" : true
  );
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
    <Player dramaId={dramaId} episode={episode} totalEps={totalEps} videoUrl={videoUrl} posterUrl={posterUrl} resumeAt={resumeAt} synopsis={synopsis} onEnded={onEnded} onNavigate={onNavigate} />
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
        synopsis={synopsis}
        onEnded={onEnded}
        onNavigate={onNavigate}
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
      <div className="mx-auto flex aspect-[9/16] max-h-[82vh] w-full max-w-[420px] items-center justify-center rounded-xl bg-black">
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
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Player + floating prev/next chevrons */}
      <div className="relative min-w-0">
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

      {/* Sidebar: title, tags, favourite, share, episodes
          (synopsis lives on the player image now, Hero-style) */}
      <aside className="min-w-0 space-y-4">
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

        <FavoriteButton dramaId={dramaId} />
        <ShareRow dramaId={dramaId} title={dramaTitle} />

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
  );
}
