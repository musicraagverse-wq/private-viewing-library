import Link from "next/link";
import { notFound } from "next/navigation";
import { browseByTrope } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function TropePage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { page?: string };
}) {
  const trope = decodeURIComponent(params.name);
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { dramas, total } = await browseByTrope(trope, page, PER_PAGE);

  if (total === 0) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/explore" className="text-sm text-muted hover:text-primary">← Explore</Link>
        <h1 className="mt-2 text-3xl font-bold">{trope}</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString()} titles</p>
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
        buildHref={(p) => `/trope/${encodeURIComponent(trope)}${p === 1 ? "" : `?page=${p}`}`}
      />
    </div>
  );
}
