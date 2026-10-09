import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pvl_auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page and its API through
  if (pathname === "/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.LIBRARY_PASSWORD;

  // If no password is configured, allow all (local dev)
  if (!expected) {
    return NextResponse.next();
  }

  if (token === expected) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
