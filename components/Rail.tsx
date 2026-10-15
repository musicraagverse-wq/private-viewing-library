"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

/** Horizontal scroll rail with arrow buttons and keyboard support. */
export default function Rail({
  title,
  subtitle,
  href,
  linkLabel = "View all →",
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section aria-label={title}>
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="hidden gap-1 md:flex" role="group" aria-label={`Scroll ${title}`}>
            <button
              onClick={() => scrollBy(-1)}
              aria-label={`Scroll ${title} left`}
              className="rounded-full border border-border bg-surface p-1.5 text-muted transition hover:border-primary hover:text-primary"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label={`Scroll ${title} right`}
              className="rounded-full border border-border bg-surface p-1.5 text-muted transition hover:border-primary hover:text-primary"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          {href && (
            <Link href={href} className="shrink-0 text-sm font-semibold text-primary hover:underline">
              {linkLabel}
            </Link>
          )}
        </div>
      </div>
      {subtitle && <p className="mb-4 text-sm text-muted">{subtitle}</p>}
      {!subtitle && <div className="mb-3" aria-hidden="true" />}
      <div
        ref={trackRef}
        tabIndex={0}
        role="region"
        aria-label={`${title} carousel. Use left and right arrow keys to scroll.`}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") scrollBy(1);
          else if (e.key === "ArrowLeft") scrollBy(-1);
        }}
        className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto scroll-smooth px-4 pb-2 focus-visible:outline-2 focus-visible:outline-primary sm:-mx-6 sm:px-6"
      >
        {children}
      </div>
    </section>
  );
}
