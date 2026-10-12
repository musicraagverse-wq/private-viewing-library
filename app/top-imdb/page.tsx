import Link from "next/link";
import { getTopImdb, type TopImdbSort } from "@/lib/db";
import { Poster } from "@/components/DramaCard";

export const dynamic = "force-dynamic";

const SIZES = [10, 25, 50, 100, 250, 500, 1000];

const SORTS: { key: TopImdbSort; label: string; blurb: string }[] = [
  {
    key: "weighted",
    label: "Weighted",
    blurb:
      "Ranked by IMDb weighted rating (the formula behind IMDb's Top 250) — minimum 25 votes, so a 9.0 with a handful of votes can't outrank a proven 8.5.",
  },
  {
    key: "rating",
    label: "Highest rated",
    blurb:
      "Ranked by raw IMDb rating, highest first — minimum 25 votes to keep one-off spikes out.",
  },
  {
    key: "votes",
    label: "Most voted",
    blurb: "Ranked by number of IMDb votes — the most talked-about dramas first.",
  },
];

function hrefWith(n: number, sort: TopImdbSort) {
  return `/top-imdb?n=${n}&sort=${sort}`;
}

export default async function TopImdbPage({
  searchParams,
}: {
  searchParams?: { n?: string; sort?: string };
}) {
  const n = SIZES.includes(Number(searchParams?.n)) ? Number(searchParams!.n) : 100;
  const sort: TopImdbSort = SORTS.some((s) => s.key === searchParams?.sort)
    ? (searchParams!.sort as TopImdbSort)
    : "weighted";
  const active = SORTS.find((s) => s.key === sort)!;
  const list = await getTopImdb(n, sort);

  return (
    <div>
      <h1 className="text-3xl font-bold sm:text-4xl">Top IMDb Rated</h1>
      <p className="mt-2 text-sm text-muted">{active.blurb}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={hrefWith(n, s.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              s.key === sort
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text hover:border-primary hover:text-primary"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SIZES.map((s) => (
          <Link
            key={s}
            href={hrefWith(s, sort)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold ${
              s === n
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text hover:border-primary hover:text-primary"
            }`}
          >
            Top {s}
          </Link>
        ))}
      </div>

      <p className="mb-3 mt-4 text-sm text-muted">
        Showing top {list.length} by {active.label.toLowerCase()}
      </p>

      {list.length > 0 ? (
        <ol className="flex flex-col gap-2">
          {list.map((d, i) => (
            <li key={d.id}>
              <Link
                href={`/drama/${encodeURIComponent(d.id)}`}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface p-3 transition hover:border-primary"
              >
                <span className="w-10 shrink-0 text-center text-2xl font-extrabold text-primary">
                  {i + 1}
                </span>
                <span className="h-16 w-12 shrink-0 overflow-hidden rounded-md">
                  <Poster title={d.title} posterUrl={d.poster_url} className="h-full w-full" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.title}</span>
                  <span className="text-sm text-muted">
                    ★ {d.imdb_rating?.toFixed(1)}
                    <span className="text-muted">
                      {" "}
                      ({d.imdb_votes?.toLocaleString()} votes)
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted">No rated dramas found.</p>
      )}
    </div>
  );
}
