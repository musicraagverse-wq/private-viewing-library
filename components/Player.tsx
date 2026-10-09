"use client";

import { useEffect, useRef, useCallback } from "react";

export default function Player({
  dramaId,
  episode,
  videoUrl,
  resumeAt,
  onEnded,
}: {
  dramaId: string;
  episode: number;
  videoUrl: string;
  resumeAt: number;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const savedRef = useRef(0);

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let hls: import("hls.js").default | null = null;
    let destroyed = false;

    const startAt = resumeAt > 5 ? resumeAt : 0;

    const attach = async () => {
      const Hls = (await import("hls.js")).default;
      if (destroyed) return;
      if (Hls.isSupported()) {
        hls = new Hls({ maxBufferLength: 60 });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (startAt > 0) video.currentTime = startAt;
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal && hls) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = videoUrl;
        video.addEventListener("loadedmetadata", () => {
          if (startAt > 0) video.currentTime = startAt;
          video.play().catch(() => {});
        }, { once: true });
      }
    };
    attach();

    const onTime = () => save(video.currentTime);
    const onPause = () => save(video.currentTime, true);
    const onEnd = () => {
      save(0, true);
      onEnded();
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnd);

    // Keep audio playing when tab is backgrounded / app minimized (mobile)
    const onVis = () => {
      if (document.hidden && !video.paused) {
        // Browser may auto-pause; resume for background audio
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // Media Session API: lock-screen / notification controls
    try {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `Episode ${episode}`,
          artist: "Private Viewing Library",
        });
        navigator.mediaSession.setActionHandler("play", () => video.play().catch(() => {}));
        navigator.mediaSession.setActionHandler("pause", () => video.pause());
      }
    } catch { /* ignore */ }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); video.paused ? video.play() : video.pause(); }
      if (e.key === "ArrowRight") video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
      if (e.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 10);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      destroyed = true;
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnd);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      try { hls?.destroy(); } catch { /* ignore */ }
    };
  }, [videoUrl, resumeAt, save, onEnded]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      className="aspect-video w-full rounded-xl bg-black"
    />
  );
}
