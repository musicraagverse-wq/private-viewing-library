import { NextRequest, NextResponse } from "next/server";
import { browseDramas } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Lightweight typeahead: top title matches for the search box. */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const dramas = await browseDramas({ q, source: "", platform: "", page: 1, perPage: 6, onlyWithVideos: false });
    return NextResponse.json({
      results: dramas.map((d) => ({
        id: d.id,
        title: d.title,
        poster_url: d.poster_url,
        episode_count: d.episode_count,
      })),
    });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
