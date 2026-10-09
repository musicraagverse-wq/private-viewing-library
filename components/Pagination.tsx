import Link from "next/link";

export default function Pagination({
  page,
  total,
  perPage,
  buildHref,
}: {
  page: number;
  total: number;
  perPage: number;
  buildHref: (p: number) => string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;

  const pages: (number | "…")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className="glass rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:text-fuchsia-300">
          ← Prev
        </Link>
      )}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-slate-500">…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              p === page
                ? "bg-fuchsia-600 font-bold text-white"
                : "glass text-slate-300 hover:text-fuchsia-300"
            }`}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className="glass rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:text-fuchsia-300">
          Next →
        </Link>
      )}
    </nav>
  );
}
