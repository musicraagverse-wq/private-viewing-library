"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import Player from "@/components/Player";

export default function WatchClient({
  dramaId,
  episode,
  totalEps,
  videoUrl,
  dailymotionEmbed,
  resumeAt,
}: {
  dramaId: string;
  episode: number;
  totalEps: number;
  videoUrl: string | null;
  dailymotionEmbed: string | null;
  resumeAt: number;
}) {
  const router = useRouter();

  const onEnded = useCallback(() => {
    if (totalEps > 0 && episode < totalEps) {
      router.push(`/watch/${encodeURIComponent(dramaId)}/${episode + 1}`);
    }
  }, [router, dramaId, episode, totalEps]);

  if (videoUrl) {
    return <Player dramaId={dramaId} episode={episode} videoUrl={videoUrl} resumeAt={resumeAt} onEnded={onEnded} />;
  }

  if (dailymotionEmbed) {
    // Extract video ID from embed URL for direct link
    const videoId = dailymotionEmbed.split("/").pop();
    const watchUrl = `https://www.dailymotion.com/video/${videoId}`;
    return (
      <div className="den-card p-10 text-center">
        <div className="text-4xl mb-4">🎬</div>
        <p className="font-display text-lg font-extrabold text-cream">Available on Dailymotion</p>
        <p className="mt-2 text-sm font-semibold text-muted">Dailymotion blocks embeds, but you can watch it there directly! 👇</p>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-den bg-pop px-8 py-3 font-display text-sm font-extrabold text-white hover:bg-popdark"
        >
          ▶ Watch on Dailymotion
        </a>
      </div>
    );
  }

  return (
    <div className="den-card p-10 text-center">
      <div className="text-4xl mb-4">🎭</div>
      <p className="font-display text-lg font-extrabold text-cream">No video available yet</p>
      <p className="mt-2 text-sm font-semibold text-muted">Check back soon! We're working on it. 🔄</p>
    </div>
  );
}
