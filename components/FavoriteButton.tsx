"use client";

import { useSavedLists } from "@/components/SavedLists";

/** Full-width favourite toggle, reusing the existing saved-lists mechanism. */
export default function FavoriteButton({ dramaId }: { dramaId: string }) {
  const { favourites, toggle } = useSavedLists();
  const isFav = favourites.has(dramaId);
  return (
    <button
      onClick={() => toggle(dramaId, "favourite")}
      aria-pressed={isFav}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border py-3 text-sm font-extrabold transition ${
        isFav
          ? "border-primary bg-primary text-black"
          : "border-border bg-surface text-text hover:border-primary"
      }`}
    >
      <span className="text-base leading-none">{isFav ? "♥" : "♡"}</span>
      {isFav ? "Favourited" : "Favourite"}
    </button>
  );
}
