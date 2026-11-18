"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Poster } from "@/components/DramaCard";
import PlatformMark from "@/components/PlatformMark";
import EpisodeGrid from "@/components/EpisodeGrid";
import FavoriteButton from "@/components/FavoriteButton";
import ShareRow from "@/components/ShareRow";
import RatingButtons from "@/components/RatingButtons";
import HideDmToggle from "@/components/HideDmToggle";
import { isResolvableSource } from "@/lib/stream";

/**
 * Drama detail hero — browse/details only. There is deliberately NO inline
 * player here: every play (first-time or resume) goes to the immersive
 * /watch page, which is the one player experience (full-width control bar,
 * full viewport, WatchNav). The old inline player used the frame-width
 * bar, so a first-time play looked "old" while Continue Watching — which
 * links straight to /watch — looked "new". Routing every play to /watch
 * removes that split.
 */
export default function DramaHero({
  dramaId,
  title,
  platform,
  posterUrl,
  episodeUrls,
  episodeCount,
  resumeEp,
  hasProgress,
  dailymotionId,
  dmHidden,
  source,
  episodeIds,
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
  dailymotionId: string | null;
  /** True when this drama is Dailymotion-only and the user turned on
   *  "Hide Dailymotion" — the redirect is suppressed, not offered. */
  dmHidden?: boolean;
  /** Row source; resolvable rows fetch a fresh stream at watch time. */
  source: string | null;
  /** Parsed episode_ids map, or null when the row has none. */
  episodeIds: Record<string, number> | null;
  /** Episodes the user has watched (checkmarks), from watch_progress. */
  watchedEpisodes: number[];
}) {
  const router = useRouter();
  // Backdrop: res.chartdrama.com throws random 403s — hide the blurred
  // backdrop img on error instead of leaving a broken black slab.
  const [backdropFailed, setBackdropFailed] = useState(false);

  // Resolvable rows: episode count from the map, fresh stream per episode
  // (resolved at watch time on /watch — never a stored URL here).
  const resolvable =
    isResolvableSource(source) &&
    episodeIds != null &&
    Object.keys(episodeIds).length > 0;
  const hasVideo = episodeUrls.length > 0 || resolvable;
  const totalEps = resolvable
    ? Object.keys(episodeIds).length
    : episodeUrls.length || episodeCount;
  const gridEps = resolvable ? totalEps : episodeUrls.length;

  // Every play goes to the immersive watch page — the one player.
  const playEpisode = (ep: number) => {
    router.push(`/watch/${encodeURIComponent(dramaId)}/${ep}`);
  };

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
              {hasVideo ? (
                <Link
                  href={`/watch/${encodeURIComponent(dramaId)}/${resumeEp}`}
                  className="inline-block rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primaryhover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  ▶ {hasProgress ? `Resume EP ${resumeEp}` : "Watch All Episodes"}
                </Link>
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

            <div className="mt-4">
              <FavoriteButton dramaId={dramaId} />
            </div>
            <div className="mt-4">
              <ShareRow dramaId={dramaId} title={title} />
            </div>
          </div>
        </div>

        {/* Episodes — tap a number to play it on the watch page */}
        {gridEps > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-bold text-white">
              Episodes <span className="text-sm font-semibold text-white/50">({gridEps})</span>
            </h2>
            <EpisodeGrid
              episode={resumeEp}
              totalEps={gridEps}
              watched={watchedEpisodes}
              onNavigate={playEpisode}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
