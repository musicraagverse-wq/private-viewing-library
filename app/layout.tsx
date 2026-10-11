import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = {
  title: {
    default: "Short Drama",
    template: "%s · Short Drama",
  },
  description: "Watch short dramas & mini series.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-4 sm:px-6">
            <Link href="/" className="text-2xl font-extrabold tracking-tight">
              <span className="text-primary">Short</span>
              <span className="text-text">Drama</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-semibold text-muted">
              <Link href="/" className="hover:text-text">Home</Link>
              <Link href="/explore#genres" className="hover:text-text">Genres</Link>
              <Link href="/explore#platforms" className="hover:text-text">Platforms</Link>
              <Link href="/explore#tropes" className="hover:text-text">Tropes</Link>
              <Link href="/artists" className="hover:text-text">Artists</Link>
            </nav>
            <div className="ml-auto">
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
        <footer className="border-t border-border">
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted sm:px-6">
            Short Drama · Your personal collection
          </div>
        </footer>
      </body>
    </html>
  );
}
