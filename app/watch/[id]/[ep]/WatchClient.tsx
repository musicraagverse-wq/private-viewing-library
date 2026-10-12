"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Player from "@/components/Player";
import { Poster } from "@/components/DramaCard";

type UpNextItem = { id: string; title: string; poster_url: string | null };

export default function WatchClient({
  dramaId,
  dramaTitle,
  episode,
  totalEps,
  videoUrl,
  dailymotionEmbed,
  resumeAt,
  upNext,
}: {
  dramaId: string;
  dramaTitle: string;
  episode: number;
  totalEps: number;
  videoUrl: string | null;
  dailymotionEmbed: string | null;
  resumeAt: number;
  upNext: UpNextItem[];
}) {
  const router = useRouter();
  const [showUpNext, setShowUpNext] = useState(false);
  const isLastEp = totalEps > 0 && episode >= totalEps;

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

  if (showUpNext) {
    return (
      <div className="mx-auto w-full max-w-[480px] select-none overflow-hidden rounded-xl bg-black p-6">
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
    );
  }

  if (videoUrl) {
    return <Player dramaId={dramaId} dramaTitle={dramaTitle} episode={episode} totalEps={totalEps} videoUrl={videoUrl} resumeAt={resumeAt} onEnded={onEnded} onNavigate={onNavigate} />;
  }

  if (dailymotionEmbed) {
    // Extract video ID from embed URL for direct link
    const videoId = dailymotionEmbed.split("/").pop();
    const watchUrl = `https://www.dailymotion.com/video/${videoId}`;
    return (
      <div className="rounded-lg bg-card p-10 text-center">
        <div className="text-4xl mb-4">🎬</div>
        <p className="text-lg font-extrabold text-text">Available on Dailymotion</p>
        <p className="mt-2 text-sm font-semibold text-muted">Dailymotion blocks embeds, but you can watch it there directly! 👇</p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-den bg-primary px-8 py-3 text-sm font-extrabold text-white hover:bg-primarydark"
        >
          ▶ Watch on Dailymotion
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-card p-10 text-center">
      <div className="text-4xl mb-4">🎭</div>
      <p className="text-lg font-extrabold text-text">No video available yet</p>
      <p className="mt-2 text-sm font-semibold text-muted">Check back soon! We're working on it. 🔄</p>
    </div>
  );
}
