import Link from "next/link";
import { getArtists } from "@/lib/db";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function letterOf(name: string): string {
  const ch = name.charAt(0).toUpperCase();
  return /[A-Z]/.test(ch) ? ch : "#";
}

function hrefWith(p: { q?: string; letter?: string; photo?: string }): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.letter) sp.set("letter", p.letter);
  if (p.photo) sp.set("photo", p.photo);
  const s = sp.toString();
  return `/artists${s ? `?${s}` : ""}`;
}

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams?: { q?: string; letter?: string; photo?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const letter = (searchParams?.letter ?? "").toUpperCase();
  const photosOnly = searchParams?.photo === "1";
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
    return true;
  });

  const filtering = q !== "" || letter !== "" || photosOnly;

  const chipCls = (active: boolean) =>
    `rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
      active
        ? "bg-primary text-white"
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
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search artists…"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
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
            href={hrefWith({ q, photo: "1" })}
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
                href={hrefWith({ q, letter: L, photo: photosOnly ? "1" : undefined })}
                className={chipCls(letter === L)}
                title={`${n.toLocaleString()} artists`}
              >
                {L}
              </Link>
            );
          })}
          {hasOther && (
            <Link
              href={hrefWith({ q, letter: "#", photo: photosOnly ? "1" : undefined })}
              className={chipCls(letter === "#")}
            >
              #
            </Link>
          )}
        </div>
      </section>

      <section>
        <p className="mb-3 text-sm text-muted">
          {filtering ? (
            <>
              {artists.length.toLocaleString()} result{artists.length === 1 ? "" : "s"}
              {letter && <> starting with “{letter}”</>}
              {photosOnly && <> with photos</>}
              {q && <> matching “{q}”</>} —{" "}
              <Link href="/artists" className="text-primary hover:underline">
                clear
              </Link>
            </>
          ) : (
            <>Showing all artists A–Z</>
          )}
        </p>
        {artists.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {artists.map((a) => (
              <Link
                key={a.nconst ?? a.actor}
                href={`/artist/${encodeURIComponent(a.actor)}`}
                className="card-hover flex items-center gap-3 rounded-xl border border-border bg-surface p-3"
              >
                {a.photo_url ? (
                  <img
                    src={a.photo_url}
                    alt={a.actor}
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary">
                    {initials(a.actor)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-text">
                    {a.actor}
                  </span>
                  <span className="block text-xs text-muted">
                    {a.count.toLocaleString()} {a.count === 1 ? "drama" : "dramas"}
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
