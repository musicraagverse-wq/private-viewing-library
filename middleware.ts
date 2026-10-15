import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // TEMPORARY (Harsh, 2026-10-15): password gate disabled for a while.
  // Re-enable by deleting this early return.
  return NextResponse.next();

  // Allow the login page and its API through
  if (pathname === "/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const expected = process.env.LIBRARY_PASSWORD;

    // If no password is configured, allow all (local dev)
    if (!expected) {
      return NextResponse.next();
    }

    if (await verifySessionToken(token, expected)) {
      return NextResponse.next();
    }
  } catch {
    // Auth verification must never 500 the request: fall through to login.
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg).*)"],
};
