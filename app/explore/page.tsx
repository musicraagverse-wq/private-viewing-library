import Link from "next/link";
import { getGenres, getTropes, getPlatforms, COLLECTIONS } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [genres, tropes, platforms] = await Promise.all([
    getGenres(),
    getTropes(),
    getPlatforms(),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
          🗺️ Explore the <span className="pop-text">Den</span>
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          Browse by genre or trope — find your next obsession! 🔥
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-2xl font-extrabold">🎨 Curated Collections</h2>
        <p className="mb-4 text-xs font-semibold text-muted">
          Hand-picked themes — only in your Den! ✨
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/collection/${c.slug}`}
              className="den-card den-card-hover p-5"
            >
              <div className="text-3xl">{c.icon}</div>
              <h3 className="mt-2 font-display text-lg font-extrabold text-pop">{c.title}</h3>
              <p className="mt-1 text-xs font-semibold text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="genres" className="scroll-mt-24">
        <h2 className="mb-4 font-display text-2xl font-extrabold">🎭 Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link
              key={g.genre}
              href={`/genre/${encodeURIComponent(g.genre)}`}
              className="den-card den-card-hover rounded-full px-4 py-2 text-sm font-extrabold text-cream hover:text-pop"
            >
              {g.genre} <span className="text-muted">({g.c.toLocaleString()})</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="platforms" className="scroll-mt-24">
        <h2 className="mb-4 font-display text-2xl font-extrabold">📱 Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <Link
              key={p.platform}
              href={`/?platform=${encodeURIComponent(p.platform)}`}
              className="den-card den-card-hover rounded-full px-4 py-2 text-sm font-extrabold text-cream hover:text-pop"
            >
              {p.platform} <span className="text-muted">({p.c.toLocaleString()})</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="tropes" className="scroll-mt-24">
        <h2 className="mb-4 font-display text-2xl font-extrabold">🔥 Tropes</h2>
        <p className="mb-4 text-xs font-semibold text-muted">
          The classic drama formulas — spotted in titles & synopses! 📚
        </p>
        <div className="flex flex-wrap gap-2">
          {tropes.map((t) => (
            <Link
              key={t.trope}
              href={`/trope/${encodeURIComponent(t.trope)}`}
              className="den-card den-card-hover rounded-full px-4 py-2 text-sm font-extrabold text-cream hover:text-pop"
            >
              {t.trope} <span className="text-muted">({t.c.toLocaleString()})</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
