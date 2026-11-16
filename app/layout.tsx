import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import Chrome from "@/components/Chrome";
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
        <Chrome loggedIn={loggedIn}>{children}</Chrome>
      </body>
    </html>
  );
}
