import Link from "next/link";
import { notFound } from "next/navigation";
import { browseByTrope, hideDailymotion } from "@/lib/db";
import { resolveTag, TAG_HOME } from "@/lib/tag-mapping";
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
  const raw = decodeURIComponent(params.name);
  // Aliases (case variants, synonyms, translations) resolve to the canonical.
  const resolved = resolveTag(raw, "trope");
  // Dropped (junk) labels have no page.
  if (!resolved) notFound();
  const trope = resolved.canonical;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { dramas, total } = await browseByTrope(trope, page, PER_PAGE, hideDailymotion());

  // Unknown labels with no dramas 404; known catalogue labels with no
  // dramas yet (e.g. new VerticalShorts labels) show an empty state.
  if (total === 0 && !TAG_HOME[trope]) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/explore" className="text-sm text-muted hover:text-primary">← Explore</Link>
        <h1 className="mt-2 text-3xl font-bold">{trope}</h1>
        <p className="mt-1 text-sm text-muted">{total.toLocaleString()} titles</p>
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted">
          No titles carry this label yet — it is part of the catalogue and will
          fill in as dramas are tagged.
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
