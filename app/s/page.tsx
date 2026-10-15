import Link from "next/link";
import { getDramasByIds } from "@/lib/db";
import DramaCard from "@/components/DramaCard";

export const dynamic = "force-dynamic";

/** Shared list: /s?d=id1,id2,id3 — anyone with the link can view it. */
export default async function SharedListPage({
  searchParams,
}: {
  searchParams: { d?: string };
}) {
  const ids = (searchParams.d ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const dramas = await getDramasByIds(ids);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-muted hover:text-primary">← Home</Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Shared List</h1>
        <p className="callout-info mt-3 max-w-2xl" role="status">
          Someone shared {dramas.length} drama{dramas.length === 1 ? "" : "s"} with you. This is a read-only preview — save anything you like to your own lists.
        </p>
      </div>
      {dramas.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <p className="text-base font-semibold text-text">This list is empty or expired</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            The link may be incomplete. Ask the sender to copy it again.
          </p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-primary px-6 py-2 text-sm font-bold text-black hover:bg-primaryhover">
            Browse all dramas
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {dramas.map((d) => (
            <DramaCard key={d.id} drama={d} />
          ))}
        </div>
      )}
    </div>
  );
}
