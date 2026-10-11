import Link from "next/link";
import { getArtists } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const artists = await getArtists();

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          🎭 <span className="pop-text">Artists</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          {artists.length.toLocaleString()} actors & actresses across your collection — tap one to see their dramas! ✨
        </p>
      </section>

      <section>
        <div className="flex flex-wrap gap-2">
          {artists.map((a) => (
            <Link
              key={a.actor}
              href={`/artist/${encodeURIComponent(a.actor)}`}
              className="den-card den-card-hover rounded-full px-4 py-2 text-sm font-extrabold text-cream hover:text-pop"
            >
              {a.actor} <span className="text-muted">({a.count.toLocaleString()})</span>
            </Link>
          ))}
        </div>
        {artists.length === 0 && (
          <p className="text-sm text-muted">No cast data yet.</p>
        )}
      </section>
    </div>
  );
}
