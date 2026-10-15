"use client";

import { useState } from "react";
import Image from "next/image";

function gradientFor(title: string): string {
  const palettes = [
    "from-neutral-900 via-neutral-800 to-neutral-700",
    "from-neutral-800 via-neutral-900 to-neutral-700",
    "from-stone-900 via-neutral-900 to-neutral-800",
  ];
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palettes[h % palettes.length];
}

function FallbackTile({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br p-3 text-center ${gradientFor(title)} ${className ?? ""}`}
    >
      <span className="line-clamp-4 text-xs font-bold text-white/90">{title}</span>
    </div>
  );
}

export function Poster({
  title,
  posterUrl,
  className,
}: {
  title: string;
  posterUrl: string | null;
  className?: string;
}) {
  // res.chartdrama.com throws random 403s (~2 in 3 requests as of 2026-10-15),
  // which next/image surfaces as a broken tile with no fallback. Retry up to
  // 3 times with backoff (a retry usually succeeds), then degrade to a title
  // card instead of an empty tile.
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  if (!posterUrl || failed) {
    return <FallbackTile title={title} className={className} />;
  }

  return (
    <Image
      src={attempt === 0 ? posterUrl : `${posterUrl}${posterUrl.includes("?") ? "&" : "?"}retry=${attempt}`}
      alt={title}
      loading="lazy"
      fill
      sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 12vw"
      className={`object-cover ${className ?? ""}`}
      onError={() => {
        if (attempt < 3) {
          const next = attempt + 1;
          setTimeout(() => setAttempt(next), 700 * next);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
