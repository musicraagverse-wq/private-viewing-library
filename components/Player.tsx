"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * EveryDrama-style player: the standard native video controls
 * (play/pause, volume, scrubber, fullscreen) in a vertical frame.
 * Episode navigation lives in the sidebar grid, not in the player.
 */
export default function Player({
  dramaId,
  episode,
  videoUrl,
  resumeAt,
  onEnded,
  onClose,
}: {
  dramaId: string;
  episode: number;
  videoUrl: string;
  resumeAt: number;
  onEnded: () => void;
  onClose?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const savedRef = useRef(0);
  const resumeDone = useRef(false);

  const save = useCallback(
    (pos: number, force = false) => {
      const now = Date.now();
      if (!force && now - savedRef.current < 9000) return;
      savedRef.current = now;
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drama_id: dramaId, episode, position_seconds: Math.floor(pos) }),
      }).catch(() => {});
    },
    [dramaId, episode]
  );

  // Load new episode: reset resume flag and try autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    resumeDone.current = false;
    video.load();
    video.play().catch(() => {
      /* autoplay blocked — user taps play */
    });
  }, [videoUrl]);

  // Save progress periodically while playing
  useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended) save(v.currentTime);
    }, 10000);
    return () => clearInterval(id);
  }, [save]);

  return (
    <div className="relative mx-auto aspect-[9/16] max-h-[82vh] w-full max-w-[420px] overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        className="h-full w-full"
        controls
        playsInline
        preload="metadata"
        src={videoUrl}
        onLoadedMetadata={(e) => {
          if (!resumeDone.current && resumeAt > 0) {
            resumeDone.current = true;
            e.currentTarget.currentTime = resumeAt;
          }
        }}
        onPause={(e) => save(e.currentTarget.currentTime, true)}
        onEnded={(e) => {
          save(e.currentTarget.duration, true);
          onEnded();
        }}
      />
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close player"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white hover:bg-black/80"
        >
          ×
        </button>
      )}
    </div>
  );
}
