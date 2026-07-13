import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Solara — AI Video Editor",
  description: "A fast, private video editor for trimming, cropping, effects, and export.",
  openGraph: {
    title: "Solara — Your vision, edited in seconds.",
    description: "A fast, private video editor for trimming, cropping, effects, and export.",
    images: [{ url: "/og.png", width: 1730, height: 909, alt: "Solara AI video editor" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>;
}
