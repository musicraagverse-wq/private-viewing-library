import Link from "next/link";
import { getGenres, getTropes, COLLECTIONS } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [genres, tropes] = await Promise.all([getGenres(), getTropes()]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-3xl tracking-wide sm:text-4xl">
          Explore the <span className="marquee-text">Collection</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Browse by genre or trope — find your next obsession.
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl tracking-wide">Curated Collections</h2>
        <p className="mb-4 text-xs text-muted">
          Hand-picked themes — unique to your theater.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/collection/${c.slug}`}
              className="ticket ticket-hover p-5"
            >
              <div className="text-2xl">{c.icon}</div>
              <h3 className="mt-2 font-display text-lg text-marquee">{c.title}</h3>
              <p className="mt-1 text-xs text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl tracking-wide">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.genre}
              href={`/genre/${encodeURIComponent(g.genre)}`}
              className="ticket ticket-hover rounded-full px-4 py-2 text-sm font-bold text-cream hover:text-marquee"
            >
              {g.genre} <span className="text-muted">({g.c.toLocaleString()})</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl tracking-wide">Tropes</h2>
        <p className="mb-4 text-xs text-muted">
          Detected from titles and synopses — the classic short drama formulas.
        </p>
        <div className="flex flex-wrap gap-2">
          {tropes.map((t) => (
            <Link
              key={t.trope}
              href={`/trope/${encodeURIComponent(t.trope)}`}
              className="ticket ticket-hover rounded-full px-4 py-2 text-sm font-bold text-cream hover:text-marquee"
            >
              {t.trope} <span className="text-muted">({t.c.toLocaleString()})</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
