import Link from "next/link";
import Image from "next/image";
import type { DramaRow } from "@/lib/types";
import PlatformMark from "./PlatformMark";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function Hero({ drama }: { drama: DramaRow }) {
  const genres = parseList((drama as any).genres).slice(0, 3);
  const rating = (drama as any).imdb_rating as number | null;

  return (
    <section aria-label="Featured drama" className="relative overflow-hidden rounded-3xl border border-border">
      {/* Ambient backdrop: blurred poster */}
      {drama.poster_url && (
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src={drama.poster_url}
            alt=""
            fill
            priority
            sizes="100vw"
            className="scale-110 object-cover blur-2xl brightness-[0.35] saturate-150"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent" aria-hidden="true" />

      <div className="relative flex min-h-[380px] items-center gap-8 p-6 sm:p-10 md:min-h-[440px]">
        {/* Poster card */}
        {drama.poster_url && (
          <div className="hidden w-44 shrink-0 overflow-hidden rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10 sm:block md:w-52">
            <div className="relative aspect-[3/4]">
              <Image src={drama.poster_url} alt={drama.title} fill sizes="208px" className="object-cover" priority />
            </div>
          </div>
        )}

        {/* Copy */}
        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Featured
          </p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            {drama.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
            {rating != null && (
              <span className="font-semibold text-gold" aria-label={`IMDb rating ${rating.toFixed(1)}`}>
                ★ {rating.toFixed(1)}
              </span>
            )}
            {drama.episode_count ? <span>{drama.episode_count} episodes</span> : null}
            {drama.platform ? (
              <span className="flex items-center gap-1.5">
                <PlatformMark platform={drama.platform} className="h-4 w-4" />
              </span>
            ) : null}
            <span className="rounded bg-primary px-2 py-0.5 text-xs font-bold text-white">▶ Free</span>
          </div>

          {drama.synopsis && (
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
              {drama.synopsis}
            </p>
          )}

          {genres.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {genres.map((g) => (
                <Link
                  key={g}
                  href={`/genre/${encodeURIComponent(g)}`}
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur transition-colors hover:border-primary hover:text-white"
                >
                  {g}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/drama/${encodeURIComponent(drama.id)}`}
              className="rounded-full bg-primary px-7 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition hover:bg-primarydark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              ▶ Watch Now
            </Link>
            <Link
              href={`/drama/${encodeURIComponent(drama.id)}`}
              className="rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/60"
            >
              More Info
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
