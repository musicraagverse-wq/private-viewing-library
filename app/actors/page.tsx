import Link from "next/link";
import { getArtists } from "@/lib/db";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const SORTS = [
  { key: "az", label: "A–Z" },
  { key: "za", label: "Z–A" },
  { key: "most", label: "Most dramas" },
  { key: "least", label: "Fewest dramas" },
] as const;

const MIN_DRAMAS = [2, 5, 10, 20, 50];

function letterOf(name: string): string {
  const ch = name.charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

type Filters = {
  q?: string;
  letter?: string;
  photo?: string;
  sort?: string;
  min?: string;
};

function hrefWith(p: Filters): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.letter) sp.set("letter", p.letter);
  if (p.photo) sp.set("photo", p.photo);
  if (p.sort && p.sort !== "az") sp.set("sort", p.sort);
  if (p.min) sp.set("min", p.min);
  const s = sp.toString();
  return `/actors${s ? `?${s}` : ""}`;
}

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams?: { q?: string; letter?: string; photo?: string; sort?: string; min?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const letter = (searchParams?.letter ?? "").toUpperCase();
  const photosOnly = searchParams?.photo === "1";
  const sort = (["az", "za", "most", "least"].includes(searchParams?.sort ?? "")
    ? searchParams!.sort
    : "az") as "az" | "za" | "most" | "least";
  const minParsed = parseInt(searchParams?.min ?? "", 10);
  const minDramas = Number.isFinite(minParsed) && minParsed > 1 ? minParsed : 0;
  const all = await getArtists();

  const letterCounts = new Map<string, number>();
  let photoCount = 0;
  for (const a of all) {
    const k = letterOf(a.actor);
    letterCounts.set(k, (letterCounts.get(k) ?? 0) + 1);
    if (a.photo_url) photoCount++;
  }
  const hasOther = Array.from(letterCounts.keys()).some((k) => k === "#");

  const ql = q.toLowerCase();
  const artists = all.filter((a) => {
    if (ql && !a.actor.toLowerCase().includes(ql)) return false;
    if (letter && letterOf(a.actor) !== letter) return false;
    if (photosOnly && !a.photo_url) return false;
    if (minDramas && a.count < minDramas) return false;
    return true;
  });

  const sorted = [...artists].sort((a, b) => {
    switch (sort) {
      case "za":
        return b.actor.localeCompare(a.actor);
      case "most":
        return b.count - a.count || a.actor.localeCompare(b.actor);
      case "least":
        return a.count - b.count || a.actor.localeCompare(b.actor);
      default:
        return a.actor.localeCompare(b.actor);
    }
  });

  const filtering = q !== "" || letter !== "" || photosOnly || sort !== "az" || minDramas > 0;
  const sortLabel = SORTS.find((s) => s.key === sort)?.label ?? "A–Z";
  // Current filters, carried over when the user changes one of them.
  const base: Filters = {
    q: q || undefined,
    letter: letter || undefined,
    photo: photosOnly ? "1" : undefined,
    sort,
    min: minDramas ? String(minDramas) : undefined,
  };

  const chipCls = (active: boolean) =>
    `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
      active
        ? "bg-primary text-black"
        : "border border-border bg-surface text-muted hover:text-text"
    }`;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold sm:text-5xl">Artists</h1>
        <p className="mt-2 text-sm text-muted">
          {all.length.toLocaleString()} actors &amp; actresses across your
          collection — tap one to see their dramas.
        </p>
        <form method="GET" className="mt-4 flex max-w-md gap-2">
          {letter && <input type="hidden" name="letter" value={letter} />}
          {photosOnly && <input type="hidden" name="photo" value="1" />}
          {sort !== "az" && <input type="hidden" name="sort" value={sort} />}
          {minDramas > 0 && (
            <input type="hidden" name="min" value={String(minDramas)} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search actors…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Search
          </button>
        </form>
      </section>

      <section aria-label="Browse artists">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={hrefWith({ q })} className={chipCls(!filtering)}>
            All
          </Link>
          <Link
            href={hrefWith({ ...base, photo: "1" })}
            className={chipCls(photosOnly && !letter)}
          >
            📷 Photos ({photoCount.toLocaleString()})
          </Link>
          {LETTERS.map((L) => {
            const n = letterCounts.get(L) ?? 0;
            if (n === 0) return null;
            return (
              <Link
                key={L}
                href={hrefWith({ ...base, letter: L })}
                className={chipCls(letter === L)}
                title={`${n.toLocaleString()} artists`}
              >
                {L}
              </Link>
            );
          })}
          {hasOther && (
            <Link
              href={hrefWith({ ...base, letter: "#" })}
              className={chipCls(letter === "#")}
            >
              #
            </Link>
          )}
        </div>
      </section>

      <section
        aria-label="Sort and filter artists"
        className="flex flex-wrap items-center gap-x-6 gap-y-3"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted">Sort</span>
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={hrefWith({ ...base, sort: s.key })}
              className={chipCls(sort === s.key)}
            >
              {s.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-semibold text-muted">
            Min. dramas
          </span>
          <Link
            href={hrefWith({ ...base, min: undefined })}
            className={chipCls(minDramas === 0)}
          >
            All
          </Link>
          {MIN_DRAMAS.map((n) => (
            <Link
              key={n}
              href={hrefWith({ ...base, min: String(n) })}
              className={chipCls(minDramas === n)}
            >
              {n}+
            </Link>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm text-muted">
          {filtering ? (
            <>
              {sorted.length.toLocaleString()} result
              {sorted.length === 1 ? "" : "s"}
              {letter && <> starting with “{letter}”</>}
              {photosOnly && <> with photos</>}
              {q && <> matching “{q}”</>}
              {minDramas > 0 && <> in {minDramas}+ dramas</>}
              {sort !== "az" && <> · {sortLabel}</>} —{" "}
              <Link href="/actors" className="text-primary hover:underline">
                clear
              </Link>
            </>
          ) : (
            <>Showing all artists A–Z</>
          )}
        </p>
        {sorted.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {sorted.map((a) => (
              <Link
                key={a.nconst ?? a.actor}
                href={`/actor/${encodeURIComponent(a.actor)}`}
                className="card-hover overflow-hidden rounded-xl border border-border bg-surface"
              >
                {a.photo_url ? (
                  <img
                    src={a.photo_url}
                    alt={a.actor}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <span className="flex aspect-square w-full items-center justify-center bg-primary/15 text-4xl font-bold text-primary">
                    {initials(a.actor)}
                  </span>
                )}
                <span className="block p-3">
                  <span className="block truncate text-sm font-semibold text-text">
                    {a.actor}
                  </span>
                  <span className="block text-xs text-muted">
                    {a.count.toLocaleString()}{" "}
                    {a.count === 1 ? "drama" : "dramas"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No artists found.</p>
        )}
      </section>
    </div>
  );
}
