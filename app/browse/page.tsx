import { browseFiltered, getGenres, getTropes, getPlatforms, pingDb, type FilterOpts } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";
import FilterPanel from "@/components/FilterPanel";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Browse All Dramas",
  description: "Filter the full short drama catalog by genre, trope, platform, rating, and length.",
};

const PER_PAGE = 24;

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const opts: FilterOpts = {
    q: (searchParams.q ?? "").trim(),
    genre: searchParams.genre ?? "",
    trope: searchParams.trope ?? "",
    platform: searchParams.platform ?? "",
    minRating: parseFloat(searchParams.minRating ?? "0") || 0,
    epRange: (["short", "medium", "long"] as const).includes(searchParams.ep as any) ? (searchParams.ep as "short" | "medium" | "long") : "",
    onlyWithVideos: searchParams.videos === "1",
    sort: (["newest", "rating", "az", "za"] as const).includes(searchParams.sort as any) ? (searchParams.sort as FilterOpts["sort"]) : "newest",
    page: Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1),
    perPage: PER_PAGE,
  };

  let dramas: Awaited<ReturnType<typeof browseFiltered>>["dramas"] = [];
  let total = 0;
  let genres: Awaited<ReturnType<typeof getGenres>> = [];
  let tropes: Awaited<ReturnType<typeof getTropes>> = [];
  let platforms: Awaited<ReturnType<typeof getPlatforms>> = [];
  let dbError = false;

  try {
    await pingDb();
    const [result, g, t, p] = await Promise.all([
      browseFiltered(opts),
      getGenres(),
      getTropes(),
      getPlatforms(),
    ]);
    dramas = result.dramas;
    total = result.total;
    genres = g;
    tropes = t;
    platforms = p;
  } catch {
    dbError = true;
  }

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    if (page > 1) params.set("page", String(page));
    const s = params.toString();
    return `/browse${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse All Dramas</h1>
        <p className="mt-1 text-sm text-muted">
          {dbError ? "Database is busy — please refresh in a moment." : `${total.toLocaleString()} titles match your filters`}
        </p>
      </div>

      <FilterPanel options={{ genres, tropes, platforms }} />

      {dramas.length === 0 && !dbError ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center">
          <p className="text-base font-semibold text-text">No dramas match these filters</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Try removing a filter or two — especially the rating and trope filters, which narrow things fast.
          </p>
          <Link href="/browse" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-black hover:bg-primaryhover">
            Clear all filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {dramas.map((d) => (
            <DramaCard key={d.id} drama={d} />
          ))}
        </div>
      )}

      <Pagination page={opts.page} total={total} perPage={PER_PAGE} buildHref={buildHref} />
    </div>
  );
}
