import { platformLogo, platformInitial, formatPlatform } from "@/lib/platforms";

/** Platform logo (verified) or red initial badge, + formatted name. */
export default function PlatformMark({
  platform,
  className = "h-4 w-4",
}: {
  platform: string;
  className?: string;
}) {
  const logo = platformLogo(platform);
  return (
    <span className="inline-flex items-center gap-1.5">
      {logo ? (
        <img src={logo} alt="" className={`${className} rounded-sm`} loading="lazy" />
      ) : (
        <span
          className={`flex ${className} items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-white`}
        >
          {platformInitial(platform)}
        </span>
      )}
      <span>{formatPlatform(platform)}</span>
    </span>
  );
}
