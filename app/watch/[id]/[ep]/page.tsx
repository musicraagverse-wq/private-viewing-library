import Link from "next/link";
import { notFound } from "next/navigation";
import { getDrama, getProgress, pingDb } from "@/lib/db";
import { parseEpisodeUrls, dailymotionId } from "@/lib/types";
import WatchClient from "./WatchClient";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: { id: string; ep: string } }) {
  const id = decodeURIComponent(params.id);
  const ep = Math.max(1, parseInt(params.ep, 10) || 1);

  let drama;
  try {
    await pingDb();
    drama = await getDrama(id);
  } catch {
    return (
      <div className="glass rounded-xl p-10 text-center text-sm text-amber-300">
        Library database is busy (bulk import in progress). Please refresh in a moment.
      </div>
    );
  }
  if (!drama) notFound();

  const urls = parseEpisodeUrls(drama.episode_urls);
  const totalEps = urls.length || drama.episode_count || 0;
  const videoUrl = ep >= 1 && ep <= urls.length ? urls[ep - 1] : null;
  const dm = !videoUrl ? dailymotionId(drama.alt_source) : null;
  const progress = await getProgress(drama.id);
  const resumeAt = progress && progress.episode === ep ? progress.position_seconds : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Link href={`/drama/${encodeURIComponent(drama.id)}`} className="text-sm text-slate-400 hover:text-fuchsia-300">
          ← {drama.title}
        </Link>
        <div className="text-sm font-bold text-slate-300">
          EP {ep}{totalEps > 0 ? ` / ${totalEps}` : ""}
        </div>
      </div>

      <WatchClient
        dramaId={drama.id}
        episode={ep}
        totalEps={totalEps}
        videoUrl={videoUrl}
        dailymotionEmbed={dm ? `https://www.dailymotion.com/embed/video/${dm}` : null}
        resumeAt={resumeAt}
      />

      {/* Prev / Next */}
      <div className="flex items-center justify-between">
        {ep > 1 ? (
          <Link
            href={`/watch/${encodeURIComponent(drama.id)}/${ep - 1}`}
            className="glass rounded-xl px-5 py-2 text-sm font-bold text-slate-200 hover:text-fuchsia-300"
          >
            ← EP {ep - 1}
          </Link>
        ) : <span />}
        {totalEps > 0 && ep < totalEps ? (
          <Link
            href={`/watch/${encodeURIComponent(drama.id)}/${ep + 1}`}
            className="glass rounded-xl px-5 py-2 text-sm font-bold text-slate-200 hover:text-fuchsia-300"
          >
            EP {ep + 1} →
          </Link>
        ) : <span />}
      </div>

      {!videoUrl && !dm && (
        <div className="glass rounded-xl p-8 text-center text-sm text-slate-400">
          No video available for this episode yet.
        </div>
      )}
    </div>
  );
}
