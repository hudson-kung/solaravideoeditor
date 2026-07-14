import type { Metadata } from "next";
import { SolaraRedirect } from "./SolaraRedirect";

export const metadata: Metadata = {
  title: "Solara — The World’s Best Video Editor",
  description: "Create brilliant videos with powerful editing tools, music, effects, timelines, and Solara AI.",
  openGraph: {
    title: "Solara — The World’s Best Video Editor",
    description: "Create brilliant videos with powerful editing tools, music, effects, timelines, and Solara AI.",
    url: "https://solaravideoeditor.vercel.app/solara",
    siteName: "Solara",
    images: [{url:"/og-solara-v5.png",width:1728,height:910,alt:"Solara — The world’s best video editor"}],
  },
  twitter: {card:"summary_large_image",title:"Solara — The World’s Best Video Editor",description:"Create brilliant videos with Solara.",images:["/og-solara-v5.png"]},
};

export default function SolaraPage(){return <SolaraRedirect/>}
