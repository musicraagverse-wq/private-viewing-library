"use client";

import { useState } from "react";
import Link from "next/link";

type Item = { name: string; count: number; href: string };

export default function BrowseTabs({
  genres,
  platforms,
  tropes,
}: {
  genres: Item[];
  platforms: Item[];
  tropes: Item[];
}) {
  const [tab, setTab] = useState<"genres" | "platforms" | "tropes">("genres");

  const tabs = [
    { id: "genres" as const, label: "🎭 Genres", items: genres, color: "pop" },
    { id: "platforms" as const, label: "📱 Platforms", items: platforms, color: "teal" },
    { id: "tropes" as const, label: "🔥 Tropes", items: tropes, color: "sunny" },
  ];

  const active = tabs.find((t) => t.id === tab)!;

  const colorClasses: Record<string, string> = {
    pop: "border-pop bg-pop/20 text-pop",
    teal: "border-teal bg-teal/20 text-teal",
    sunny: "border-sunny bg-sunny/20 text-sunny",
  };

  const hoverClasses: Record<string, string> = {
    pop: "hover:border-pop hover:text-pop",
    teal: "hover:border-teal hover:text-teal",
    sunny: "hover:border-sunny hover:text-sunny",
  };

  return (
    <section>
      {/* Tab headers */}
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border-2 px-6 py-2 font-display text-sm font-extrabold transition-all ${
              tab === t.id
                ? colorClasses[t.color]
                : "border-edge text-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex flex-wrap gap-2">
        {active.items.slice(0, 20).map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`rounded-full border-2 border-edge bg-denlight px-4 py-2 font-display text-sm font-bold text-cream ${hoverClasses[active.color]}`}
          >
            {item.name} <span className="text-muted">({item.count.toLocaleString()})</span>
          </Link>
        ))}
        {active.items.length > 20 && (
          <Link
            href="/explore"
            className={`rounded-full border-2 px-4 py-2 font-display text-sm font-extrabold ${colorClasses[active.color]}`}
          >
            More →
          </Link>
        )}
      </div>
    </section>
  );
}
