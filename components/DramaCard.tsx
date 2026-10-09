import Link from "next/link";
import type { DramaRow } from "@/lib/types";
import { dailymotionId } from "@/lib/types";

function gradientFor(title: string): string {
  const palettes = [
    "from-amber-950 via-yellow-900 to-orange-800",
    "from-stone-900 via-amber-950 to-yellow-900",
    "from-orange-950 via-amber-900 to-stone-800",
    "from-yellow-950 via-orange-900 to-amber-800",
    "from-stone-950 via-orange-950 to-amber-900",
    "from-amber-900 via-stone-800 to-orange-900",
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
    everydrama: "bg-marquee/15 text-marquee border-marquee/40",
    finddrama: "bg-spotlight/10 text-spotlight border-spotlight/30",
    freedrama: "bg-cream/10 text-cream border-cream/30",
  };
  const cls = colors[source] ?? "bg-muted/10 text-muted border-muted/30";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {source}
    </span>
  );
}

export default function DramaCard({ drama, progress }: { drama: DramaRow; progress?: { episode: number } | null }) {
  const hasDm = !!dailymotionId(drama.alt_source);
  return (
    <Link
      href={`/drama/${encodeURIComponent(drama.id)}`}
      className="ticket ticket-hover group relative flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Poster
          title={drama.title}
          posterUrl={drama.poster_url}
          className="h-full w-full transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
        {progress && (
          <div className="absolute left-2 top-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-marquee backdrop-blur">
            EP {progress.episode}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 font-display text-sm leading-snug text-cream group-hover:text-marquee">
          {drama.title}
        </h3>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted">
            {drama.episode_count ? `${drama.episode_count} eps` : "—"}
          </span>
          {drama.has_videos ? (
            <span className="text-[11px] font-bold text-marquee">▶ Playable</span>
          ) : hasDm ? (
            <span className="text-[11px] font-bold text-spotlight">◈ Alt source</span>
          ) : (
            <span className="text-[11px] text-muted/60">No video</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[11px] text-muted/70">{drama.platform ?? ""}</span>
          <SourceBadge source={drama.source} />
        </div>
      </div>
    </Link>
  );
}
