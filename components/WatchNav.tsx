"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MAIN_LINKS, EXPLORE_LINKS, HeartIcon, BookmarkIcon } from "@/components/SiteNav";
import { LogoutMenuItem } from "@/components/LogoutButton";
import HideDmToggle from "@/components/HideDmToggle";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("#")[0];
  return pathname === base || pathname.startsWith(base + "/");
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Hover-reveal navigation for the immersive watch page.
 * The header is hidden while watching, so this drawer carries the same
 * links: it slides in when the cursor touches the left edge (or taps the
 * edge handle) and slides away when the cursor leaves it. The edge
 * trigger starts below the back arrow (top-16) so reaching for "back"
 * never opens the drawer by accident.
 */
export default function WatchNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Keep the off-screen drawer out of the tab order.
  useEffect(() => {
    const el = navRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = !open;
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 300);
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const go = () => setOpen(false);

  const linkCls = (href: string) =>
    `block rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive(pathname, href) ? "bg-surface text-primary" : "text-text hover:bg-surface"
    }`;

  // Tropes is already a main link, so the Explore section skips it.
  const exploreLinks = EXPLORE_LINKS.filter((l) => l.label !== "Tropes");

  return (
    <>
      {/* Edge trigger: a slim handle at the left edge (always visible, subtle)
          plus a wider invisible strip so the drawer opens as the cursor
          approaches the edge. Both hidden while the drawer is open. */}
      {!open && (
        <>
          <div
            aria-hidden="true"
            className="fixed bottom-0 left-0 top-16 z-40 w-3"
            onMouseEnter={() => setOpen(true)}
          />
          <button
            aria-label="Open navigation"
            onMouseEnter={() => setOpen(true)}
            onClick={() => setOpen(true)}
            className="fixed left-0 top-1/2 z-40 flex h-16 w-6 -translate-y-1/2 items-center justify-center rounded-r-lg bg-black/50 text-lg font-bold text-white/80 transition hover:bg-black/70"
          >
            ›
          </button>
        </>
      )}

      {/* Drawer */}
      <nav
        ref={navRef}
        aria-label="Watch navigation"
        aria-hidden={!open}
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
        className={`fixed left-0 top-0 z-50 flex h-dvh w-72 flex-col border-r border-border bg-bg shadow-2xl shadow-black/50 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link
            href="/"
            onClick={go}
            className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
            aria-label="Short Drama home"
          >
            <img src="/logo.svg" alt="" className="h-7 w-7 rounded-md" />
            <span>
              <span className="text-primary">Short</span>
              <span className="text-text">Drama</span>
            </span>
          </Link>
          <button
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-xl leading-none text-muted transition hover:bg-surface hover:text-text"
          >
            ×
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const query = q.trim();
              if (query) router.push(`/?q=${encodeURIComponent(query)}`);
              setOpen(false);
            }}
            className="relative px-1 pb-2"
          >
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dramas…"
              aria-label="Search dramas"
              className="w-full rounded-full border border-border bg-surface py-2 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </form>

          <div className="border-b border-border px-1 pb-3">
            <HideDmToggle />
          </div>

          {MAIN_LINKS.map((l) => (
            <Link key={l.href + l.label} href={l.href} onClick={go} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}

          <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-muted">Explore</p>
          {exploreLinks.map((l) => (
            <Link key={l.href + l.label} href={l.href} onClick={go} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}

          <p className="px-3 pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-muted">Library</p>
          <Link href="/favourites" onClick={go} className={linkCls("/favourites")}>
            <span className="flex items-center gap-2">
              <HeartIcon className="h-4 w-4" /> Favourites
            </span>
          </Link>
          <Link href="/watch-later" onClick={go} className={linkCls("/watch-later")}>
            <span className="flex items-center gap-2">
              <BookmarkIcon className="h-4 w-4" /> Watch Later
            </span>
          </Link>
        </div>

        <div className="border-t border-border px-4 py-2">
          {loggedIn ? (
            <LogoutMenuItem onDone={go} />
          ) : (
            <Link href="/login" onClick={go} className="block py-3 text-base font-semibold text-text">
              Login
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
