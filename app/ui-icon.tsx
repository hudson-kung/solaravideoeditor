import type { ReactNode } from "react";

export type UiIconName="spark"|"media"|"audio"|"text"|"star"|"transition"|"captions"|"filter"|"adjust"|"template"|"ai"|"scissors"|"speed"|"mute"|"send"|"upload"|"play"|"previous"|"next"|"volume"|"volumeOff"|"fit"|"undo"|"redo";

const paths:Record<UiIconName,ReactNode>={
  spark:<path d="M12 2.7c.9 5.2 2.1 6.4 7.3 7.3-5.2.9-6.4 2.1-7.3 7.3-.9-5.2-2.1-6.4-7.3-7.3 5.2-.9 6.4-2.1 7.3-7.3Z"/>,
  media:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m8 14 2.8-3 2.4 2.4 2.1-2.1L19 15"/></>,
  audio:<><path d="M9 18V6l10-2v12"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
  text:<><path d="M5 5h14M12 5v14M8 19h8"/></>,
  star:<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>,
  transition:<><path d="M4 7h6l4 10h6M4 17h6l4-10h6"/><path d="m17 4 3 3-3 3m0 4 3 3-3 3"/></>,
  captions:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 11h4m2 0h4M7 15h3m2 0h5"/></>,
  filter:<><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none"/></>,
  adjust:<><path d="M4 6h10m4 0h2M4 12h3m4 0h9M4 18h8m4 0h4"/><circle cx="16" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="18" r="2"/></>,
  template:<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/></>,
  ai:<><path d="M12 3.5c.7 4.2 1.8 5.3 6 6-4.2.7-5.3 1.8-6 6-.7-4.2-1.8-5.3-6-6 4.2-.7 5.3-1.8 6-6Z"/><path d="M18.5 15.5c.3 1.8.8 2.3 2.5 2.5-1.7.3-2.2.8-2.5 2.5-.3-1.7-.8-2.2-2.5-2.5 1.7-.2 2.2-.7 2.5-2.5Z"/></>,
  scissors:<><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="m8.7 8.4 11.3 7M8.7 15.6 20 8.5"/></>,
  speed:<><path d="m7 7 5 5-5 5m5-10 5 5-5 5"/></>,
  mute:<><path d="M5 10v4h3l4 4V6L8 10H5Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
  send:<path d="m5 12 7-7 7 7m-7-7v14"/>,
  upload:<><path d="m12 16V4m-5 5 5-5 5 5"/><path d="M5 20h14"/></>,
  play:<path d="m9 6 9 6-9 6Z"/>,
  previous:<><path d="m14 7-5 5 5 5"/><path d="M9 12h10"/></>,
  next:<><path d="m10 7 5 5-5 5"/><path d="M5 12h10"/></>,
  volume:<><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9c1 1 1 5 0 6m3-9c3 3 3 9 0 12"/></>,
  volumeOff:<><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="m16 9 5 6m0-6-5 6"/></>,
  fit:<><path d="M8 4H4v4m12-4h4v4M8 20H4v-4m12 4h4v-4"/></>,
  undo:<path d="M9 7 4 12l5 5M5 12h8a6 6 0 0 1 6 6"/>,
  redo:<path d="m15 7 5 5-5 5m4-5h-8a6 6 0 0 0-6 6"/>
};

export function UiIcon({name,className=""}:{name:UiIconName;className?:string}){return <svg className={`ui-svg-icon ${className}`} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>}
