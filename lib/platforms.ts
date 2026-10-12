/** Platform display helpers: pretty names + app logos. */

/** Official domains used for logo lookup via favicon service.
 *  Only entries we are confident about — unknown platforms show text only. */
const PLATFORM_DOMAINS: Record<string, string> = {
  dramabox: "dramabox.com",
  reelshort: "reelshort.com",
  vibeshort: "vibeshort.org",
};

export function platformLogo(platform: string): string | null {
  const d = PLATFORM_DOMAINS[platform.toLowerCase()];
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=64` : null;
}

/** "stardust-tv" -> "Stardust Tv", "dramabox" -> "Dramabox" */
export function formatPlatform(platform: string): string {
  return platform
    .split(/[-_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}
