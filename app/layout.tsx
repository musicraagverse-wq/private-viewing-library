import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "My Theater",
    template: "%s · My Theater",
  },
  description: "Private drama collection.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b border-rope/60 bg-screen/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
            <Link href="/" className="font-display text-xl tracking-wide">
              <span className="marquee-text">◈ MY THEATER</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted">
              <Link href="/" className="hover:text-marquee">Collection</Link>
              <Link href="/explore" className="hover:text-marquee">Explore</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
        <footer className="border-t border-rope/60 bg-lounge/40">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted sm:px-6">
            Private collection · for personal use only
          </div>
        </footer>
      </body>
    </html>
  );
}
