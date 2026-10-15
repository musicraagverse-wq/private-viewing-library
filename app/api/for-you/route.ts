import { NextRequest, NextResponse } from "next/server";
import { browseByTropes, getRelatedDramas, getDrama } from "@/lib/db";
import type { DramaRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface ForYouBody {
  /** Tropes the user picked in the taste quiz */
  taste?: string[];
  /** Drama ids the user rated up */
  liked?: string[];
  /** Drama ids the user rated down (excluded from results) */
  disliked?: string[];
}

interface ForYouRow {
  title: string;
  subtitle?: string;
  dramas: DramaRow[];
}

/** Parse genres/tropes/cast from a full drama row for related-title scoring. */
function parseList(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as ForYouBody;
    const taste = Array.from(new Set((body.taste ?? []).filter(Boolean))).slice(0, 6);
    const liked = Array.from(new Set((body.liked ?? []).filter(Boolean))).slice(0, 5);
    const disliked = new Set((body.disliked ?? []).filter(Boolean));

    const rows: ForYouRow[] = [];
    const seen = new Set<string>();

    const pushRow = (title: string, dramas: DramaRow[], subtitle?: string) => {
      const fresh = dramas.filter((d) => !seen.has(d.id) && !disliked.has(d.id)).slice(0, 12);
      fresh.forEach((d) => seen.add(d.id));
      if (fresh.length >= 4) rows.push({ title, dramas: fresh, subtitle });
    };

    // 1. Because you liked X — related titles per liked drama
    for (const id of liked.slice(0, 2)) {
      try {
        const drama = await getDrama(id);
        if (!drama) continue;
        let cast: { actor: string }[] = [];
        try {
          cast = JSON.parse((drama as any).cast_data ?? "[]");
        } catch {}
        const related = await getRelatedDramas(
          drama.id,
          parseList((drama as any).genres),
          parseList((drama as any).tropes),
          cast.map((c) => c.actor).filter(Boolean),
          12
        );
        if (related.length >= 4) {
          pushRow(`Because you liked ${drama.title}`, related);
        }
      } catch {}
      if (rows.length >= 3) break;
    }

    // 2. Because you love [trope] — top-rated dramas per taste trope
    for (const trope of taste.slice(0, 3)) {
      try {
        const { dramas } = await browseByTropes([trope], 1, 12, "rating");
        pushRow(`Because you love ${trope}`, dramas, "Top-rated picks in this trope");
      } catch {}
      if (rows.length >= 4) break;
    }

    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json({ rows: [] });
  }
}
