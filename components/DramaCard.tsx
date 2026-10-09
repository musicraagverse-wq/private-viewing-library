import Link from "next/link";
import type { DramaRow } from "@/lib/types";
import { dailymotionId } from "@/lib/types";

function gradientFor(title: string): string {
  const palettes = [
    "from-pop via-grape to-teal",
    "from-sunny via-pop to-grape",
    "from-teal via-grape to-pop",
    "from-grape via-pop to-sunny",
    "from-pop via-sunny to-teal",
    "from-teal via-pop to-grape",
  ];
  let h = 0;
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palettes[h % palettes.length];
}

export function Poster({
  title,
  posterUrl,
  className = "",
}: {
  title: string;
  posterUrl: string | null;
  className?: string;
}) {
  if (posterUrl) {
    return <img src={posterUrl} alt={`${title} poster`} loading="lazy" className={`object-cover ${className}`} />;
  }
  const initials = title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(title)} ${className}`}
      aria-label={`${title} artwork placeholder`}
    >
      <span className="text-3xl font-black text-white/80 drop-shadow">{initials}</span>
    </div>
  );
}

export function SourceBadge({ source }: { source: string | null }) {
  if (!source) return null;
  const colors: Record<string, string> = {
    everydrama: "bg-pop/20 text-pop border-pop/50",
    finddrama: "bg-teal/20 text-teal border-teal/50",
    freedrama: "bg-sunny/20 text-sunny border-sunny/50",
  };
  const cls = colors[source] ?? "bg-muted/20 text-muted border-muted/50";
  return (
    <span className={`rounded-full border-2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${cls}`}>
      {source}
    </span>
  );
}

export default function DramaCard({ drama, progress }: { drama: DramaRow; progress?: { episode: number } | null }) {
  const hasDm = !!dailymotionId(drama.alt_source);
  return (
    <Link
      href={`/drama/${encodeURIComponent(drama.id)}`}
      className="den-card den-card-hover group relative flex flex-col"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Poster
          title={drama.title}
          posterUrl={drama.poster_url}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        {progress && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-extrabold text-sunny backdrop-blur">
            EP {progress.episode}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug text-cream group-hover:text-pop">
          {drama.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] font-bold text-muted">
            {drama.episode_count ? `${drama.episode_count} eps` : "—"}
          </span>
          {drama.has_videos ? (
            <span className="text-[11px] font-extrabold text-teal">▶ Watch now</span>
          ) : (
            <span className="text-[11px] font-bold text-muted/60">Soon</span>
          )}
        </div>
      </div>
    </Link>
  );
}
