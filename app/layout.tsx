import type { Metadata } from "next";
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
  description: "Watch short dramas & mini series.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo.svg" },
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
          <div className="mx-auto max-w-7xl px-4 py-8 text-center text-xs text-muted sm:px-6">
            Short Drama · Your personal collection
          </div>
        </footer>
      </body>
    </html>
  );
}
