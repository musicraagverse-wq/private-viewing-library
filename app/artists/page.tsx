import Link from "next/link";
import { getArtists } from "@/lib/db";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q ?? "").trim();
  const all = await getArtists();
  const artists = q
    ? all.filter((a) => a.actor.toLowerCase().includes(q.toLowerCase()))
    : all;

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-4xl font-bold sm:text-5xl">Artists</h1>
        <p className="mt-2 text-sm text-muted">
          {all.length.toLocaleString()} actors &amp; actresses across your
          collection — tap one to see their dramas.
        </p>
        <form method="GET" className="mt-4 flex max-w-md gap-2">
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

      <section>
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
          <p className="text-sm text-muted">
            No artists found{q ? ` for “${q}”` : ""}.
          </p>
        )}
      </section>
    </div>
  );
}
