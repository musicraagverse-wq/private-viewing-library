"use client";

import { useRouter, useSearchParams } from "next/navigation";

export type EpRange = "" | "short" | "medium" | "long";

/** Binge-length filter: short (<40 eps), medium (40–80), long (80+). */
export default function EpRangeSelect({ value }: { value: EpRange }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="eprange" className="text-xs font-semibold text-muted">
        Length
      </label>
      <select
        id="eprange"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          const v = e.target.value as EpRange;
          if (v) params.set("ep", v);
          else params.delete("ep");
          params.delete("page");
          router.push(`/?${params.toString()}`);
        }}
        className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text focus:border-primary focus:outline-none"
      >
        <option value="">Any length</option>
        <option value="short">Quick (&lt;40 eps)</option>
        <option value="medium">Medium (40–80)</option>
        <option value="long">Long binge (80+)</option>
      </select>
    </div>
  );
}
