import Link from "next/link";
import Image from "next/image";
import { SaveButtons } from "./SavedLists";
import PlatformMark from "./PlatformMark";

export type DramaRow = {
  id: string;
  title: string;
  poster_url: string | null;
  episode_count: number | null;
  platform: string | null;
  has_videos: number;
  alt_source: string | null;
  imdb_rating?: number | null;
};

function gradientFor(title: string): string {
  const palettes = [
    "from-red-950 via-neutral-900 to-neutral-800",
    "from-neutral-900 via-red-950 to-neutral-800",
    "from-stone-900 via-neutral-900 to-red-950",
  ];
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palettes[h % palettes.length];
}

export function Poster({ title, posterUrl, className }: { title: string; posterUrl: string | null; className?: string }) {
  if (posterUrl) {
    return (
      <Image
        src={posterUrl}
        alt={title}
        loading="lazy"
        fill
        sizes="(max-width: 640px) 33vw, (max-width: 1024px) 25vw, 12vw"
        className={`object-cover ${className ?? ""}`}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br p-3 text-center ${gradientFor(title)} ${className ?? ""}`}>
      <span className="line-clamp-4 text-xs font-bold text-white/90">{title}</span>
    </div>
  );
}

export function dailymotionId(alt: string | null): string | null {
  if (!alt) return null;
  const m = alt.match(/^dailymotion:(.+)$/);
  return m ? m[1] : null;
}

export default function DramaCard({ drama, fixedWidth }: { drama: DramaRow; fixedWidth?: boolean }) {
  const hasDm = !!dailymotionId(drama.alt_source);
  return (
    <Link
      href={`/drama/${encodeURIComponent(drama.id)}`}
      className={`card-hover group overflow-hidden rounded-lg bg-card ${fixedWidth ? "w-36 shrink-0 sm:w-40" : ""}`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Poster
          title={drama.title}
          posterUrl={drama.poster_url}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <SaveButtons dramaId={drama.id} />
        {drama.has_videos ? (
          <div className="absolute left-2 top-2 rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-black">
            ▶ Free
          </div>
        ) : hasDm ? (
          <div className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-[10px] font-bold text-black">
            Dailymotion
          </div>
        ) : null}
        {drama.imdb_rating != null && (
          <div className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-gold backdrop-blur">
            ★ {drama.imdb_rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text group-hover:text-primary">
          {drama.title}
        </h3>
        <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
          <span className="truncate">
            {drama.platform ? <PlatformMark platform={drama.platform} className="h-3.5 w-3.5" /> : ""}
          </span>
          <span>{drama.episode_count ? `${drama.episode_count} eps` : ""}</span>
        </div>
      </div>
    </Link>
  );
}
