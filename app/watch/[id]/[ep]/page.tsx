import Link from "next/link";
import { notFound } from "next/navigation";
import { getDrama, getProgress, pingDb, browseDramas } from "@/lib/db";
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

  // "Up next" recommendations for the end-of-drama screen (same platform, with videos)
  let upNext: { id: string; title: string; poster_url: string | null }[] = [];
  try {
    const recs = await browseDramas({
      q: "",
      source: "",
      platform: drama.platform ?? "",
      page: 1,
      perPage: 7,
      onlyWithVideos: true,
    });
    upNext = recs
      .filter((r) => r.id !== drama.id)
      .slice(0, 6)
      .map((r) => ({ id: r.id, title: r.title, poster_url: r.poster_url ?? null }));
  } catch {
    upNext = [];
  }

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
        dramaTitle={drama.title}
        platform={drama.platform}
        episode={ep}
        totalEps={totalEps}
        videoUrl={videoUrl}
        dailymotionEmbed={dm ? `https://www.dailymotion.com/embed/video/${dm}` : null}
        resumeAt={resumeAt}
        upNext={upNext}
      />

      {!videoUrl && !dm && (
        <div className="glass rounded-xl p-8 text-center text-sm text-slate-400">
          No video available for this episode yet.
        </div>
      )}
    </div>
  );
}
