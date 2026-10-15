"use client";

import { useSavedLists } from "./SavedLists";

/** Standalone Watch Later toggle button for hero/detail contexts. */
export default function WatchLaterButton({ dramaId, title }: { dramaId: string; title: string }) {
  const { watchlater, toggle } = useSavedLists();
  const saved = watchlater.has(dramaId);

  return (
    <button
      onClick={() => toggle(dramaId, "watchlater")}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from Watch Later` : `Save ${title} to Watch Later`}
      className={`rounded-full border px-6 py-3 text-sm font-semibold backdrop-blur transition ${
        saved
          ? "border-primary bg-primary/20 text-primary"
          : "border-white/25 bg-white/5 text-white hover:border-white/60"
      }`}
    >
      {saved ? "✓ In Watch Later" : "+ Watch Later"}
    </button>
  );
}
