import { notFound } from "next/navigation";
import { getDrama, getProgress, getWatchedEpisodes, browseDramas, hideDailymotion } from "@/lib/db";
import { canonicalizeTagList } from "@/lib/tag-mapping";
import { parseEpisodeUrls, parseEpisodeIds, dailymotionId } from "@/lib/types";
import { isResolvableSource } from "@/lib/stream";
import WatchClient from "./WatchClient";

export const dynamic = "force-dynamic";

export default async function WatchPage({ params }: { params: { id: string; ep: string } }) {
  const id = decodeURIComponent(params.id);
  const ep = Math.max(1, parseInt(params.ep, 10) || 1);

  let drama;
  try {
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
  const episodeIds = parseEpisodeIds(drama.episode_ids);
  // Resolvable rows (anydrama/dramadb with stored episodeIds): episode count
  // comes from the map (stored URLs are sparse/expired), and no stored URL is
  // passed down — the client resolves a fresh stream at watch time.
  const resolvable =
    isResolvableSource(drama.source) && Object.keys(episodeIds).length > 0;
  const totalEps = resolvable
    ? Object.keys(episodeIds).length
    : urls.length || drama.episode_count || 0;
  const videoUrl = resolvable ? null : ep >= 1 && ep <= urls.length ? urls[ep - 1] : null;
  const dm = !videoUrl ? dailymotionId(drama.alt_source) : null;
  // Hide Dailymotion toggle: when on, a Dailymotion-only drama shows a
  // "hidden by your filter" card instead of the redirect.
  const hideDm = hideDailymotion();
  const dmHidden = hideDm && !!dm;
  const progress = await getProgress(drama.id);
  const resumeAt = progress && progress.episode === ep ? progress.position_seconds : 0;
  const watchedEpisodes = await getWatchedEpisodes(drama.id);

  // Genres + tropes (same JSON columns the drama detail page reads),
  // canonicalized so the sidebar shows one clean label per concept.
  let genreList: string[] = [];
  try {
    if (drama.genres) genreList = JSON.parse(drama.genres);
  } catch {}
  let tropeList: string[] = [];
  try {
    if (drama.tropes) tropeList = JSON.parse(drama.tropes);
  } catch {}
  const resolvedWatchTags = [
    ...canonicalizeTagList(genreList, "genre"),
    ...canonicalizeTagList(tropeList, "trope"),
  ];
  const seenWatchTags = new Set<string>();
  const canonWatchTags = resolvedWatchTags.filter((t) => {
    if (seenWatchTags.has(t.canonical)) return false;
    seenWatchTags.add(t.canonical);
    return true;
  });
  const canonGenreNames = canonWatchTags
    .filter((t) => t.home === "genre")
    .map((t) => t.canonical);
  const canonTropeNames = canonWatchTags
    .filter((t) => t.home === "trope")
    .map((t) => t.canonical);

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
      hideDm,
    });
    upNext = recs
      .filter((r) => r.id !== drama.id)
      .slice(0, 6)
      .map((r) => ({ id: r.id, title: r.title, poster_url: r.poster_url ?? null }));
  } catch {
    upNext = [];
  }

  // Cast from the IMDb mapping (same JSON column the drama detail page reads)
  let cast: { actor: string; character: string }[] = [];
  try {
    if (drama.cast_data) cast = JSON.parse(drama.cast_data);
  } catch {}

  // More Like This: shared genres, tropes, cast (same scoring as the detail page)
  let related: { id: string; title: string; poster_url: string | null }[] = [];
  try {
    const { getRelatedDramas } = await import("@/lib/db");
    const actorNames = cast.map((c) => c.actor).filter(Boolean);
    const rel = await getRelatedDramas(drama.id, canonGenreNames, canonTropeNames, actorNames, 8, hideDm);
    related = rel.map((r) => ({ id: r.id, title: r.title, poster_url: r.poster_url ?? null }));
  } catch {
    related = [];
  }

  // Immersive watch view (see Chrome): full viewport height, no header —
  // the back arrow is overlaid on the video by WatchClient, like the reference.
  return (
    <>
      <WatchClient
        dramaId={drama.id}
        dramaTitle={drama.title}
        platform={drama.platform}
        posterUrl={drama.poster_url}
        episode={ep}
        totalEps={totalEps}
        videoUrl={videoUrl}
        dailymotionEmbed={dmHidden ? null : dm ? `https://www.dailymotion.com/embed/video/${dm}` : null}
        dmHidden={dmHidden}
        resumeAt={resumeAt}
        upNext={upNext}
        source={drama.source}
        episodeIds={resolvable ? episodeIds : null}
        genres={canonGenreNames}
        tropes={canonTropeNames}
        synopsis={drama.synopsis}
        cast={cast}
        related={related}
        watchedEpisodes={watchedEpisodes}
      />

      {!resolvable && !videoUrl && !dm && (
        <div className="glass rounded-xl p-8 text-center text-sm text-slate-400">
          No video available for this episode yet.
        </div>
      )}
    </>
  );
}
