"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function Player({
  dramaId,
  dramaTitle,
  episode,
  totalEps,
  videoUrl,
  resumeAt,
  onEnded,
  onNavigate,
  onClose,
}: {
  dramaId: string;
  dramaTitle: string;
  episode: number;
  totalEps: number;
  videoUrl: string;
  resumeAt: number;
  onEnded: () => void;
  onNavigate: (ep: number) => void;
  onClose?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const savedRef = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [controls, setControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [flash, setFlash] = useState<"-10" | "+10" | null>(null);

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

  const pokeControls = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 3000);
  }, []);

  const seek = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    setFlash(delta > 0 ? "+10" : "-10");
    setTimeout(() => setFlash(null), 500);
    pokeControls();
  }, [pokeControls]);

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

    const onTime = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
      save(video.currentTime);
    };
    const onPlay = () => { setPlaying(true); pokeControls(); };
    const onPause = () => { setPlaying(false); save(video.currentTime, true); setControls(true); };
    const onEnd = () => { save(0, true); onEnded(); };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnd);

    const onVis = () => {
      if (document.hidden && !video.paused) video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVis);

    try {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${dramaTitle} — Episode ${episode}`,
          artist: "Short Drama",
        });
        navigator.mediaSession.setActionHandler("play", () => video.play().catch(() => {}));
        navigator.mediaSession.setActionHandler("pause", () => video.pause());
        navigator.mediaSession.setActionHandler("previoustrack", () => { if (episode > 1) onNavigate(episode - 1); });
        navigator.mediaSession.setActionHandler("nexttrack", () => { if (episode < totalEps) onNavigate(episode + 1); });
      }
    } catch { /* ignore */ }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); video.paused ? video.play() : video.pause(); }
      if (e.key === "ArrowRight") seek(10);
      if (e.key === "ArrowLeft") seek(-10);
    };
    window.addEventListener("keydown", onKey);
    pokeControls();

    return () => {
      destroyed = true;
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnd);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("visibilitychange", onVis);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      try { hls?.destroy(); } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function onBarClick(e: React.MouseEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
    pokeControls();
  }

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="relative mx-auto aspect-video w-full select-none overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        playsInline
        className="h-full w-full object-contain"
        onClick={toggle}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(e.clientX - rect.left < rect.width / 2 ? -10 : 10);
        }}
      />

      {/* seek flash */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-black/70 px-4 py-2 text-lg font-bold text-white">
            {flash === "+10" ? "+10s" : "−10s"}
          </span>
        </div>
      )}

      {/* big play button when paused */}
      {!playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          aria-label="Play"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 text-3xl text-white">▶</span>
        </button>
      )}

      {/* top bar */}
      <div className={`absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-3 transition-opacity ${controls ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center gap-3">
          <button onClick={() => (onClose ? onClose() : window.history.back())} className="text-2xl text-white" aria-label="Back">←</button>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{dramaTitle}</p>
            <p className="text-xs text-white/70">Episode {episode}{totalEps > 0 ? ` of ${totalEps}` : ""}</p>
          </div>
        </div>
      </div>

      {/* bottom controls */}
      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-8 transition-opacity ${controls ? "opacity-100" : "opacity-0"}`}>
        <div className="mb-1 flex items-center justify-between text-xs text-white/80">
          <span>{fmt(progress)}</span>
          <span>{fmt(duration)}</span>
        </div>
        <div className="relative h-5 cursor-pointer" onClick={onBarClick}>
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/30">
            <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between">
          <button
            onClick={() => episode > 1 && onNavigate(episode - 1)}
            disabled={episode <= 1}
            className="rounded-full bg-white/15 px-3 py-2 text-sm font-bold text-white disabled:opacity-30"
          >
            ⏮ Prev
          </button>
          <div className="flex items-center gap-4">
            <button
              onClick={() => seek(-10)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white"
              aria-label="Back 10 seconds"
            >
              −10
            </button>
            <button
              onClick={toggle}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl text-white"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => seek(10)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white"
              aria-label="Forward 10 seconds"
            >
              +10
            </button>
          </div>
          <button
            onClick={() => totalEps === 0 || episode < totalEps ? onNavigate(episode + 1) : undefined}
            disabled={totalEps > 0 && episode >= totalEps}
            className="rounded-full bg-white/15 px-3 py-2 text-sm font-bold text-white disabled:opacity-30"
          >
            Next ⏭
          </button>
        </div>
      </div>
    </div>
  );
}
