"use client";

import { useEffect, useState } from "react";

const RANGE = 20;

export default function EpisodeGrid({
  episode,
  totalEps,
  watched,
  onNavigate,
}: {
  episode: number;
  totalEps: number;
  watched: number[];
  onNavigate: (ep: number) => void;
}) {
  const count = totalEps > 0 ? totalEps : episode;
  const rangeCount = Math.max(1, Math.ceil(count / RANGE));
  const epRange = Math.floor((episode - 1) / RANGE);
  // Displayed range: follows the playing episode across boundaries
  // (auto-advance 20 -> 21), but a manually picked tab sticks until the
  // episode moves to another range. (The old rangeTab check required the
  // episode to already be in the picked range, so the tabs could never
  // switch to another range — they were dead buttons.)
  const [range, setRange] = useState(epRange);
  useEffect(() => {
    setRange(epRange);
  }, [epRange]);
  const start = range * RANGE + 1;
  const end = Math.min(count, (range + 1) * RANGE);
  const watchedSet = new Set(watched);

  return (
    <div className="space-y-3">
      {rangeCount > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {Array.from({ length: rangeCount }, (_, r) => {
            const a = r * RANGE + 1;
            const b = Math.min(count, (r + 1) * RANGE);
            return (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-sm font-bold transition ${
                  r === range ? "text-primary" : "text-muted hover:text-text"
                }`}
              >
                {a}–{b}
              </button>
            );
          })}
        </div>
      )}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((ep) => {
          const isCurrent = ep === episode;
          const isWatched = !isCurrent && watchedSet.has(ep);
          return (
            <button
              key={ep}
              onClick={() => onNavigate(ep)}
              aria-label={`Episode ${ep}${isCurrent ? " (playing)" : isWatched ? " (watched)" : ""}`}
              className={`relative rounded-lg py-2.5 text-sm font-bold transition ${
                isCurrent
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text hover:border-primary"
              }`}
            >
              {isCurrent ? (
                <span aria-hidden="true">❚❚</span>
              ) : (
                <>
                  {ep}
                  {isWatched && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0.5 right-1 text-[10px] font-extrabold leading-none text-primary"
                    >
                      ✓
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
