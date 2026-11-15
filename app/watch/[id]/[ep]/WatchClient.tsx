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

type UpNextItem = { id: string; title: string; poster_url: string | null };

function EpisodeGrid({
  episode,
  totalEps,
  onNavigate,
}: {
  episode: number;
  totalEps: number;
  onNavigate: (ep: number) => void;
}) {
  const count = totalEps > 0 ? totalEps : episode;
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-6">
      {Array.from({ length: count }, (_, i) => i + 1).map((ep) => (
        <button
          key={ep}
          onClick={() => onNavigate(ep)}
          className={`rounded-lg py-2.5 text-sm font-bold transition ${
            ep === episode
              ? "bg-primary text-black"
              : "bg-surface text-text hover:border-primary"
          } border border-border`}
        >
          {ep}
        </button>
      ))}
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
}) {
  const router = useRouter();
  const [showUpNext, setShowUpNext] = useState(false);
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
    if (!isLastEp && totalEps > 0) {
      router.push(`/watch/${encodeURIComponent(dramaId)}/${episode + 1}`);
    } else if (isLastEp) {
      setShowUpNext(true);
    }
  }, [router, dramaId, episode, totalEps, isLastEp]);

  const onNavigate = useCallback((ep: number) => {
    setShowUpNext(false);
    router.push(`/watch/${encodeURIComponent(dramaId)}/${ep}`);
  }, [router, dramaId]);

  // Legacy path: stored URLs / Dailymotion — unchanged for all 88k legacy rows.
  const legacyArea = videoUrl ? (
    <Player dramaId={dramaId} episode={episode} totalEps={totalEps} videoUrl={videoUrl} posterUrl={posterUrl} resumeAt={resumeAt} onEnded={onEnded} onNavigate={onNavigate} />
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Player */}
      <div className="min-w-0">{playerArea}</div>

      {/* Sidebar: title, platform, episode nav + grid */}
      <aside className="min-w-0 space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-text sm:text-2xl">{dramaTitle}</h1>
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

        <EpisodeGrid episode={episode} totalEps={totalEps} onNavigate={onNavigate} />
      </aside>
    </div>
  );
}
