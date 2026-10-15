"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type ListType = "favourite" | "watchlater";

type SavedCtx = {
  favourites: Set<string>;
  watchlater: Set<string>;
  loaded: boolean;
  toggle: (dramaId: string, list: ListType) => void;
};

const Ctx = createContext<SavedCtx>({
  favourites: new Set(),
  watchlater: new Set(),
  loaded: false,
  toggle: () => {},
});

export function SavedListsProvider({ children }: { children: React.ReactNode }) {
  const [favourites, setFavourites] = useState<Set<string>>(new Set());
  const [watchlater, setWatchlater] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const inFlight = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/lists")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setFavourites(new Set(d.favourite ?? []));
          setWatchlater(new Set(d.watchlater ?? []));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const toggle = useCallback((dramaId: string, list: ListType) => {
    const key = `${list}:${dramaId}`;
    if (inFlight.current.has(key)) return;
    const setFn = list === "favourite" ? setFavourites : setWatchlater;
    const getSet = list === "favourite" ? favourites : watchlater;
    const adding = !getSet.has(dramaId);
    // optimistic
    setFn((prev) => {
      const next = new Set(prev);
      if (adding) next.add(dramaId);
      else next.delete(dramaId);
      return next;
    });
    inFlight.current.add(key);
    fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drama_id: dramaId, list, action: adding ? "add" : "remove" }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("failed");
      })
      .catch(() => {
        // revert on failure
        setFn((prev) => {
          const next = new Set(prev);
          if (adding) next.delete(dramaId);
          else next.add(dramaId);
          return next;
        });
      })
      .finally(() => inFlight.current.delete(key));
  }, [favourites, watchlater]);

  const value = useMemo(
    () => ({ favourites, watchlater, loaded, toggle }),
    [favourites, watchlater, loaded, toggle]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSavedLists() {
  return useContext(Ctx);
}

/** ♥ / 🔖 buttons for drama tiles. Stops click-through to the drama page. */
export function SaveButtons({ dramaId }: { dramaId: string }) {
  const { favourites, watchlater, toggle } = useSavedLists();
  const isFav = favourites.has(dramaId);
  const isWl = watchlater.has(dramaId);

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full text-base shadow-md backdrop-blur transition active:scale-90";

  return (
    <div
      className="absolute right-2 top-2 z-10 flex flex-col gap-1.5"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
        title={isFav ? "Remove from favourites" : "Add to favourites"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(dramaId, "favourite");
        }}
        className={`${btn} ${isFav ? "bg-primary text-black" : "bg-black/50 text-white/90 hover:text-white"}`}
      >
        {isFav ? "♥" : "♡"}
      </button>
      <button
        aria-label={isWl ? "Remove from watch later" : "Add to watch later"}
        title={isWl ? "Remove from watch later" : "Add to watch later"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(dramaId, "watchlater");
        }}
        className={`${btn} ${isWl ? "bg-gold text-black" : "bg-black/50 text-white/90 hover:text-white"}`}
      >
        🔖
      </button>
    </div>
  );
}
