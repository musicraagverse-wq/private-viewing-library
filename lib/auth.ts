// Auth helpers that work in BOTH the Node.js runtime (API routes) and the
// Edge runtime (middleware). Uses only the Web Crypto API — Node's `crypto`
// module (createHmac/timingSafeEqual) throws inside Edge middleware, which
// broke post-login verification with a 500 MIDDLEWARE_INVOCATION_FAILED.

const COOKIE_NAME = "pvl_auth";
const SESSION_VERSION = "v1";

const encoder = new TextEncoder();

async function hmacHex(key: string, data: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a signed session token. The raw library password never leaves the
 * server — the cookie only carries an HMAC proving the holder authenticated.
 * The password itself acts as the HMAC key, so no extra secret is needed.
 * Output format is identical to the old Node-crypto version: `v1.<hex>`.
 */
export async function makeSessionToken(password: string): Promise<string> {
  const sig = await hmacHex(password, `pvl-session-${SESSION_VERSION}`);
  return `${SESSION_VERSION}.${sig}`;
}

/** Constant-time string comparison without any Node-only dependency. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Verify a session token without ever seeing the raw password client-side. */
export async function verifySessionToken(
  token: string | undefined,
  password: string | undefined
): Promise<boolean> {
  if (!token || !password) return false;
  const expected = await makeSessionToken(password);
  return safeEqual(token, expected);
}

export { COOKIE_NAME };
