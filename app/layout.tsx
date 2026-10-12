import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";
import { SavedListsProvider } from "@/components/SavedLists";

export const metadata: Metadata = {
  title: {
    default: "Short Drama",
    template: "%s · Short Drama",
  },
  description: "Watch short dramas & mini series.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
              <img src="/logo.svg" alt="Short Drama logo" className="h-8 w-8 rounded-lg" />
              <span><span className="text-primary">Short</span><span className="text-text">Drama</span></span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold text-muted">
              <Link href="/" className="hover:text-text">Home</Link>
              <Link href="/explore#genres" className="hover:text-text">Genres</Link>
              <Link href="/explore#platforms" className="hover:text-text">Platforms</Link>
              <Link href="/explore#tropes" className="hover:text-text">Tropes</Link>
              <Link href="/artists" className="hover:text-text">Artists</Link>
              <Link href="/top-imdb" className="hover:text-text">Top IMDb</Link>
              <Link href="/new" className="hover:text-text">New</Link>
              <Link href="/favourites" className="hover:text-text">♥ Favourites</Link>
              <Link href="/watch-later" className="hover:text-text">🔖 Watch Later</Link>
            </nav>
            <div className="ml-auto">
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          <SavedListsProvider>{children}</SavedListsProvider>
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted sm:px-6">
            Short Drama · Your personal collection
          </div>
        </footer>
      </body>
    </html>
  );
}
