import { NextRequest, NextResponse } from "next/server";
import { getSavedIds, addSaved, removeSaved, type ListType } from "@/lib/db";

export const dynamic = "force-dynamic";

function validList(v: string | null): v is ListType {
  return v === "favourite" || v === "watchlater";
}

/** GET → { favourite: [ids], watchlater: [ids] } */
export async function GET() {
  try {
    return NextResponse.json(await getSavedIds());
  } catch {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
}

/** POST { drama_id, list, action: "add" | "remove" } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drama_id, list, action } = body;
    if (!drama_id || !validList(list) || (action !== "add" && action !== "remove")) {
      return NextResponse.json({ error: "drama_id, list (favourite|watchlater), action (add|remove) required" }, { status: 400 });
    }
    if (action === "add") await addSaved(String(drama_id), list);
    else await removeSaved(String(drama_id), list);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
}
