"use client";

import type { StreamResolveError } from "@/lib/stream";

/** Error card shown when a watch-time stream resolve fails. Never falls back
 *  to the stored URL — for resolvable rows it is expired anyway. */
export default function StreamErrorCard({
  error,
  episode,
  totalEps,
  onRetry,
  onNextEpisode,
}: {
  error: StreamResolveError;
  episode: number;
  totalEps: number;
  onRetry: () => void;
  onNextEpisode?: () => void;
}) {
  const unavailable = error.code === "episode_unavailable";
  const canNext = !!onNextEpisode && totalEps > 0 && episode < totalEps;
  return (
    <div className="rounded-xl bg-card p-10 text-center">
      <div className="mb-4 text-4xl">📡</div>
      <p className="text-lg font-extrabold text-text">
        {unavailable ? "This episode isn't available right now" : "Couldn't load this episode"}
      </p>
      <p className="mt-2 text-sm font-semibold text-muted">
        {unavailable
          ? "The video source doesn't have this episode. Try the next one."
          : "The video service didn't respond. Check your connection and try again."}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {error.retryable && (
          <button
            onClick={onRetry}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-extrabold text-white hover:bg-primaryhover"
          >
            ↻ Retry
          </button>
        )}
        {canNext && (
          <button
            onClick={onNextEpisode}
            className="rounded-lg border border-border bg-surface px-6 py-2.5 text-sm font-bold text-text hover:border-primary"
          >
            Try next episode ›
          </button>
        )}
      </div>
    </div>
  );
}
