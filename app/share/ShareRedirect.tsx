"use client";

import { useEffect } from "react";

export function ShareRedirect(){
  useEffect(()=>{window.location.replace("/?share=solara-v5")},[]);
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#fffaf6",color:"#ff6719",fontFamily:"Arial,sans-serif",fontWeight:800}}>Opening Solara…</main>;
}
