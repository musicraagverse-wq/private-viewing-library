import Link from "next/link";
import { notFound } from "next/navigation";
import { browseByArtist } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default async function ArtistPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { page?: string };
}) {
  const actor = decodeURIComponent(params.name);
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { dramas, total } = await browseByArtist(actor, page, PER_PAGE);

  if (total === 0) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/artists" className="text-sm text-muted hover:text-primary">
          ← Artists
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-primary">
            {initials(actor)}
          </span>
          <div>
            <h1 className="text-3xl font-bold">{actor}</h1>
            <p className="mt-1 text-sm text-muted">
              {total.toLocaleString()} {total === 1 ? "title" : "titles"}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {dramas.map((d) => (
          <DramaCard key={d.id} drama={d} />
        ))}
      </div>
      <Pagination
        page={page}
        total={total}
        perPage={PER_PAGE}
        buildHref={(p) => `/artist/${encodeURIComponent(actor)}${p === 1 ? "" : `?page=${p}`}`}
      />
    </div>
  );
}
