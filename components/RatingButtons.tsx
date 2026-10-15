"use client";

import { useEffect, useState } from "react";
import { getRating, setRating, type Rating } from "@/lib/taste";

/** Thumbs up/down rating for a drama. Feeds the recommendation engine. */
export default function RatingButtons({ dramaId, title }: { dramaId: string; title: string }) {
  const [rating, setR] = useState<Rating | 0>(0);

  useEffect(() => {
    setR(getRating(dramaId));
    const onChange = () => setR(getRating(dramaId));
    window.addEventListener("sd-taste-changed", onChange);
    return () => window.removeEventListener("sd-taste-changed", onChange);
  }, [dramaId]);

  const toggle = (r: Rating) => {
    const next = rating === r ? 0 : r;
    setRating(dramaId, next);
    setR(next);
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label={`Rate ${title}`}>
      <button
        onClick={() => toggle(1)}
        aria-pressed={rating === 1}
        aria-label={rating === 1 ? "Remove your like" : "I like this"}
        title="I like this"
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
          rating === 1
            ? "border-primary bg-primary text-black"
            : "border-white/25 bg-white/5 text-white/70 hover:border-primary hover:text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
        </svg>
      </button>
      <button
        onClick={() => toggle(-1)}
        aria-pressed={rating === -1}
        aria-label={rating === -1 ? "Remove your dislike" : "Not for me"}
        title="Not for me"
        className={`flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
          rating === -1
            ? "border-white/60 bg-white/20 text-white"
            : "border-white/25 bg-white/5 text-white/70 hover:border-white/60 hover:text-white"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 rotate-180" aria-hidden="true">
          <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
        </svg>
      </button>
      {rating !== 0 && (
        <span className="text-xs text-white/50">
          {rating === 1 ? "We'll recommend more like this" : "We'll show less like this"}
        </span>
      )}
    </div>
  );
}
