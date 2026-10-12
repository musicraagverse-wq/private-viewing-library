"use client";

import { useEffect, useRef, useCallback, useState } from "react";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * EveryDrama-style player: standard bottom control bar
 * (play, volume, scrubber, time, fullscreen) in a vertical frame,
 * plus the retained −10s/+10s and prev/next episode buttons.
 */
export default function Player({
  dramaId,
  episode,
  totalEps,
  videoUrl,
  posterUrl,
  resumeAt,
  onEnded,
  onNavigate,
  onClose,
}: {
  dramaId: string;
  episode: number;
  totalEps: number;
  videoUrl: string;
  posterUrl: string | null;
  resumeAt: number;
  onEnded: () => void;
  onNavigate: (ep: number) => void;
  onClose?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const savedRef = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumeDone = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [controls, setControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [flash, setFlash] = useState<"-10" | "+10" | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Load episode: reset state, resume, try autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    resumeDone.current = false;
    setProgress(0);
    setDuration(0);
    setPlaying(false);
    setStarted(false);
    video.load();
    video.play().catch(() => {});
    pokeControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl]);

  // Save progress periodically while playing
  useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current;
      if (v && !v.paused && !v.ended) save(v.currentTime);
    }, 10000);
    return () => clearInterval(id);
  }, [save]);

  function toggle() {
    const video = videoRef.current;
    if (!video) return;
    pokeControls();
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function seek(by: number) {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min((video.duration || 0), video.currentTime + by));
    pokeControls();
    setFlash(by < 0 ? "-10" : "+10");
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(null), 700);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    pokeControls();
  }

  function toggleFullscreen() {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else box.requestFullscreen?.().catch(() => {});
    pokeControls();
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
    <div
      ref={boxRef}
      className="relative mx-auto aspect-[9/16] max-h-[82vh] w-full max-w-[420px] select-none overflow-hidden rounded-xl bg-black"
      onMouseEnter={() => {
        setControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      }}
      onMouseMove={pokeControls}
      onMouseLeave={() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        setControls(false);
      }}
    >
      <video
        ref={videoRef}
        className="h-full w-full"
        playsInline
        preload="auto"
        src={videoUrl}
        poster={posterUrl ?? undefined}
        onClick={toggle}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek(e.clientX - rect.left < rect.width / 2 ? -10 : 10);
        }}
        onLoadedMetadata={(e) => {
          if (!resumeDone.current && resumeAt > 0) {
            resumeDone.current = true;
            e.currentTarget.currentTime = resumeAt;
          }
        }}
        onTimeUpdate={(e) => {
          setProgress(e.currentTarget.currentTime);
          setDuration(e.currentTarget.duration || 0);
        }}
        onPlay={() => {
          setPlaying(true);
          setStarted(true);
          pokeControls();
        }}
        onPause={(e) => {
          setPlaying(false);
          save(e.currentTarget.currentTime, true);
          setControls(true);
        }}
        onEnded={(e) => {
          save(e.currentTarget.duration, true);
          onEnded();
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

      {/* pre-play overlay: poster + red badge, like EveryDrama — vanishes the moment playback starts */}
      {!started && (
        <button
          onClick={toggle}
          className="animate-fade-in absolute inset-0 flex flex-col items-center justify-center"
          aria-label="Play"
        >
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-85"
            />
          )}
          <span className="absolute inset-0 bg-black/20" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-2xl text-white shadow-xl">
            ▶
          </span>
          <span className="relative mt-3 px-4 text-center text-base font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            {resumeAt > 0 ? `Resume EP ${episode}` : `Play EP ${episode}`}
          </span>
        </button>
      )}

      {/* big play button when paused after start */}
      {started && !playing && (
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          aria-label="Play"
        >
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/90 text-3xl text-white">▶</span>
        </button>
      )}

      {/* close */}
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Close player"
          className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-lg font-bold text-white transition-opacity ${
            controls ? "opacity-100" : "opacity-0"
          }`}
        >
          ×
        </button>
      )}

      {/* bottom control bar */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2.5 pt-10 transition-opacity ${
          controls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* scrubber */}
        <div className="relative h-5 cursor-pointer" onClick={onBarClick}>
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/30">
            <div className="h-full rounded bg-primary" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
            style={{ left: `${pct}%` }}
          />
        </div>
        {/* buttons row */}
        <div className="mt-0.5 flex items-center gap-1 text-white">
          <button
            onClick={() => episode > 1 && onNavigate(episode - 1)}
            disabled={episode <= 1}
            className="rounded p-1.5 text-base disabled:opacity-30 hover:bg-white/10"
            aria-label="Previous episode"
          >
            ⏮
          </button>
          <button onClick={toggle} className="rounded p-1.5 text-xl hover:bg-white/10" aria-label={playing ? "Pause" : "Play"}>
            {playing ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => (totalEps === 0 || episode < totalEps) && onNavigate(episode + 1)}
            disabled={totalEps > 0 && episode >= totalEps}
            className="rounded p-1.5 text-base disabled:opacity-30 hover:bg-white/10"
            aria-label="Next episode"
          >
            ⏭
          </button>
          <button onClick={() => seek(-10)} className="rounded px-1.5 py-1 text-xs font-extrabold hover:bg-white/10" aria-label="Back 10 seconds">
            −10
          </button>
          <button onClick={() => seek(10)} className="rounded px-1.5 py-1 text-xs font-extrabold hover:bg-white/10" aria-label="Forward 10 seconds">
            +10
          </button>
          <button onClick={toggleMute} className="rounded p-1.5 text-base hover:bg-white/10" aria-label={muted ? "Unmute" : "Mute"}>
            {muted ? "🔇" : "🔊"}
          </button>
          <span className="ml-1 text-xs font-medium text-white/80">
            {fmt(progress)} / {fmt(duration)}
          </span>
          <span className="flex-1" />
          <button onClick={toggleFullscreen} className="rounded p-1.5 text-base hover:bg-white/10" aria-label="Fullscreen">
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
