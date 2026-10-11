import Link from "next/link";
import { notFound } from "next/navigation";
import { browseCollection, COLLECTIONS } from "@/lib/db";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const collection = COLLECTIONS.find((c) => c.slug === slug);
  if (!collection) notFound();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { dramas, total } = await browseCollection(slug, page, PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/explore" className="text-sm text-muted hover:text-primary">← Explore</Link>
        <h1 className="mt-2 text-3xl font-bold">
          <span className="mr-2">{collection.icon}</span>
          {collection.title}
        </h1>
        <p className="mt-1 text-sm text-muted">{collection.description}</p>
        <p className="mt-1 text-xs text-muted">{total.toLocaleString()} titles</p>
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
        buildHref={(p) => `/collection/${slug}${p === 1 ? "" : `?page=${p}`}`}
      />
    </div>
  );
}
