import { NextRequest, NextResponse } from "next/server";
import { getProgress, saveProgress, deleteProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const dramaId = req.nextUrl.searchParams.get("drama_id");
  if (!dramaId) return NextResponse.json({ error: "drama_id required" }, { status: 400 });
  try {
    const p = await getProgress(dramaId);
    return NextResponse.json({ progress: p });
  } catch (e) {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { drama_id, episode, position_seconds } = body;
    if (!drama_id || typeof episode !== "number") {
      return NextResponse.json({ error: "drama_id and episode required" }, { status: 400 });
    }
    await saveProgress(String(drama_id), Math.max(1, Math.floor(episode)), Math.max(0, Math.floor(position_seconds ?? 0)));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { drama_id } = body;
    if (!drama_id) {
      return NextResponse.json({ error: "drama_id required" }, { status: 400 });
    }
    await deleteProgress(String(drama_id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "db unavailable" }, { status: 503 });
  }
}
