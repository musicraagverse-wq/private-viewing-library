"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import LogoutButton, { LogoutMenuItem } from "./LogoutButton";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore#genres", label: "Genres" },
  { href: "/explore#platforms", label: "Platforms" },
  { href: "/explore#tropes", label: "Tropes" },
  { href: "/actors", label: "Actors" },
  { href: "/top-imdb", label: "Top IMDb" },
  { href: "/new", label: "New" },
];

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const base = href.split("#")[0];
  return pathname === base || pathname.startsWith(base + "/");
}

function SearchBox({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  return (
    <form
      role="search"
      className="relative"
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        router.push(q ? `/?q=${encodeURIComponent(q)}` : "/");
        onSubmit?.();
      }}
    >
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search dramas…"
        aria-label="Search dramas"
        className="w-44 rounded-full border border-border bg-surface py-1.5 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:w-56 focus:border-primary focus:outline-none transition-all lg:w-52"
      />
    </form>
  );
}

export default function SiteNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const utilLink = (href: string, label: string, Icon: (p: { className?: string }) => JSX.Element) => {
    const active = isActive(pathname, href);
    return (
      <Link
        href={href}
        aria-label={label}
        title={label}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          active ? "text-primary" : "text-muted hover:text-text"
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden xl:inline">{label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight" aria-label="Short Drama home">
          <img src="/logo.svg" alt="" className="h-8 w-8 rounded-lg" />
          <span className="hidden sm:inline">
            <span className="text-primary">Short</span>
            <span className="text-text">Drama</span>
          </span>
        </Link>

        {/* Desktop main nav */}
        <nav aria-label="Primary" className="hidden items-center gap-5 text-sm font-semibold lg:flex">
          {MAIN_LINKS.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href + l.label}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`relative py-1 transition-colors ${active ? "text-text" : "text-muted hover:text-text"}`}
              >
                {l.label}
                {active && <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        {/* Utility area */}
        <div className="ml-auto hidden items-center gap-1 md:flex">
          <SearchBox />
          {utilLink("/favourites", "Favourites", HeartIcon)}
          {utilLink("/watch-later", "Watch Later", BookmarkIcon)}
          {loggedIn ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primarydark">
              Login
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="ml-auto rounded-lg p-2 text-text hover:bg-surface md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <CloseIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav aria-label="Mobile" className="border-t border-border bg-bg px-4 pb-6 pt-2 md:hidden">
          <div className="py-2" onSubmit={() => setOpen(false)}>
            <SearchBox onSubmit={() => setOpen(false)} />
          </div>
          <ul className="divide-y divide-border">
            {MAIN_LINKS.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href + l.label}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`block py-3 text-base font-semibold ${active ? "text-primary" : "text-text"}`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/favourites" onClick={() => setOpen(false)} className={`flex items-center gap-3 py-3 text-base font-semibold ${isActive(pathname, "/favourites") ? "text-primary" : "text-text"}`}>
                <HeartIcon className="h-5 w-5" /> Favourites
              </Link>
            </li>
            <li>
              <Link href="/watch-later" onClick={() => setOpen(false)} className={`flex items-center gap-3 py-3 text-base font-semibold ${isActive(pathname, "/watch-later") ? "text-primary" : "text-text"}`}>
                <BookmarkIcon className="h-5 w-5" /> Watch Later
              </Link>
            </li>
            <li>
              {loggedIn ? (
                <LogoutMenuItem onDone={() => setOpen(false)} />
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className="block py-3 text-base font-semibold text-text">
                  Login
                </Link>
              )}
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
