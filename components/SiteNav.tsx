"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import LogoutButton, { LogoutMenuItem } from "./LogoutButton";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/explore#tropes", label: "Tropes" },
  { href: "/explore#platforms", label: "Platforms" },
  { href: "/top-imdb", label: "Top IMDb" },
  { href: "/new", label: "New" },
];

const EXPLORE_LINKS = [
  { href: "/browse", label: "All Dramas", desc: "Filter the full catalog" },
  { href: "/explore#genres", label: "Genres", desc: "Romance, thriller, fantasy…" },
  { href: "/explore#tropes", label: "Tropes", desc: "Story patterns you love" },
  { href: "/#moods", label: "Moods", desc: "Watch by how you feel" },
  { href: "/actors", label: "Actors", desc: "Browse by performer" },
  { href: "/#collections", label: "Collections", desc: "Curated by our editors" },
];

/** Accessible Explore dropdown for desktop nav. */
function ExploreDropdown({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const active = EXPLORE_LINKS.some((l) => isActive(pathname, l.href));

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-1 py-1 transition-colors ${active ? "text-text" : "text-muted hover:text-text"}`}
      >
        Explore
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {active && <span className="absolute -bottom-[13px] left-0 right-0 h-0.5 rounded-full bg-primary" aria-hidden="true" />}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-64 pt-2" role="menu" aria-label="Explore">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/50">
            {EXPLORE_LINKS.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-3 transition-colors hover:bg-surface"
              >
                <span className="block text-sm font-semibold text-text">{l.label}</span>
                <span className="block text-xs text-muted">{l.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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

const RECENT_KEY = "sd_recent_searches_v1";

function getRecentSearches(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 5) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(q: string) {
  try {
    const prev = getRecentSearches().filter((x) => x.toLowerCase() !== q.toLowerCase());
    localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, 5)));
  } catch {}
}

interface Suggestion {
  id: string;
  title: string;
  poster_url: string | null;
  episode_count: number | null;
}

function SuggestionPoster({ url, title }: { url: string | null; title: string }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <span className="flex h-10 w-8 shrink-0 items-center justify-center rounded bg-border text-xs font-bold text-muted" aria-hidden="true">
        {title.charAt(0)}
      </span>
    );
  }
  return <img src={url} alt="" className="h-10 w-8 shrink-0 rounded object-cover" loading="lazy" onError={() => setBroken(true)} />;
}

function SearchBox({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(getRecentSearches());
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Debounced suggestions
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(Array.isArray(data.results) ? data.results : []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value]);

  const go = (q: string) => {
    const query = q.trim();
    if (query) addRecentSearch(query);
    setFocused(false);
    setSuggestions([]);
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
    onSubmit?.();
  };

  const showDropdown = focused && (suggestions.length > 0 || (value.trim().length < 2 && recent.length > 0));
  const showRecent = value.trim().length < 2 && recent.length > 0;

  return (
    <div ref={boxRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (highlight >= 0 && suggestions[highlight]) {
            router.push(`/drama/${encodeURIComponent(suggestions[highlight].id)}`);
            setFocused(false);
            onSubmit?.();
          } else {
            go(value);
          }
        }}
      >
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setHighlight(-1);
          }}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, -1));
            } else if (e.key === "Escape") {
              setFocused(false);
            }
          }}
          placeholder="Search dramas…"
          aria-label="Search dramas"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          role="combobox"
          aria-autocomplete="list"
          className="w-44 rounded-full border border-border bg-surface py-1.5 pl-9 pr-3 text-sm text-text placeholder:text-muted focus:w-56 focus:border-primary focus:outline-none transition-all lg:w-52"
        />
      </form>
      {showDropdown && (
        <div id="search-suggestions" role="listbox" className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/50">
          {showRecent ? (
            <>
              <p className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wider text-muted">Recent searches</p>
              {recent.map((r) => (
                <button
                  key={r}
                  role="option"
                  aria-selected="false"
                  onClick={() => go(r)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-text hover:bg-surface"
                >
                  <SearchIcon className="h-3.5 w-3.5 text-muted" />
                  {r}
                </button>
              ))}
            </>
          ) : (
            <>
              {suggestions.map((s, i) => (
                <button
                  key={s.id}
                  role="option"
                  aria-selected={highlight === i}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    router.push(`/drama/${encodeURIComponent(s.id)}`);
                    setFocused(false);
                    onSubmit?.();
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left transition ${highlight === i ? "bg-surface" : ""}`}
                >
                  <SuggestionPoster url={s.poster_url} title={s.title} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text">{s.title}</span>
                    {s.episode_count ? <span className="block text-xs text-muted">{s.episode_count} episodes</span> : null}
                  </span>
                </button>
              ))}
              <button
                onClick={() => go(value)}
                className="w-full border-t border-border px-4 py-2.5 text-left text-sm font-semibold text-primary hover:bg-surface"
              >
                See all results for “{value.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
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
          {MAIN_LINKS.slice(0, 1).map((l) => {
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
          <ExploreDropdown pathname={pathname} />
          {MAIN_LINKS.slice(1).map((l) => {
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
            <Link href="/login" className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-black hover:bg-primaryhover">
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
              <p className="pb-1 pt-4 text-xs font-bold uppercase tracking-wider text-muted">Explore</p>
              <div className="grid grid-cols-2 gap-2 pb-3">
                {EXPLORE_LINKS.map((l) => (
                  <Link
                    key={l.href + l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-semibold text-text"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </li>
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
