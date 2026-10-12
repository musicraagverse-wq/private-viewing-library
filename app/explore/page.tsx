import Link from "next/link";
import { getGenres, getTropes, getPlatforms, COLLECTIONS } from "@/lib/db";
import { platformLogo, platformInitial, formatPlatform, sortPlatforms } from "@/lib/platforms";
import { genreIcon, tropeIcon } from "@/lib/tag-icons";

export const dynamic = "force-dynamic";

const chip =
  "rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-text hover:border-primary hover:text-primary";

export default async function ExplorePage() {
  const [genres, tropes, platforms] = await Promise.all([
    getGenres(),
    getTropes(),
    getPlatforms(),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-4xl font-bold sm:text-5xl">Explore</h1>
        <p className="mt-2 text-sm text-muted">
          Browse by genre, platform, or trope — find your next obsession.
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-bold">Curated Collections</h2>
        <p className="mb-4 text-sm text-muted">
          Hand-picked themes from your personal collection.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLLECTIONS.map((c) => (
            <Link
              key={c.slug}
              href={`/collection/${c.slug}`}
              className="card-hover rounded-xl border border-border bg-surface p-5"
            >
              <div className="text-3xl">{c.icon}</div>
              <h3 className="mt-2 text-lg font-bold text-primary">{c.title}</h3>
              <p className="mt-1 text-xs text-muted">{c.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section id="genres" className="scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">Genres</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => {
            const icon = genreIcon(g.genre);
            return (
              <Link
                key={g.genre}
                href={`/genre/${encodeURIComponent(g.genre)}`}
                className={`${chip} flex items-center gap-1.5`}
              >
                {icon && <span>{icon}</span>}
                {g.genre} <span className="text-muted">({g.c.toLocaleString()})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="platforms" className="scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">Platforms</h2>
        <div className="flex flex-wrap gap-2">
          {sortPlatforms(platforms).map((p) => {
            const logo = platformLogo(p.platform);
            return (
              <Link
                key={p.platform}
                href={`/?platform=${encodeURIComponent(p.platform)}`}
                className={`${chip} flex items-center gap-2`}
              >
                {logo ? (
                  <img src={logo} alt="" className="h-4 w-4 rounded-sm" loading="lazy" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-white">
                    {platformInitial(p.platform)}
                  </span>
                )}
                {formatPlatform(p.platform)} <span className="text-muted">({p.c.toLocaleString()})</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="tropes" className="scroll-mt-24">
        <h2 className="mb-4 text-2xl font-bold">Tropes</h2>
        <p className="mb-4 text-sm text-muted">
          The classic drama formulas — spotted in titles &amp; synopses.
        </p>
        <div className="flex flex-wrap gap-2">
          {tropes.map((t) => {
            const icon = tropeIcon(t.trope);
            return (
              <Link
                key={t.trope}
                href={`/trope/${encodeURIComponent(t.trope)}`}
                className={`${chip} flex items-center gap-1.5`}
              >
                {icon && <span>{icon}</span>}
                {t.trope} <span className="text-muted">({t.c.toLocaleString()})</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
