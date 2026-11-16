"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type Hls from "hls.js";

function fmt(s: number) {
  if (!isFinite(s) || s < 0) return "00:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${h}:${(m % 60).toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

/** Video element with the Safari picture-in-picture fallback. */
type PipVideo = HTMLVideoElement & {
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
};

/**
 * EveryDrama-style player: bottom control bar (play, volume, scrubber,
 * time, fullscreen) in a vertical frame, plus the retained −10s/+10s
 * and prev/next episode buttons. On the watch page the bar spans the
 * full player-column width (fullWidthBar), like the reference player —
 * not just the video frame.
 */
export default function Player({
  dramaId,
  episode,
  totalEps,
  videoUrl,
  format,
  posterUrl,
  resumeAt,
  onEnded,
  onNavigate,
  onClose,
  onTheaterChange,
  fullWidthBar,
}: {
  dramaId: string;
  episode: number;
  totalEps: number;
  videoUrl: string;
  /** Stream format from the resolver; falls back to URL sniffing when absent. */
  format?: "hls" | "mp4";
  posterUrl: string | null;
  resumeAt: number;
  onEnded: () => void;
  onNavigate: (ep: number) => void;
  onClose?: () => void;
  /** Theater mode hides the sidebar (the player is already full-height). */
  onTheaterChange?: (theater: boolean) => void;
  /** Watch page only: the control bar spans the full player-column width
      (viewport minus the 400px sidebar), not just the video frame. The
      homepage hero keeps the bar inside the frame. */
  fullWidthBar?: boolean;
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
  const [muted, setMuted] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("sd_muted") === "1" : false
  );
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 1;
    const v = parseFloat(localStorage.getItem("sd_volume") ?? "1");
    return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
  });
  const [flash, setFlash] = useState<"-10" | "+10" | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Playback speed: cycles 0.5 / 0.75 / 1 / 1.25 / 1.5 / 2, default 1x.
  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const [rate, setRate] = useState(1);
  const rateRef = useRef(1);
  // Theater mode: hides the sidebar for a distraction-free view (the player
  // itself is already full-height, so there is nothing wider to grow into).
  const [theater, setTheater] = useState(false);
  // Picture-in-picture: standard API + Safari webkit fallback. Support is
  // detected after mount (avoids a server/client render mismatch).
  const [pip, setPip] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  useEffect(() => {
    const video = videoRef.current as PipVideo | null;
    setPipSupported(
      (typeof document !== "undefined" &&
        "pictureInPictureEnabled" in document &&
        (document as Document).pictureInPictureEnabled) ||
        (video != null && typeof video.webkitSetPresentationMode === "function")
    );
    function syncPip() {
      const v = videoRef.current as PipVideo | null;
      setPip(
        document.pictureInPictureElement === v ||
          v?.webkitPresentationMode === "picture-in-picture"
      );
    }
    document.addEventListener("enterpictureinpicture", syncPip);
    document.addEventListener("leavepictureinpicture", syncPip);
    video?.addEventListener("webkitpresentationmodechanged", syncPip);
    return () => {
      document.removeEventListener("enterpictureinpicture", syncPip);
      document.removeEventListener("leavepictureinpicture", syncPip);
      video?.removeEventListener("webkitpresentationmodechanged", syncPip);
    };
  }, []);

  const save = useCallback(
    (pos: number, force = false) => {
      const now = Date.now();
      if (!force && now - savedRef.current < 9000) return;
      savedRef.current = now;
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drama_id: dramaId,
          episode,
          position_seconds: Math.floor(pos),
          duration_seconds: duration > 0 ? Math.floor(duration) : undefined,
        }),
      }).catch(() => {});
    },
    [dramaId, episode, duration]
  );

  const pokeControls = useCallback(() => {
    setControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControls(false), 3000);
  }, []);

  // Load episode via hls.js (or native for mp4): reset state, resume, try autoplay
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    resumeDone.current = false;
    setProgress(0);
    setDuration(0);
    setPlaying(false);
    setStarted(false);

    let hls: Hls | null = null;
    let cancelled = false;
    // Format comes from the resolver when available — never sniff alone:
    // proxied HLS streams have extensionless URLs that native playback can't play.
    const isHls = format === "hls" || videoUrl.includes(".m3u8");
    // restore the user's last volume on every (re)mount
    video.volume = volume;
    video.muted = muted;
    // re-apply the chosen playback speed (a new source resets it to 1x)
    video.playbackRate = rateRef.current;
    if (isHls) {
      // hls.js loads on demand only, keeping it out of the initial bundle
      import("hls.js")
        .then(({ default: Hls }) => {
          if (cancelled) return;
          if (Hls.isSupported()) {
            hls = new Hls({
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              enableWorker: true,
            });
            hls.loadSource(videoUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              video.play().catch(() => {});
            });
          } else {
            video.src = videoUrl;
            video.load();
            video.play().catch(() => {});
          }
        })
        .catch(() => {
          if (cancelled) return;
          video.src = videoUrl;
          video.load();
          video.play().catch(() => {});
        });
    } else {
      video.src = videoUrl;
      video.load();
      video.play().catch(() => {});
    }
    pokeControls();
    return () => {
      cancelled = true;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hls?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoUrl, format]);

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

  function persistVol(v: number, m: boolean) {
    try {
      localStorage.setItem("sd_volume", String(v));
      localStorage.setItem("sd_muted", m ? "1" : "0");
    } catch {}
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    persistVol(volume, video.muted);
    pokeControls();
  }

  function onVolumeChange(v: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = v;
    video.muted = v === 0;
    setVolume(v);
    setMuted(v === 0);
    persistVol(v, v === 0);
    pokeControls();
  }

  function toggleFullscreen() {
    const box = boxRef.current;
    if (!box) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else box.requestFullscreen?.().catch(() => {});
    pokeControls();
  }

  async function togglePip() {
    const video = videoRef.current as PipVideo | null;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
      } else if (video.webkitSetPresentationMode) {
        video.webkitSetPresentationMode(
          video.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture"
        );
      }
    } catch {}
    pokeControls();
  }

  function cycleRate() {
    const video = videoRef.current;
    const idx = SPEEDS.indexOf(rateRef.current);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    rateRef.current = next;
    setRate(next);
    if (video) video.playbackRate = next;
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
      className="relative mx-auto aspect-[9/16] max-h-[100dvh] w-full max-w-[56.25dvh] select-none overflow-hidden bg-black"
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

      {/* synopsis lives in the sidebar (always visible), not on the image:
          the paused-only overlay hid it while playing, so it looked missing */}
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

      {/* bottom control bar: full player-column width on the watch page
          (fixed to the viewport bottom, stopping at the 400px sidebar
          unless theater mode hides it), frame width everywhere else */}
      <div
        className={`${fullWidthBar ? `fixed inset-x-0 bottom-0 z-30 ${theater ? "" : "lg:right-[400px]"}` : "absolute inset-x-0 bottom-0"} bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 pb-2.5 pt-10 transition-opacity ${
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
        {/* buttons row: play, ±10s, time; speed, volume, theater, PiP, fullscreen.
            Prev/next live on the floating chevrons; ±10s also via double-click. */}
        <div className="mt-0.5 flex items-center gap-1 text-white">
          <button onClick={toggle} className="rounded p-1.5 text-xl hover:bg-white/10" aria-label={playing ? "Pause" : "Play"}>
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={() => seek(-10)} className="rounded px-1.5 py-1 text-xs font-extrabold hover:bg-white/10" aria-label="Back 10 seconds">
            −10
          </button>
          <button onClick={() => seek(10)} className="rounded px-1.5 py-1 text-xs font-extrabold hover:bg-white/10" aria-label="Forward 10 seconds">
            +10
          </button>
          <span className="ml-1 text-xs font-medium text-white/80">
            {fmt(progress)} / {fmt(duration)}
          </span>
          <span className="flex-1" />
          <button
            onClick={cycleRate}
            className="rounded px-2 py-1 text-xs font-extrabold hover:bg-white/10"
            aria-label={`Playback speed ${rate}x — click to change`}
            title="Playback speed"
          >
            {Number.isInteger(rate) ? `${rate}.0` : rate}x
          </button>
          <div className="group/vol flex items-center">
            <button onClick={toggleMute} className="rounded p-1.5 text-base hover:bg-white/10" aria-label={muted ? "Unmute" : "Mute"}>
              {muted || volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : Math.round(volume * 100)}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              onClick={(e) => e.stopPropagation()}
              className="h-1 w-0 cursor-pointer appearance-none rounded bg-white/30 opacity-0 accent-primary transition-all duration-200 group-hover/vol:w-20 group-hover/vol:opacity-100"
              aria-label="Volume"
            />
          </div>
          <button
            onClick={() => {
              const next = !theater;
              setTheater(next);
              onTheaterChange?.(next);
              pokeControls();
            }}
            className={`rounded p-1.5 hover:bg-white/10 ${theater ? "text-primary" : ""}`}
            aria-label={theater ? "Exit theater mode" : "Theater mode"}
            title="Theater mode"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <path d="M7 5v14M17 5v14" strokeLinecap="round" />
            </svg>
          </button>
          {pipSupported && (
            <button
              onClick={togglePip}
              className={`rounded p-1.5 hover:bg-white/10 ${pip ? "text-primary" : ""}`}
              aria-label={pip ? "Exit picture-in-picture" : "Picture-in-picture"}
              title="Picture-in-picture"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <rect x="12" y="12" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
              </svg>
            </button>
          )}
          <button onClick={toggleFullscreen} className="rounded p-1.5 text-base hover:bg-white/10" aria-label="Fullscreen">
            ⛶
          </button>
        </div>
      </div>
    </div>
  );
}
