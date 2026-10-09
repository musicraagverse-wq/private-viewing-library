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
    return (
      <div>
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={dailymotionEmbed}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allow="autoplay; fullscreen"
            allowFullScreen
            title="Dailymotion player"
          />
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          Alternative source via Dailymotion — progress tracking unavailable for embeds
        </p>
      </div>
    );
  }

  return null;
}
