import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Drama Den",
    template: "%s · The Drama Den",
  },
  description: "Your personal drama collection.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="sticky top-0 z-40 border-b-2 border-edge/60 bg-den/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3 sm:px-6">
            <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
              🎭 <span className="pop-text">The Drama Den</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-bold text-muted">
              <Link href="/" className="hover:text-pop">Home</Link>
              <Link href="/explore" className="hover:text-pop">Explore</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
        <footer className="border-t-2 border-edge/60 bg-denlight/40">
          <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted sm:px-6">
            🎭 The Drama Den · your personal collection
          </div>
        </footer>
      </body>
    </html>
  );
}
