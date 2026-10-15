"use client";

import { useEffect, useState } from "react";
import DramaCard from "./DramaCard";
import Rail from "./Rail";
import { getTaste, likedIds, dislikedIds, clearTaste } from "@/lib/taste";
import type { DramaRow } from "./DramaCard";

interface ForYouRow {
  title: string;
  subtitle?: string;
  dramas: DramaRow[];
}

/** Personalized recommendation rows. Re-fetches when taste or ratings change. */
export default function ForYou() {
  const [rows, setRows] = useState<ForYouRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const taste = getTaste();
      const liked = likedIds();
      if (taste.length === 0 && liked.length === 0) {
        if (!cancelled) setRows([]);
        return;
      }
      try {
        const res = await fetch("/api/for-you", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taste, liked, disliked: dislikedIds() }),
        });
        const data = await res.json();
        if (!cancelled) setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch {
        if (!cancelled) setRows([]);
      }
    }
    load();
    const onChange = () => load();
    window.addEventListener("sd-taste-changed", onChange);
    return () => {
      cancelled = true;
      window.removeEventListener("sd-taste-changed", onChange);
    };
  }, []);

  if (rows === null || rows.length === 0) return null;

  return (
    <>
      {rows.map((row) => (
        <Rail key={row.title} title={row.title} subtitle={row.subtitle}>
          {row.dramas.map((d) => (
            <DramaCard key={d.id} drama={d} fixedWidth />
          ))}
        </Rail>
      ))}
      <div className="flex justify-end">
        <button
          onClick={() => {
            clearTaste();
            setRows([]);
          }}
          className="text-xs font-semibold text-muted hover:text-primary"
        >
          Reset my recommendations
        </button>
      </div>
    </>
  );
}
