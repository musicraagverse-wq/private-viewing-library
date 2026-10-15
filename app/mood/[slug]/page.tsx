import Link from "next/link";
import { notFound } from "next/navigation";
import { browseByTropes } from "@/lib/db";
import { MOODS, getMood } from "@/lib/moods";
import DramaCard from "@/components/DramaCard";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic";

const PER_PAGE = 24;

export default async function MoodPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const slug = decodeURIComponent(params.slug);
  const mood = getMood(slug);
  if (!mood) notFound();

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { dramas, total } = await browseByTropes(mood.tropes, page, PER_PAGE, "rating");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-primary">← Home</Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          <span className="mr-2" aria-hidden="true">{mood.icon}</span>
          {mood.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">{mood.description}</p>
        <p className="mt-1 text-xs text-muted">{total.toLocaleString()} titles</p>
      </div>

      {/* Other moods */}
      <div className="flex flex-wrap gap-2">
        {MOODS.filter((m) => m.slug !== slug).map((m) => (
          <Link
            key={m.slug}
            href={`/mood/${m.slug}`}
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            <span aria-hidden="true">{m.icon}</span>
            {m.title}
          </Link>
        ))}
      </div>

      {dramas.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center text-sm text-muted">
          No dramas found for this mood yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {dramas.map((d) => (
            <DramaCard key={d.id} drama={d} />
          ))}
        </div>
      )}
      <Pagination
        page={page}
        total={total}
        perPage={PER_PAGE}
        buildHref={(p) => `/mood/${slug}${p === 1 ? "" : `?page=${p}`}`}
      />
    </div>
  );
}
