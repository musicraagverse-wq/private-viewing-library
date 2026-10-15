import Link from "next/link";
import type { ReactNode } from "react";

/** Horizontal scroll rail for drama rows. */
export default function Rail({
  title,
  href,
  linkLabel = "View all →",
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title}>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="shrink-0 text-sm font-semibold text-primary hover:underline">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
        {children}
      </div>
    </section>
  );
}
