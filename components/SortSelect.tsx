"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortSelect({ value }: { value: "newest" | "rating" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-xs font-semibold text-muted">
        Sort
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value === "rating") params.set("sort", "rating");
          else params.delete("sort");
          params.delete("page");
          router.push(`/?${params.toString()}`);
        }}
        className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text focus:border-primary focus:outline-none"
      >
        <option value="newest">Newest</option>
        <option value="rating">Top rated</option>
      </select>
    </div>
  );
}
