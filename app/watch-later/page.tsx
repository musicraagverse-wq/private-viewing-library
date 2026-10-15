import { getSavedDramas, getSavedIds } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";
import ShareButton from "@/components/ShareButton";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function WatchLaterPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const [{ dramas, total }, saved] = await Promise.all([
    getSavedDramas("watchlater", page, PER_PAGE),
    getSavedIds(),
  ]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">🔖 Watch Later</h1>
          <p className="mt-2 text-sm text-muted">
            {total === 0
              ? "Nothing saved yet — tap the 🔖 on any drama tile to add it here."
              : `${total.toLocaleString()} saved ${total === 1 ? "drama" : "dramas"}`}
          </p>
        </div>
        <ShareButton dramaIds={saved.watchlater} label="Watch Later" />
      </div>

      {dramas.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {dramas.map((d) => (
              <DramaCard key={d.id} drama={d} />
            ))}
          </div>
          <div className="mt-8">
            <Pagination page={page} total={total} perPage={PER_PAGE} buildHref={(p) => `/watch-later?page=${p}`} />
          </div>
        </>
      ) : null}
    </div>
  );
}
