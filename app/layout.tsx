import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import { SavedListsProvider } from "@/components/SavedLists";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Short Drama",
    template: "%s · Short Drama",
  },
  description: "Discover, track, and watch short dramas & mini series — personalized recommendations, curated collections, and your watchlist.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    siteName: "Short Drama",
    title: "Short Drama",
    description: "Discover, track, and watch short dramas & mini series.",
    images: [{ url: "/logo.svg", alt: "Short Drama" }],
  },
  twitter: {
    card: "summary",
    title: "Short Drama",
    description: "Discover, track, and watch short dramas & mini series.",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get(COOKIE_NAME)?.value;
  const loggedIn = await verifySessionToken(token, process.env.LIBRARY_PASSWORD);

  return (
    <html lang="en" className={inter.variable}>
      <body>
        <SiteNav loggedIn={loggedIn} />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
          <SavedListsProvider>{children}</SavedListsProvider>
        </main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="flex items-center gap-2 text-base font-extrabold tracking-tight">
                  <img src="/logo.svg" alt="" className="h-6 w-6 rounded-md" />
                  <span><span className="text-primary">Short</span><span className="text-text">Drama</span></span>
                </p>
                <p className="mt-2 max-w-xs text-xs leading-relaxed text-muted">
                  Your personal collection of short dramas — discover, track, and watch the stories you love.
                </p>
              </div>
              <nav aria-label="Discover">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Discover</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/browse" className="text-text/80 hover:text-primary">All Dramas</Link></li>
                  <li><Link href="/top-imdb" className="text-text/80 hover:text-primary">Top Rated</Link></li>
                  <li><Link href="/new" className="text-text/80 hover:text-primary">New Arrivals</Link></li>
                  <li><Link href="/explore" className="text-text/80 hover:text-primary">Explore</Link></li>
                </ul>
              </nav>
              <nav aria-label="Browse">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Browse</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/explore#genres" className="text-text/80 hover:text-primary">Genres</Link></li>
                  <li><Link href="/explore#tropes" className="text-text/80 hover:text-primary">Tropes</Link></li>
                  <li><Link href="/explore#platforms" className="text-text/80 hover:text-primary">Platforms</Link></li>
                  <li><Link href="/actors" className="text-text/80 hover:text-primary">Actors</Link></li>
                </ul>
              </nav>
              <nav aria-label="Library">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">Library</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li><Link href="/favourites" className="text-text/80 hover:text-primary">Favourites</Link></li>
                  <li><Link href="/watch-later" className="text-text/80 hover:text-primary">Watch Later</Link></li>
                </ul>
              </nav>
            </div>
            <p className="mt-8 border-t border-border pt-6 text-center text-xs text-muted">
              Short Drama · Your personal collection
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
