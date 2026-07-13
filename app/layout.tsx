import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://solaravideoeditor.vercel.app"),
  title: "Solara — The World’s Best Video Editor",
  description: "Create brilliant videos with powerful editing tools and Solara AI.",
  openGraph: {
    title: "Solara — The World’s Best Video Editor",
    description: "Create brilliant videos with powerful editing tools, music, effects, timelines, and Solara AI.",
    url: "https://solaravideoeditor.vercel.app",
    siteName: "Solara",
    images: [{ url: "/og-solara.png?v=2", width: 1728, height: 910, alt: "Solara — The world’s best video editor" }],
  },
  twitter: { card: "summary_large_image", title: "Solara — The World’s Best Video Editor", description: "Create brilliant videos with Solara.", images: ["/og-solara.png?v=2"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html>;
}
