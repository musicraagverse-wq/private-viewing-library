"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface FilterOptions {
  genres: { genre: string; c: number }[];
  tropes: { trope: string; c: number }[];
  platforms: { platform: string; c: number }[];
}

const RATING_OPTIONS = [
  { value: "0", label: "Any rating" },
  { value: "7", label: "7+ stars" },
  { value: "8", label: "8+ stars" },
  { value: "9", label: "9+ stars" },
];

const LENGTH_OPTIONS = [
  { value: "", label: "Any length" },
  { value: "short", label: "Quick (<40 eps)" },
  { value: "medium", label: "Medium (40–80)" },
  { value: "long", label: "Long binge (80+)" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Recently added" },
  { value: "rating", label: "Highest rated" },
  { value: "az", label: "Title A–Z" },
  { value: "za", label: "Title Z–A" },
];

const selectCls =
  "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none";

/** Prime Video-style combinable filter panel. State lives in the URL for deep linking. */
export default function FilterPanel({ options }: { options: FilterOptions }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "0") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/browse?${params.toString()}`);
  };

  const get = (key: string) => searchParams.get(key) ?? "";

  const chips: { key: string; label: string }[] = [];
  if (get("genre")) chips.push({ key: "genre", label: `Genre: ${get("genre")}` });
  if (get("trope")) chips.push({ key: "trope", label: `Trope: ${get("trope")}` });
  if (get("platform")) chips.push({ key: "platform", label: `Platform: ${get("platform")}` });
  if (get("minRating") && get("minRating") !== "0") chips.push({ key: "minRating", label: `${get("minRating")}+ stars` });
  if (get("ep")) chips.push({ key: "ep", label: LENGTH_OPTIONS.find((o) => o.value === get("ep"))?.label ?? get("ep") });
  if (get("videos") === "1") chips.push({ key: "videos", label: "Watchable only" });
  if (get("q")) chips.push({ key: "q", label: `"${get("q")}"` });

  const clearOne = (key: string) => set(key, "");
  const clearAll = () => router.push("/browse");

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      {/* Mobile: collapsible */}
      <details className="lg:hidden" open={chips.length > 0}>
        <summary className="cursor-pointer list-none text-sm font-bold text-text">
          <span className="flex items-center justify-between">
            Filters {chips.length > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-white">{chips.length}</span>}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
          </span>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FilterFields get={get} set={set} options={options} />
        </div>
      </details>

      {/* Desktop: always visible */}
      <div className="hidden grid-cols-3 gap-4 lg:grid xl:grid-cols-6">
        <FilterFields get={get} set={set} options={options} />
      </div>

      {/* Active chips */}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => clearOne(c.key)}
              aria-label={`Remove filter ${c.label}`}
              className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/25"
            >
              {c.label}
              <span aria-hidden="true">✕</span>
            </button>
          ))}
          <button onClick={clearAll} className="text-xs font-semibold text-muted underline hover:text-primary">
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterFields({
  get,
  set,
  options,
}: {
  get: (k: string) => string;
  set: (k: string, v: string) => void;
  options: FilterOptions;
}) {
  const videos = get("videos") === "1";
  const sort = get("sort") || "newest";
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Genre</span>
        <select value={get("genre")} onChange={(e) => set("genre", e.target.value)} className={selectCls}>
          <option value="">All genres</option>
          {options.genres.map((g) => (
            <option key={g.genre} value={g.genre}>{g.genre} ({g.c.toLocaleString()})</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Trope</span>
        <select value={get("trope")} onChange={(e) => set("trope", e.target.value)} className={selectCls}>
          <option value="">All tropes</option>
          {options.tropes.map((t) => (
            <option key={t.trope} value={t.trope}>{t.trope} ({t.c.toLocaleString()})</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Platform</span>
        <select value={get("platform")} onChange={(e) => set("platform", e.target.value)} className={selectCls}>
          <option value="">All platforms</option>
          {options.platforms.map((p) => (
            <option key={p.platform} value={p.platform}>{p.platform}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Min. rating</span>
        <select value={get("minRating") || "0"} onChange={(e) => set("minRating", e.target.value)} className={selectCls}>
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Length</span>
        <select value={get("ep")} onChange={(e) => set("ep", e.target.value)} className={selectCls}>
          {LENGTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-3">
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-semibold text-muted">Sort by</span>
          <select value={sort} onChange={(e) => set("sort", e.target.value)} className={selectCls}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button
          onClick={() => set("videos", videos ? "" : "1")}
          aria-pressed={videos}
          className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition ${
            videos ? "border-primary bg-primary/15 text-primary" : "border-border text-muted hover:text-primary"
          }`}
        >
          ▶ Watchable
        </button>
      </div>
    </>
  );
}
