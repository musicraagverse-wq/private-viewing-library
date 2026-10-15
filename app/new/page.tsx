import Link from "next/link";
import { getNewArrivals } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;
const TABS = ["all", "everydrama", "freedrama", "vibeshort", "finddrama", "reelall"] as const;

export default async function NewArrivalsPage({
  searchParams,
}: {
  searchParams?: { source?: string; page?: string };
}) {
  const source = (searchParams?.source ?? "all").toLowerCase();
  const tab = (TABS as readonly string[]).includes(source) ? source : "all";
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);

  const { dramas, total } = await getNewArrivals(tab, page, PER_PAGE);

  const hrefWith = (s: string, p: number) => `/new?source=${s}&page=${p}`;

  return (
    <div>
      <h1 className="text-3xl font-bold sm:text-4xl">New Arrivals</h1>
      <p className="mt-2 text-sm text-muted">
        The latest dramas added to your collection, newest first.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={hrefWith(t, 1)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize ${
              t === tab
                ? "border-primary bg-primary text-black"
                : "border-border bg-surface text-text hover:border-primary hover:text-primary"
            }`}
          >
            {t === "all" ? "All" : t}
          </Link>
        ))}
      </div>

      <p className="mb-3 mt-4 text-sm text-muted">
        {total.toLocaleString()} dramas
        {tab !== "all" && <> from {tab}</>}
      </p>

      {dramas.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {dramas.map((d) => (
            <DramaCard key={d.id} drama={d} />
          ))}
        </div>
      ) : (
        <p className="text-muted">Nothing here yet.</p>
      )}

      <Pagination page={page} total={total} perPage={PER_PAGE} buildHref={(p) => hrefWith(tab, p)} />
    </div>
  );
}
