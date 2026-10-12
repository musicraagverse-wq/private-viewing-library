/** Platform display helpers: pretty names + app logos. */

/** Official domains used for logo lookup via favicon service.
 *  Only entries we are confident about — unknown platforms show text only. */
const PLATFORM_DOMAINS: Record<string, string> = {
  "anyreel": "anyreel.app",
  "candyjar": "candyjar.com",
  "cubetv": "cubetv.cc",
  "dramabox": "dramabox.com",
  "dramanow": "reelforce.com",
  "dramashorts": "dramashorts.io",
  "dramatv": "drama.tv",
  "dramawave": "mydramawave.com",
  "flareflow": "flareflow.tv",
  "flextv": "flextv.cc",
  "flickreels": "flickreels.net",
  "freereels": "free-reels.com",
  "gammatime": "gammatime.ai",
  "goodshort": "goodshort.com",
  "idrama": "idrama.video",
  "joyreels": "joyreels.com",
  "kalos-tv": "kalostv.com",
  "leapreels": "virlixtv.com",
  "loopshort": "loopshort.com",
  "moboreels": "moboreels.com",
  "muvpix": "muvpix.com",
  "mydrama": "my-drama.com",
  "nebuluxe": "nebuluxetv.com",
  "netshort": "netshort.com",
  "novaflick": "hnytread.com",
  "petadrama": "petadrama.com",
  "pinedrama": "tiktok.com",
  "redrama": "redrama.ai",
  "reelshort": "reelshort.com",
  "sarostv": "saros-tv.com",
  "shortical": "shortical.com",
  "shortly": "gamegears.online",
  "shortmax": "shorttv.live",
  "shortwave": "shortswave.com",
  "sixthshort": "sixthshort.com",
  "sizzle-tv": "sizzle.tv",
  "soda-tv": "sodatvglobal.com",
  "stardust-tv": "stardusttv.cc",
  "starshort": "starshort.tv",
  "storyreel": "storyreel.life",
  "swoopreels": "swoopreels.com",
  "toonory": "toonory.com",
  "toonshort": "toonshort.com",
  "topreel": "topreel.ai",
  "torix": "torix.tv",
  "venix-tv": "venixtv.com",
  "vibeshort": "vibeshort.org",
  "vigloo": "vigloo.com",
  "wetv": "wetv.vip",
  "yourchannel": "yourchannel.ai",
  "ziptaletv": "ziptaletv.com",
};

/** Official logo files served locally (higher quality than favicon service).
 *  Verified from the platform's own site. */
const PLATFORM_LOCAL_LOGOS: Record<string, string> = {
  "dramapops": "/platform-logos/dramapops.png",
};

export function platformLogo(platform: string): string | null {
  const key = platform.toLowerCase();
  if (PLATFORM_LOCAL_LOGOS[key]) return PLATFORM_LOCAL_LOGOS[key];
  const d = PLATFORM_DOMAINS[key];
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=64` : null;
}

/** Platforms with real logos first, generic-badge ones after; count desc within each group. */
export function sortPlatforms<T extends { platform: string; c: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const la = platformLogo(a.platform) ? 0 : 1;
    const lb = platformLogo(b.platform) ? 0 : 1;
    return la - lb || b.c - a.c;
  });
}

/** First letter of the pretty name, for the fallback badge. */
export function platformInitial(platform: string): string {
  const name = formatPlatform(platform);
  return name.charAt(0).toUpperCase() || "?";
}

/** "stardust-tv" -> "Stardust Tv", "dramabox" -> "Dramabox" */
export function formatPlatform(platform: string): string {
  return platform
    .split(/[-_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
