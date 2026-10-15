"use client";

import { useState } from "react";
import Link from "next/link";
import { Poster } from "./DramaCard";

type ContinueItem = {
  id: string;
  title: string;
  poster_url: string | null;
  episode: number;
  position_seconds: number;
  duration_seconds: number | null;
};

export default function ContinueWatching({ items }: { items: ContinueItem[] }) {
  const [list, setList] = useState(items);
  const [removing, setRemoving] = useState<string | null>(null);

  async function remove(id: string) {
    setRemoving(id);
    try {
      await fetch("/api/progress", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drama_id: id }),
      });
      setList((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // ignore
    }
    setRemoving(null);
  }

  if (list.length === 0) return null;

  return (
    <section aria-label="Continue watching">
      <h2 className="mb-3 text-xl font-bold tracking-tight sm:text-2xl">Continue Watching</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {list.map((d) => {
          const pct =
            d.duration_seconds && d.duration_seconds > 0
              ? Math.min(100, Math.max(0, (d.position_seconds / d.duration_seconds) * 100))
              : null;
          return (
          <div key={d.id} className="rounded-lg bg-card card-hover group relative">
            <Link href={`/watch/${encodeURIComponent(d.id)}/${d.episode}`}>
              <div className="relative aspect-[3/4]">
                <Poster title={d.title} posterUrl={d.poster_url} className="h-full w-full" />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[11px] font-extrabold text-gold">
                  EP {d.episode}
                </div>
                {pct !== null && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={`${d.title} progress`}>
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              <div className="line-clamp-1 p-2 text-xs font-extrabold text-text group-hover:text-primary">
                {d.title}
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                remove(d.id);
              }}
              disabled={removing === d.id}
              aria-label={`Remove ${d.title} from Continue Watching`}
              title="Remove from Continue Watching"
              className="absolute right-1 top-1 z-10 rounded-full bg-black/70 px-2 py-1 text-xs font-extrabold text-primary backdrop-blur transition hover:bg-primary hover:text-black disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
            >
              ✕
            </button>
          </div>
          );
        })}
      </div>
    </section>
  );
}
