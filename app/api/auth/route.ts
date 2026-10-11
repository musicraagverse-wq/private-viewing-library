import { NextResponse } from "next/server";
import { COOKIE_NAME, makeSessionToken } from "@/lib/auth";

export async function POST(req: Request) {
  const expected = process.env.LIBRARY_PASSWORD;
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const { password } = await req.json().catch(() => ({}));
  if (password !== expected) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  // Store a signed session token, never the raw password.
  res.cookies.set(COOKIE_NAME, await makeSessionToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
