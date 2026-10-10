import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "pvl_auth";
const SESSION_VERSION = "v1";

/**
 * Create a signed session token. The raw library password never leaves the
 * server — the cookie only carries an HMAC proving the holder authenticated.
 * The password itself acts as the HMAC key, so no extra secret is needed.
 */
export function makeSessionToken(password: string): string {
  const sig = createHmac("sha256", password)
    .update(`pvl-session-${SESSION_VERSION}`)
    .digest("hex");
  return `${SESSION_VERSION}.${sig}`;
}

/** Verify a session token without ever seeing the raw password client-side. */
export function verifySessionToken(
  token: string | undefined,
  password: string | undefined
): boolean {
  if (!token || !password) return false;
  const expected = makeSessionToken(password);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export { COOKIE_NAME };
