"use client";

import { useState } from "react";
import Link from "next/link";
import { Poster } from "./DramaCard";

type ContinueItem = {
  id: string;
  title: string;
  poster_url: string | null;
  episode: number;
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
    <section>
      <h2 className="mb-3 font-display text-2xl font-extrabold">📺 Continue Watching</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
        {list.map((d) => (
          <div key={d.id} className="den-card den-card-hover group relative">
            <Link href={`/watch/${encodeURIComponent(d.id)}/${d.episode}`}>
              <div className="relative aspect-[3/4]">
                <Poster title={d.title} posterUrl={d.poster_url} className="h-full w-full" />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-center text-[11px] font-extrabold text-sunny">
                  EP {d.episode}
                </div>
              </div>
              <div className="line-clamp-1 p-2 text-xs font-extrabold text-cream group-hover:text-pop">
                {d.title}
              </div>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                remove(d.id);
              }}
              disabled={removing === d.id}
              title="Remove from Continue Watching"
              className="absolute right-1 top-1 z-10 rounded-full bg-black/70 px-2 py-1 text-xs font-extrabold text-pop opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:bg-pop hover:text-white disabled:opacity-50"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
