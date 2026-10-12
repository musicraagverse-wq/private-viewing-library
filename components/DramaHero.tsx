"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import Player from "@/components/Player";
import { Poster } from "@/components/DramaCard";
import PlatformMark from "@/components/PlatformMark";

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
  upNext,
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
  upNext: UpNextItem[];
}) {
  const [watching, setWatching] = useState(false);
  const [episode, setEpisode] = useState(resumeEp);
  const [showUpNext, setShowUpNext] = useState(false);

  const totalEps = episodeUrls.length || episodeCount;
  const isLastEp = totalEps > 0 && episode >= totalEps;
  const videoUrl = episode >= 1 && episode <= episodeUrls.length ? episodeUrls[episode - 1] : null;

  const startWatching = useCallback((ep: number) => {
    setEpisode(ep);
    setShowUpNext(false);
    setWatching(true);
  }, []);

  const onEnded = useCallback(() => {
    if (!isLastEp && totalEps > 0) {
      setEpisode((e) => e + 1);
      setShowUpNext(false);
    } else if (isLastEp) {
      setShowUpNext(true);
    }
  }, [isLastEp, totalEps]);

  const onNavigate = useCallback((ep: number) => {
    setEpisode(ep);
    setShowUpNext(false);
  }, []);

  // ---------- Watch mode: embedded player + episode grid (EveryDrama style) ----------
  if (watching) {
    const gridCount = totalEps > 0 ? totalEps : episode;
    return (
      <section className="rounded-lg border border-border bg-surface p-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
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
                      <span className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
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
            ) : videoUrl ? (
              <Player
                dramaId={dramaId}
                episode={episode}
                videoUrl={videoUrl}
                resumeAt={episode === resumeEp ? resumeSeconds : 0}
                onEnded={onEnded}
                onClose={() => setWatching(false)}
              />
            ) : (
              <div className="rounded-xl bg-card p-10 text-center">
                <p className="text-lg font-extrabold text-text">No video available yet</p>
              </div>
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
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: gridCount }, (_, i) => i + 1).map((ep) => (
                <button
                  key={ep}
                  onClick={() => onNavigate(ep)}
                  className={`rounded-lg border py-2.5 text-sm font-bold transition ${
                    ep === episode
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text hover:border-primary"
                  }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    );
  }

  // ---------- Browse mode: poster + info (default) ----------
  return (
    <section className="rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="w-40 shrink-0 sm:w-52">
          <div className="aspect-[3/4] overflow-hidden rounded-lg">
            <Poster title={title} posterUrl={posterUrl} className="h-full w-full" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          <div className="mt-2 text-sm font-semibold text-primary">
            {platform ? <PlatformMark platform={platform} /> : ""}
          </div>
          <div className="mt-1 text-sm text-muted">
            {episodeCount > 0 ? `${episodeCount} Episodes` : "Episodes unknown"}
          </div>

          <div className="mt-6">
            {episodeUrls.length > 0 ? (
              <button
                onClick={() => startWatching(resumeEp)}
                className="inline-block rounded-lg bg-primary px-8 py-3 text-sm font-bold text-white hover:bg-primarydark"
              >
                ▶ {hasProgress ? `Resume EP ${resumeEp}` : "Watch All Episodes"}
              </button>
            ) : dailymotionId ? (
              <a
                href={`https://www.dailymotion.com/video/${dailymotionId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg bg-gold px-8 py-3 text-sm font-bold text-black hover:opacity-90"
              >
                ◈ Watch on Dailymotion
              </a>
            ) : (
              <span className="inline-block rounded-lg border border-border px-8 py-3 text-sm font-semibold text-muted">
                Not streaming here yet
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Episodes — tap a number to play it right here */}
      {episodeUrls.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-lg font-bold">
            Episodes <span className="text-sm font-semibold text-muted">({episodeUrls.length})</span>
          </h2>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
            {episodeUrls.slice(0, 100).map((_, i) => {
              const ep = i + 1;
              return (
                <button
                  key={ep}
                  onClick={() => startWatching(ep)}
                  className={`rounded-lg border py-2.5 text-sm font-bold transition ${
                    ep === resumeEp && hasProgress
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text hover:border-primary"
                  }`}
                >
                  {ep}
                </button>
              );
            })}
          </div>
          {episodeUrls.length > 100 && (
            <p className="mt-2 text-xs text-muted">Showing first 100 of {episodeUrls.length} episodes.</p>
          )}
        </div>
      )}
    </section>
  );
}
