"use client";

import { ChangeEvent, DragEvent, PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { getProject, putProject } from "./lib/project-store";
import { UiIcon, UiIconName } from "./ui-icon";

type FilterName = string;
type ChatMessage = { role: "ai" | "user"; text: string };
type OverlayKind="text"|"captions"|"effect";
type OverlayBox={x:number;y:number;scale:number};
type OverlayDrag={kind:"text"|"captions";mode:"move"|"resize";startX:number;startY:number;start:OverlayBox};

const filters: { name: FilterName; category:string; css: string; color: string; effect?:string }[] = [
  {name:"Clean",category:"Basic",css:"none",color:"linear-gradient(135deg,#b8d4eb,#38536c)"},
  {name:"Cinema",category:"Cinematic",css:"contrast(1.18) saturate(.82) sepia(.18)",color:"linear-gradient(135deg,#e0b16d,#172b3e)"},
  {name:"Vivid",category:"Basic",css:"contrast(1.12) saturate(1.45)",color:"linear-gradient(135deg,#ffcb4a,#ee3e67,#4a63ff)"},
  {name:"HDR",category:"Basic",css:"contrast(1.3) saturate(1.25) brightness(1.04)",color:"linear-gradient(135deg,#a9f1ff,#2855a7,#ffbc5b)"},
  {name:"Mono",category:"Mono",css:"grayscale(1) contrast(1.1)",color:"linear-gradient(135deg,#eee,#222)"},
  {name:"Noir",category:"Mono",css:"grayscale(1) contrast(1.55) brightness(.82)",color:"linear-gradient(135deg,#999,#050505)"},
  {name:"Silver",category:"Mono",css:"grayscale(1) contrast(.9) brightness(1.15)",color:"linear-gradient(135deg,#f8f8f8,#7c858c)"},
  {name:"Warm",category:"Color",css:"sepia(.28) saturate(1.22) brightness(1.04)",color:"linear-gradient(135deg,#ffcc7c,#984b45)"},
  {name:"Cool",category:"Color",css:"hue-rotate(18deg) saturate(1.12) brightness(.96)",color:"linear-gradient(135deg,#87d9ff,#41407d)"},
  {name:"Teal & Orange",category:"Cinematic",css:"sepia(.18) hue-rotate(335deg) saturate(1.35) contrast(1.15)",color:"linear-gradient(135deg,#1fc7c2,#ff7a2f)"},
  {name:"Blockbuster",category:"Cinematic",css:"contrast(1.28) saturate(1.18) brightness(.92)",color:"linear-gradient(135deg,#0e4772,#f5a13b)"},
  {name:"Epic",category:"Cinematic",css:"contrast(1.35) saturate(.9) brightness(.88)",color:"linear-gradient(135deg,#101a2e,#7b2d25,#e5b96e)"},
  {name:"Fade",category:"Retro",css:"contrast(.82) brightness(1.12) saturate(.72)",color:"linear-gradient(135deg,#e0d8c7,#818a87)"},
  {name:"Vintage",category:"Retro",css:"sepia(.42) contrast(.95) saturate(.78)",color:"linear-gradient(135deg,#e7c18c,#76533e)"},
  {name:"VHS",category:"Retro",css:"contrast(1.12) saturate(.72) hue-rotate(-8deg)",color:"linear-gradient(135deg,#ed4ed5,#38c9ef,#1c1d35)"},
  {name:"Polaroid",category:"Retro",css:"sepia(.16) contrast(.88) brightness(1.14) saturate(.88)",color:"linear-gradient(135deg,#fff0d6,#89a6a3)"},
  {name:"Film",category:"Retro",css:"sepia(.12) contrast(1.18) saturate(.86)",color:"linear-gradient(135deg,#d5a56a,#26373a)"},
  {name:"Dreamy",category:"Lens",css:"brightness(1.12) saturate(.88) contrast(.82)",color:"linear-gradient(135deg,#ffd8f1,#a9d8ff)"},
  {name:"Soft Glow",category:"Lens",css:"brightness(1.14) contrast(.86) saturate(1.08)",color:"linear-gradient(135deg,#fff4c8,#ff9fcf)"},
  {name:"Bloom",category:"Lens",css:"brightness(1.2) contrast(.9) saturate(1.25)",color:"radial-gradient(circle,#fff7b0,#de69ae,#452c77)"},
  {name:"Haze",category:"Lens",css:"brightness(1.15) contrast(.72) saturate(.8)",color:"linear-gradient(135deg,#ecf5f4,#8aa4ac)"},
  {name:"Blur",category:"Lens",css:"blur(3px)",color:"linear-gradient(135deg,#708da5,#b9ccdc)"},
  {name:"Fire",category:"Screen",css:"contrast(1.08) saturate(1.2)",color:"linear-gradient(0deg,#f12711,#f5af19,#27120c)",effect:"fire"},
  {name:"Camera Shake",category:"Motion",css:"contrast(1.04)",color:"repeating-linear-gradient(135deg,#20252a 0 8px,#ff6719 8px 11px)",effect:"shake"},
  {name:"Zoom Pulse",category:"Motion",css:"saturate(1.08)",color:"radial-gradient(circle,#ffb54a,#df3b75,#22264e)",effect:"zoom-pulse"},
  {name:"Flash",category:"Motion",css:"contrast(1.1)",color:"linear-gradient(135deg,#fff,#b9d8ff,#444)",effect:"flash"},
  {name:"Snow",category:"Screen",css:"brightness(1.05)",color:"radial-gradient(circle at 25% 20%,#fff 0 4%,transparent 5%),linear-gradient(135deg,#dff7ff,#5d7697)",effect:"snow"},
  {name:"Light Leak",category:"Screen",css:"brightness(1.06) saturate(1.12)",color:"radial-gradient(circle at 15% 90%,#ffdc79,#ee4c75 35%,#3d2c5d 72%)",effect:"light-leak"},
  {name:"Film Grain",category:"Screen",css:"sepia(.08) contrast(1.12) saturate(.9)",color:"repeating-radial-gradient(circle,#eee 0 1px,#555 1px 3px)",effect:"grain"},
  {name:"RGB Glitch",category:"Motion",css:"contrast(1.25) saturate(1.5)",color:"linear-gradient(90deg,#f03 0 32%,#0ff 32% 65%,#30145e 65%)",effect:"rgb-glitch"},
  {name:"Neon",category:"Party",css:"contrast(1.3) saturate(1.8) hue-rotate(8deg)",color:"linear-gradient(135deg,#00f5ff,#f000ff,#ffea00)"},
  {name:"Cyberpunk",category:"Party",css:"contrast(1.4) saturate(1.55) hue-rotate(285deg)",color:"linear-gradient(135deg,#00eaff,#6d00ff,#ff007a)"},
  {name:"Glitch",category:"Party",css:"contrast(1.45) saturate(1.7) hue-rotate(-20deg)",color:"linear-gradient(90deg,#ff1744 0 33%,#00e5ff 33% 66%,#281c4c 66%)"},
  {name:"RGB Shift",category:"Party",css:"contrast(1.22) saturate(1.65) hue-rotate(32deg)",color:"linear-gradient(90deg,#f33,#3f6,#36f)"},
  {name:"Sunset",category:"Nature",css:"sepia(.22) saturate(1.45) hue-rotate(-12deg) brightness(1.04)",color:"linear-gradient(135deg,#ffd05c,#f05a3e,#602a70)"},
  {name:"Golden Hour",category:"Nature",css:"sepia(.3) saturate(1.32) brightness(1.1)",color:"linear-gradient(135deg,#ffe59a,#e8873b)"},
  {name:"Forest",category:"Nature",css:"hue-rotate(48deg) saturate(1.12) brightness(.92)",color:"linear-gradient(135deg,#8abf67,#153e2f)"},
  {name:"Desert",category:"Nature",css:"sepia(.38) saturate(1.16) contrast(1.05)",color:"linear-gradient(135deg,#f0ca83,#9b563c)"},
  {name:"Arctic",category:"Nature",css:"hue-rotate(18deg) saturate(.7) brightness(1.12)",color:"linear-gradient(135deg,#e7fbff,#6ab5da)"},
  {name:"Twilight",category:"Night",css:"hue-rotate(235deg) saturate(1.18) brightness(.8)",color:"linear-gradient(135deg,#182955,#704d91,#df7f77)"},
  {name:"Moonlight",category:"Night",css:"grayscale(.35) sepia(.1) hue-rotate(165deg) brightness(.78)",color:"linear-gradient(135deg,#a8c6dc,#101d42)"},
  {name:"Night City",category:"Night",css:"contrast(1.3) saturate(1.35) brightness(.82)",color:"linear-gradient(135deg,#15375f,#8f2f8d,#f3a146)"},
  {name:"Rosy",category:"Color",css:"sepia(.15) hue-rotate(300deg) saturate(1.28) brightness(1.06)",color:"linear-gradient(135deg,#ffd0dc,#b45d88)"},
  {name:"Faded Blue",category:"Color",css:"hue-rotate(15deg) saturate(.7) contrast(.88) brightness(1.08)",color:"linear-gradient(135deg,#bcd6e4,#506f86)"},
  {name:"High Contrast",category:"Basic",css:"contrast(1.55) saturate(1.08)",color:"linear-gradient(135deg,#fff,#111)"},
  {name:"Pastel",category:"Color",css:"contrast(.8) saturate(.75) brightness(1.16)",color:"linear-gradient(135deg,#f8cfdf,#c8e6dd,#ddd0f3)"},
];
const effectCategories=["All",...Array.from(new Set(filters.map(item=>item.category)))];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "00:00.0";
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const musicRef = useRef<HTMLAudioElement>(null);
  const videoShellRef=useRef<HTMLDivElement>(null);
  const overlayDragRef=useRef<OverlayDrag|null>(null);
  const [src, setSrc] = useState("");
  const [fileName, setFileName] = useState("Untitled project");
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [filter, setFilter] = useState<FilterName>("Clean");
  const [speed, setSpeed] = useState(1);
  const [muted, setMuted] = useState(false);
  const [crop, setCrop] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notice, setNotice] = useState("");
  const [panel, setPanel] = useState<"ai" | "adjust">("ai");
  const [prompt, setPrompt] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Hey — I’m Solara AI. Upload a clip, then tell me how you want it edited." },
  ]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState("Media");
  const [overlayText, setOverlayText] = useState("");
  const [captions, setCaptions] = useState(false);
  const [selectedOverlay,setSelectedOverlay]=useState<OverlayKind|null>(null);
  const [textBox,setTextBox]=useState<OverlayBox>({x:50,y:25,scale:1});
  const [captionBox,setCaptionBox]=useState<OverlayBox>({x:50,y:84,scale:1});
  const [effectSearch,setEffectSearch]=useState("");
  const [effectCategory,setEffectCategory]=useState("All");
  const [editorTheme, setEditorTheme] = useState<"light"|"dark">("light");
  const [projectId, setProjectId] = useState("");
  const [cuts, setCuts] = useState<number[]>([]);
  const [cutHistory, setCutHistory] = useState<number[][]>([]);
  const [redoCuts, setRedoCuts] = useState<number[][]>([]);
  const [musicSrc, setMusicSrc] = useState("");
  const [musicName, setMusicName] = useState("");

  const activeFilter = useMemo(() => filters.find((f) => f.name === filter)||filters[0], [filter]);
  const visibleEffects=useMemo(()=>filters.filter(item=>(effectCategory==="All"||item.category===effectCategory)&&item.name.toLowerCase().includes(effectSearch.trim().toLowerCase())),[effectCategory,effectSearch]);
  const timelineWidth = duration ? Math.max(0, ((trimEnd - trimStart) / duration) * 100) : 100;
  const beginEditing = () => { if(localStorage.getItem("solara-profile"))setStarted(true); else location.href="/signup?returnTo=/?editor=1"; };

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  useEffect(() => () => { if (musicSrc) URL.revokeObjectURL(musicSrc); }, [musicSrc]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("editor") === "1") { if(localStorage.getItem("solara-profile"))setStarted(true); else location.href="/signup?returnTo=/?editor=1"; } }, []);
  useEffect(() => { const saved=localStorage.getItem("solara-theme"); if(saved==="dark"||saved==="light")setEditorTheme(saved); }, []);
  useEffect(()=>{const id=new URLSearchParams(location.search).get("project");if(!id)return;getProject(id).then(project=>{if(!project)return;const file=new File([project.video],project.fileName,{type:project.video.type});setProjectId(project.id);setSourceFile(file);setSrc(URL.createObjectURL(file));setFileName(project.name);const e=project.editState;const savedFilter=String(e.filter||"Clean");setFilter(filters.some(item=>item.name===savedFilter)?savedFilter:"Clean");setSpeed(Number(e.speed)||1);setMuted(Boolean(e.muted));setCrop(Number(e.crop)||100);setRotation(Number(e.rotation)||0);setTrimStart(Number(e.trimStart)||0);setTrimEnd(Number(e.trimEnd)||project.duration);setCuts(Array.isArray(e.cuts)?e.cuts as number[]:[]);setOverlayText(String(e.overlayText||""));setCaptions(Boolean(e.captions));if(e.textBox)setTextBox(e.textBox as OverlayBox);if(e.captionBox)setCaptionBox(e.captionBox as OverlayBox);setStarted(true)})},[]);

  const loadFile = (file?: File) => {
    if (!file || !file.type.startsWith("video/")) {
      setNotice("Choose a video file to get started.");
      return;
    }
    if (src) URL.revokeObjectURL(src);
    setSrc(URL.createObjectURL(file));
    setSourceFile(file);
    setFileName(file.name.replace(/\.[^.]+$/, ""));
    setNotice("");
    setPlaying(false);
    setThumbnails([]);
    setCuts([]);setCutHistory([]);setRedoCuts([]);
  };

  const makeThumbnails = async (videoSrc: string, videoDuration: number) => {
    const sampler = document.createElement("video");
    sampler.src = videoSrc; sampler.muted = true; sampler.preload = "auto";
    await new Promise<void>((resolve) => sampler.addEventListener("loadeddata", () => resolve(), { once: true }));
    const canvas = document.createElement("canvas");
    canvas.width = 180; canvas.height = 100;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const frames: string[] = [];
    for (let i = 0; i < 16; i++) {
      sampler.currentTime = Math.min(videoDuration - .01, (i / 16) * videoDuration);
      await new Promise<void>((resolve) => sampler.addEventListener("seeked", () => resolve(), { once: true }));
      ctx.drawImage(sampler, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL("image/jpeg", .72));
    }
    setThumbnails(frames);
    sampler.removeAttribute("src");
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files[0]);
  };
  const loadMusic = (file?:File) => {if(!file||!file.type.startsWith("audio/")){setNotice("Choose an audio file.");return}if(musicSrc)URL.revokeObjectURL(musicSrc);setMusicSrc(URL.createObjectURL(file));setMusicName(file.name);setNotice("Music added to this project.")};

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= trimEnd - .05) v.currentTime = trimStart;
    if (v.paused) {v.play();if(musicRef.current){musicRef.current.currentTime=Math.max(0,v.currentTime-trimStart);musicRef.current.play()}} else {v.pause();musicRef.current?.pause()}
  };

  const addCut = () => {
    if(!src){setNotice("Upload a video before adding a cut.");return}
    if(current<=trimStart+.05||current>=trimEnd-.05){setNotice("Move the playhead inside the clip to split it.");return}
    if(cuts.some(c=>Math.abs(c-current)<.08)){setNotice("There’s already a cut here.");return}
    setCutHistory(h=>[...h,cuts]);setRedoCuts([]);setCuts([...cuts,current].sort((a,b)=>a-b));setNotice(`Split added at ${formatTime(current)}.`);
  };
  const undoCut = () => {if(!cutHistory.length)return;const previous=cutHistory[cutHistory.length-1];setRedoCuts(r=>[cuts,...r]);setCuts(previous);setCutHistory(h=>h.slice(0,-1));};
  const redoCut = () => {if(!redoCuts.length)return;const next=redoCuts[0];setCutHistory(h=>[...h,cuts]);setCuts(next);setRedoCuts(r=>r.slice(1));};

  const seek = (value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setCurrent(value);
  };

  const startOverlayDrag=(e:ReactPointerEvent<HTMLElement>,kind:"text"|"captions",mode:"move"|"resize")=>{
    e.stopPropagation();setSelectedOverlay(kind);setActiveTool(kind==="text"?"Text":"Captions");
    overlayDragRef.current={kind,mode,startX:e.clientX,startY:e.clientY,start:kind==="text"?{...textBox}:{...captionBox}};
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveOverlay=(e:ReactPointerEvent<HTMLDivElement>)=>{
    const drag=overlayDragRef.current,shell=videoShellRef.current;if(!drag||!shell)return;
    const rect=shell.getBoundingClientRect(),dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
    const next=drag.mode==="move"?{...drag.start,x:Math.max(4,Math.min(96,drag.start.x+dx/rect.width*100)),y:Math.max(5,Math.min(95,drag.start.y+dy/rect.height*100))}:{...drag.start,scale:Math.max(.45,Math.min(3,drag.start.scale+(dx+dy)/180))};
    drag.kind==="text"?setTextBox(next):setCaptionBox(next);
  };
  const endOverlayDrag=()=>{overlayDragRef.current=null};

  const exportVideo = async () => {
    const v = videoRef.current;
    if (!v || !src || !("MediaRecorder" in window)) {
      setNotice("Upload a video before exporting.");
      return;
    }
    setExporting(true);
    setNotice("Rendering your edit… keep this tab open.");
    const canvas = document.createElement("canvas");
    const portrait = rotation % 180 !== 0;
    canvas.width = portrait ? v.videoHeight : v.videoWidth;
    canvas.height = portrait ? v.videoWidth : v.videoHeight;
    const ctx = canvas.getContext("2d")!;
    const stream = canvas.captureStream(30);
    const capture = (v as HTMLVideoElement & { captureStream?: () => MediaStream }).captureStream?.();
    if (capture && !muted) capture.getAudioTracks().forEach((track) => stream.addTrack(track));
    const musicCapture=(musicRef.current as (HTMLAudioElement & {captureStream?:()=>MediaStream})|null)?.captureStream?.();
    if(musicCapture)musicCapture.getAudioTracks().forEach(track=>stream.addTrack(track));
    const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm" });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      link.download = `${fileName}-edit.webm`;
      link.click();
      setExporting(false);
      setNotice("Export complete — your edited video is ready.");
    };
    v.currentTime = trimStart;
    v.playbackRate = speed;
    v.muted = muted;
    await v.play();
    recorder.start(200);
    const draw = () => {
      if (v.currentTime >= trimEnd || v.ended) {
        v.pause(); recorder.stop(); return;
      }
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = activeFilter.css;
      const effectTime=v.currentTime,shake=activeFilter.effect==="shake"?6:0;
      ctx.translate(canvas.width/2+(Math.sin(effectTime*47)*shake),canvas.height/2+(Math.cos(effectTime*39)*shake));
      ctx.rotate(rotation * Math.PI / 180);
      const pulse=activeFilter.effect==="zoom-pulse"?1.045+Math.sin(effectTime*6)*.045:1;
      const scale = 100 / crop*pulse;
      ctx.scale(scale, scale);
      ctx.drawImage(v, -v.videoWidth / 2, -v.videoHeight / 2, v.videoWidth, v.videoHeight);
      ctx.restore();
      ctx.save();ctx.filter="none";
      if(activeFilter.effect==="fire"){ctx.globalCompositeOperation="screen";for(let i=0;i<12;i++){const x=canvas.width*(i+.5)/12,y=canvas.height*(.91+.04*Math.sin(effectTime*8+i)),r=canvas.height*(.12+.035*Math.sin(effectTime*11+i*2));const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"#fff59dcc");g.addColorStop(.25,"#ffb300cc");g.addColorStop(.62,"#ff3d00aa");g.addColorStop(1,"#ff000000");ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2)}}
      if(activeFilter.effect==="flash"){const flash=Math.max(0,Math.sin(effectTime*7)-.86)*5;ctx.fillStyle=`rgba(255,255,255,${Math.min(.8,flash)})`;ctx.fillRect(0,0,canvas.width,canvas.height)}
      if(activeFilter.effect==="snow"){ctx.fillStyle="#fff";for(let i=0;i<60;i++){const x=(i*97%100)/100*canvas.width,y=((i*53+effectTime*(25+i%8)*10)%(canvas.height+20))-10;ctx.globalAlpha=.45+(i%5)/10;ctx.beginPath();ctx.arc(x,y,1+(i%4),0,Math.PI*2);ctx.fill()}}
      if(activeFilter.effect==="light-leak"){const g=ctx.createRadialGradient(0,canvas.height,0,0,canvas.height,canvas.width*.7);g.addColorStop(0,"#ffd86bcc");g.addColorStop(.35,"#ff467755");g.addColorStop(1,"#0000");ctx.globalCompositeOperation="screen";ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height)}
      if(activeFilter.effect==="grain"){ctx.globalAlpha=.12;for(let i=0;i<850;i++){const shade=i%2?255:0;ctx.fillStyle=`rgb(${shade},${shade},${shade})`;ctx.fillRect(Math.random()*canvas.width,Math.random()*canvas.height,1.5,1.5)}}
      if(activeFilter.effect==="rgb-glitch"){ctx.globalCompositeOperation="screen";ctx.globalAlpha=.18;ctx.fillStyle="#f03";ctx.fillRect(0,canvas.height*.28,canvas.width,canvas.height*.07);ctx.fillStyle="#0ff";ctx.fillRect(0,canvas.height*.64,canvas.width,canvas.height*.05)}
      ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over";
      if(overlayText){ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`900 ${Math.round(canvas.width*.055*textBox.scale)}px Arial`;ctx.lineWidth=Math.max(3,canvas.width*.006);ctx.strokeStyle="#000b";ctx.strokeText(overlayText,canvas.width*textBox.x/100,canvas.height*textBox.y/100);ctx.fillStyle="#fff";ctx.fillText(overlayText,canvas.width*textBox.x/100,canvas.height*textBox.y/100)}
      if(captions){ctx.textAlign="center";ctx.textBaseline="middle";ctx.font=`700 ${Math.round(canvas.width*.025*captionBox.scale)}px Arial`;const label="This is your auto-caption preview",x=canvas.width*captionBox.x/100,y=canvas.height*captionBox.y/100,w=ctx.measureText(label).width+28,h=canvas.width*.045*captionBox.scale;ctx.fillStyle="#000c";ctx.fillRect(x-w/2,y-h/2,w,h);ctx.fillStyle="#fff";ctx.fillText(label,x,y)}ctx.restore();
      requestAnimationFrame(draw);
    };
    draw();
  };

  const askAI = (request?: string) => {
    const text = (request || prompt).trim();
    if (!text || thinking) return;
    setPrompt("");
    setMessages((m) => [...m, { role: "user", text }]);
    setThinking(true);
    window.setTimeout(() => {
      const q = text.toLowerCase();
      const actions: string[] = [];
      if (!src) {
        setMessages((m) => [...m, { role: "ai", text: "Upload a video first, then I can apply that edit directly." }]);
        setThinking(false); return;
      }
      const firstSeconds = q.match(/(?:trim|cut|remove|skip).{0,12}(?:first|start).{0,8}(\d+(?:\.\d+)?)\s*(?:sec|second|s\b)/);
      const lastSeconds = q.match(/(?:trim|cut|remove).{0,12}(?:last|end).{0,8}(\d+(?:\.\d+)?)\s*(?:sec|second|s\b)/);
      const endAt = q.match(/(?:end|stop|trim).{0,8}(?:at|to)\s*(\d+(?:\.\d+)?)\s*(?:sec|second|s\b)/);
      if (firstSeconds) { const n=Math.min(+firstSeconds[1],trimEnd-.1); setTrimStart(n); seek(n); actions.push(`cut the first ${n}s`); }
      if (lastSeconds) { const n=Math.max(trimStart+.1,duration-(+lastSeconds[1])); setTrimEnd(n); actions.push(`cut the last ${lastSeconds[1]}s`); }
      if (endAt) { const n=Math.min(duration,Math.max(trimStart+.1,+endAt[1])); setTrimEnd(n); actions.push(`set the ending to ${n}s`); }
      const looks: [string, FilterName][] = [["cinematic","Cinema"],["cinema","Cinema"],["black and white","Mono"],["monochrome","Mono"],["warm","Warm"],["cool","Cool"],["vintage","Fade"],["fade","Fade"],["clean","Clean"]];
      const look = looks.find(([key]) => q.includes(key));
      if (look) { setFilter(look[1]); actions.push(`applied the ${look[1]} look`); }
      const speedMatch = q.match(/(?:speed|make it|play).{0,10}(0\.5|1\.5|2)(?:x|×| times)?/);
      if (q.includes("slow motion") || q.includes("slow-mo")) { setSpeed(.5); if(videoRef.current)videoRef.current.playbackRate=.5; actions.push("slowed it to 0.5×"); }
      else if (speedMatch) { const n=+speedMatch[1]; setSpeed(n); if(videoRef.current)videoRef.current.playbackRate=n; actions.push(`set speed to ${n}×`); }
      else if (q.includes("speed up") || q.includes("faster")) { setSpeed(1.5); if(videoRef.current)videoRef.current.playbackRate=1.5; actions.push("sped it up to 1.5×"); }
      if (q.includes("mute") || q.includes("remove audio") || q.includes("no sound")) { setMuted(true); actions.push("muted the audio"); }
      if (q.includes("unmute")) { setMuted(false); actions.push("restored the audio"); }
      if (q.includes("rotate left")) { setRotation((r)=>(r+270)%360); actions.push("rotated it left"); }
      else if (q.includes("rotate")) { setRotation((r)=>(r+90)%360); actions.push("rotated it right"); }
      const cropMatch = q.match(/(?:crop|zoom).{0,8}(\d{2,3})\s*%/);
      if (cropMatch) { const n=Math.max(72,Math.min(100,+cropMatch[1])); setCrop(n); actions.push(`set the frame to ${n}%`); }
      const response = actions.length ? `Done — I ${actions.join(", ")}. You can fine-tune everything in Adjust.` : "I can apply trims, looks, speed, crop, rotation, and audio changes. Try “cut the first 3 seconds and make it cinematic.”";
      setMessages((m) => [...m, { role: "ai", text: response }]);
      setThinking(false);
    }, 650);
  };

  const saveProject = async () => {
    if (!sourceFile) { setNotice("Upload a video before saving your project."); return; }
    setSaving(true);
    window.setTimeout(()=>setSaving(false),350);
    try { const id=projectId||crypto.randomUUID();if(!projectId)setProjectId(id);await putProject({id,name:fileName,fileName:sourceFile.name,video:sourceFile,duration,thumbnail:thumbnails[0],editState:{trimStart,trimEnd,filter,speed,muted,crop,rotation,cuts,overlayText,captions,textBox,captionBox},updatedAt:new Date().toISOString()});setNotice("Project saved to your dashboard."); } catch { setNotice("Couldn’t save on this device."); } finally {setSaving(false);}
  };
  useEffect(()=>{if(!sourceFile||!duration)return;const timer=window.setTimeout(()=>{const id=projectId||crypto.randomUUID();if(!projectId)setProjectId(id);putProject({id,name:fileName,fileName:sourceFile.name,video:sourceFile,duration,thumbnail:thumbnails[0],editState:{trimStart,trimEnd,filter,speed,muted,crop,rotation,cuts,overlayText,captions,textBox,captionBox},updatedAt:new Date().toISOString()}).catch(()=>{})},200);return()=>clearTimeout(timer)},[sourceFile,duration,fileName,trimStart,trimEnd,filter,speed,muted,crop,rotation,cuts,overlayText,captions,textBox,captionBox,thumbnails,projectId]);

  if (!started) return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="solara-logo" href="#"><span>✦</span>SOLARA</a>
        <div className="nav-links"><a href="#features">Features</a><a href="#ai">AI Editor</a><a href="#how">How it works</a></div>
        <div className="nav-account"><a className="nav-login" href="/signin?returnTo=/dashboard">Log in</a><a className="nav-cta" href="/signup?returnTo=/dashboard">Sign up <span>→</span></a></div>
      </nav>
      <section className="hero">
        <div className="sun-glow one"/><div className="sun-glow two"/>
        <div className="hero-copy">
          <div className="hero-tag"><i/> THE FUTURE OF VIDEO CREATION</div>
          <h1><span>Solara.</span><br/><em>The world’s best<br/>video editor.</em></h1>
          <div className="hero-promise"><span><b>✦</b> Edit with AI</span><span><b>✂</b> Create with precision</span><span><b>↗</b> Share anywhere</span></div>
          <div className="hero-actions"><button onClick={beginEditing}>Get started — it’s free <span>→</span></button><a href="#how"><b>▶</b> See how it works</a></div>
          <div className="trust"><span>✓ No credit card</span><span>✓ Videos stay private</span><span>✓ Export in HD</span></div>
        </div>
        <div className="hero-demo" aria-label="Solara editor preview">
          <div className="demo-window">
            <div className="demo-top"><span className="mini-logo">✦ SOLARA</span><span>My summer film</span><button>Export ↗</button></div>
            <div className="demo-body"><div className="demo-tools">＋<span>✂</span><span>T</span><span>✦</span><span>♫</span></div><div className="demo-stage"><div className="demo-video"><div className="demo-sun"/><b>SUMMER<br/>MEMORIES</b><small>▶</small></div><div className="demo-timeline"><div className="clips"/><i/></div></div><div className="demo-ai"><strong>✦ Solara AI</strong><div>Make it feel warm and cinematic, then trim the slow start.</div><p>Done — I applied a warm look and cut the first 2.4s.</p><span>Ask AI to edit… <b>↑</b></span></div></div>
          </div>
          <div className="floating-card"><span>✦</span><div><b>Edit complete</b><small>3 changes applied instantly</small></div></div>
        </div>
      </section>
      <section className="proof" id="features"><p>EVERYTHING YOU NEED TO CREATE</p><div><article><span>✦</span><b>AI that actually edits</b><small>Describe the change. See it happen.</small></article><article><span>✂</span><b>Powerful timeline</b><small>Precise tools when you want control.</small></article><article><span>↗</span><b>Export in a click</b><small>Share-ready video, made on your device.</small></article></div></section>
      <section className="feature-showcase" id="ai"><div className="showcase-copy"><p className="section-label">MEET SOLARA AI</p><h2>Editing that speaks<br/>your language.</h2><p>Skip the tutorials and menus. Tell Solara what you want in plain English, and watch your timeline update instantly.</p><ul><li><span>✦</span><div><b>Natural language editing</b><small>“Cut the first three seconds and make it cinematic.”</small></div></li><li><span>CC</span><div><b>Instant captions</b><small>Generate clean, readable subtitles in one click.</small></div></li><li><span>◐</span><div><b>Smart color and pacing</b><small>Apply a polished look and perfect the rhythm.</small></div></li></ul></div><div className="ai-showcase-card"><div className="showcase-bar"><span>✦ SOLARA AI</span><i>Ready</i></div><div className="showcase-preview"><div className="preview-landscape"><span>BEFORE</span></div><div className="preview-landscape after"><span>AFTER</span><b>SUMMER<br/>FOREVER</b></div></div><div className="showcase-chat"><p>Make this warm and cinematic, trim the slow start, and add a title.</p><div><span>✦</span>Done — 3 edits applied to your timeline.<b>✓</b></div></div></div></section>
      <section className="feature-grid-section"><div className="section-heading"><p className="section-label">BUILT FOR THE WAY YOU CREATE</p><h2>Big editor energy.<br/>Zero learning curve.</h2><span>Everything you expect from a professional editor, designed to feel effortless from the first click.</span></div><div className="homepage-features"><article className="wide"><div><span>✂</span><h3>A timeline you already understand</h3><p>See every moment, drag through real video frames, trim precisely, and keep complete control.</p></div><div className="mini-timeline"><i/><i/><i/><i/><b/></div></article><article><span>◐</span><h3>Looks that feel cinematic</h3><p>Rich filters, color controls, crop, rotation, and speed—all adjustable.</p><div className="swatches"><i/><i/><i/><i/></div></article><article><span>☁</span><h3>Your projects, organized</h3><p>A personal dashboard keeps every story ready when inspiration strikes.</p><div className="project-stack"><i/><i/><i/></div></article><article><span>☀</span><h3>Light or dark. Your call.</h3><p>Switch your entire creative workspace to match the way you work.</p><div className="mode-pill"><i/> Light <b>Dark</b></div></article></div></section>
      <section className="how-section" id="how"><div className="section-heading"><p className="section-label">HOW IT WORKS</p><h2>From raw clip to ready<br/>to share in three steps.</h2></div><div className="steps"><article><b>01</b><span>↑</span><h3>Upload your video</h3><p>Bring in a clip from any device. It stays private while you edit.</p></article><article><b>02</b><span>✦</span><h3>Tell Solara your vision</h3><p>Ask AI to trim, style, caption, rotate, mute, or speed up your story.</p></article><article><b>03</b><span>↗</span><h3>Export and share</h3><p>Download your finished video and publish it anywhere.</p></article></div></section>
      <section className="final-cta"><div><span>✦</span><p>YOUR NEXT STORY STARTS HERE</p><h2>Make something<br/>brilliant today.</h2><button onClick={beginEditing}>Get started for free <b>→</b></button><small>No credit card required · Your videos stay private</small></div></section>
      <footer className="landing-footer"><a className="solara-logo" href="#"><span>✦</span>SOLARA</a><p>The world’s best video editor.</p><div><a href="#features">Features</a><a href="#ai">AI Editor</a><a href="#how">How it works</a></div></footer>
    </main>
  );

  return (
    <main className={`studio editor-${editorTheme}`}>
      <header className="topbar">
        <a className="brand" href="/dashboard"><span className="brand-mark"><UiIcon name="spark"/></span><span>SOLARA</span><b>AI EDITOR</b></a>
        <div className="project-title"><span className="status-dot" />{fileName}<span className="saved">Autosaved</span></div>
        <div className="top-actions"><a className="account-link" href="/dashboard">▦ Dashboard</a><button className="save-btn" onClick={saveProject} disabled={saving||!src}>{saving?"Saving…":"Save"}</button><button className="export" onClick={exportVideo} disabled={exporting || !src}>{exporting ? "Rendering…" : "Export"}<span>↗</span></button></div>
      </header>

      <section className="workspace">
        <aside className="toolrail" aria-label="Editor tools">
          {([['media','Media'],['audio','Audio'],['text','Text'],['spark','Effects'],['transition','Transitions'],['captions','Captions'],['filter','Filters'],['adjust','Adjust'],['template','Templates'],['ai','AI editor']] as [UiIconName,string][]).map(([icon,label]) => <button key={label} className={activeTool === label ? "tool active" : "tool"} onClick={()=>{setActiveTool(label);if(["Effects","Filters","Adjust"].includes(label))setPanel("adjust");if(label==="AI editor")setPanel("ai")}}><span><UiIcon name={icon}/></span>{label}</button>)}
        </aside>

        <section className="stage-column">
          <div className="stage-wrap">
            <div className={`stage ${dragging ? "dragging" : ""}`} onDragOver={(e) => {e.preventDefault(); setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              {!src ? (
                <div className="upload-state">
                  <div className="upload-icon"><UiIcon name="upload"/></div>
                  <h1>Bring your story to life</h1>
                  <p>Drop a video here, or choose one from your device.</p>
                  <button className="choose" onClick={() => inputRef.current?.click()}>Choose video</button>
                  <small>MP4, MOV, WebM · Your files stay on this device</small>
                </div>
              ) : (
                <div ref={videoShellRef} className={`video-shell fx-${activeFilter.effect||"none"}`} style={{width: `${crop}%`, transform: `rotate(${rotation}deg)`}} onPointerMove={moveOverlay} onPointerUp={endOverlayDrag} onPointerCancel={endOverlayDrag} onPointerDown={e=>{if(!(e.target as HTMLElement).closest(".movable-overlay,.screen-effect"))setSelectedOverlay(null)}}>
                  <video ref={videoRef} src={src} style={{filter: activeFilter.css}} muted={muted} onLoadedMetadata={(e) => { const d=e.currentTarget.duration; setDuration(d); if(!projectId){setTrimStart(0);setTrimEnd(d)} makeThumbnails(src,d); }} onTimeUpdate={(e) => { const t=e.currentTarget.currentTime; setCurrent(t); if (t >= trimEnd) {e.currentTarget.pause();musicRef.current?.pause();setPlaying(false)} }} onPlay={() => setPlaying(true)} onPause={() => {setPlaying(false);musicRef.current?.pause()}} />
                  {filter!=="Clean"&&<div className={`screen-effect screen-${activeFilter.effect||"filter"} ${selectedOverlay==="effect"?"selected":""}`} onPointerDown={e=>{e.stopPropagation();setSelectedOverlay("effect");setActiveTool("Effects");setPanel("adjust")}}/>}
                  {overlayText&&<div className={`video-text-overlay movable-overlay ${selectedOverlay==="text"?"selected":""}`} style={{left:`${textBox.x}%`,top:`${textBox.y}%`,transform:`translate(-50%,-50%) scale(${textBox.scale})`}} onPointerDown={e=>startOverlayDrag(e,"text","move")}><span>{overlayText}</span>{selectedOverlay==="text"&&<button className="overlay-resize-handle" aria-label="Resize text" onPointerDown={e=>startOverlayDrag(e,"text","resize")}/>}</div>}
                  {captions&&<div className={`video-caption movable-overlay ${selectedOverlay==="captions"?"selected":""}`} style={{left:`${captionBox.x}%`,top:`${captionBox.y}%`,bottom:"auto",transform:`translate(-50%,-50%) scale(${captionBox.scale})`}} onPointerDown={e=>startOverlayDrag(e,"captions","move")}><span>This is your auto-caption preview</span>{selectedOverlay==="captions"&&<button className="overlay-resize-handle" aria-label="Resize captions" onPointerDown={e=>startOverlayDrag(e,"captions","resize")}/>}</div>}
                </div>
              )}
              <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => loadFile(e.target.files?.[0])} />
              <input ref={musicInputRef} type="file" accept="audio/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => loadMusic(e.target.files?.[0])}/>{musicSrc&&<audio ref={musicRef} src={musicSrc} loop/>}
            </div>
            <div className="transport">
              <button onClick={() => seek(trimStart)} aria-label="Go to start"><UiIcon name="previous"/></button><button className="play" onClick={togglePlay} disabled={!src}>{playing ? "Ⅱ" : <UiIcon name="play"/>}</button><button onClick={() => seek(trimEnd)} aria-label="Go to end"><UiIcon name="next"/></button>
              <span>{formatTime(current)} <i>/</i> {formatTime(duration)}</span>
              <button className={muted ? "muted" : ""} onClick={() => setMuted(!muted)} aria-label={muted?"Unmute":"Mute"}><UiIcon name={muted?"volumeOff":"volume"}/></button><button onClick={() => setNotice("Preview fits automatically in your workspace.")} aria-label="Fit preview"><UiIcon name="fit"/></button>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-head"><strong>Timeline <small>{cuts.length?`${cuts.length+1} clips`:"1 clip"}</small></strong><div className="timeline-actions"><button className="history-btn" onClick={undoCut} disabled={!cutHistory.length} aria-label="Undo cut" title="Undo cut"><UiIcon name="undo"/></button><button className="history-btn" onClick={redoCut} disabled={!redoCuts.length} aria-label="Redo cut" title="Redo cut"><UiIcon name="redo"/></button><button className="split-btn" onClick={addCut} disabled={!src} aria-label="Split at playhead" title="Split at playhead"><UiIcon name="scissors"/></button><button onClick={() => setSpeed(speed === 2 ? .5 : speed + .5)}>{speed}×</button><button onClick={() => {setTrimStart(0);setTrimEnd(duration)}}>Reset trim</button></div></div>
            <div className="clip-meta"><span>{src ? fileName : "No clip loaded"}</span><b>{formatTime(current)} / {formatTime(duration)}</b></div>
            <div className="ruler">{Array.from({length:7},(_,i)=><span key={i}>{formatTime(duration*(i/6))}</span>)}</div>
            <div className="timeline-stack">
              <div className="overlay-lanes">
                <button className={`timeline-layer text-layer ${overlayText||captions?"has-content":"empty"} ${selectedOverlay==="text"||selectedOverlay==="captions"?"selected":""}`} style={{left:`${duration?trimStart/duration*100:0}%`,width:`${duration?timelineWidth:100}%`}} onClick={()=>{setActiveTool(overlayText?"Text":captions?"Captions":"Text");setSelectedOverlay(overlayText?"text":captions?"captions":null)}}><UiIcon name="text"/><span>{overlayText||(captions?"Auto captions":"＋ Add text")}</span>{captions&&<b>CC</b>}</button>
                <button className={`timeline-layer effect-layer ${filter!=="Clean"?"has-content":"empty"} ${selectedOverlay==="effect"?"selected":""}`} style={{left:`${duration?trimStart/duration*100:0}%`,width:`${duration?timelineWidth:100}%`}} onClick={()=>{setActiveTool("Effects");setPanel("adjust");setSelectedOverlay(filter!=="Clean"?"effect":null)}}><UiIcon name="spark"/><span>{filter!=="Clean"?`${filter} effect`:"＋ Add effect"}</span></button>
              </div>
              <div className="track">
                <div className="track-fill" style={{left: `${duration ? trimStart/duration*100 : 0}%`, width: `${timelineWidth}%`}} />
                <div className="filmstrip">{thumbnails.length ? thumbnails.map((thumb,i)=><img key={i} src={thumb} alt="" draggable="false" />) : <div className="empty-strip">{src ? "Generating video preview…" : "Upload a video to build your timeline"}</div>}</div>
                {cuts.map((cut,i)=><button key={cut} className="cut-marker" style={{left:`${duration?cut/duration*100:0}%`}} onClick={()=>seek(cut)} title={`Cut ${i+1} at ${formatTime(cut)}`}><span><UiIcon name="scissors"/></span></button>)}
                <input className="scrubber" type="range" min={0} max={duration || 1} step="0.01" value={current} onChange={(e)=>seek(+e.target.value)} disabled={!src} aria-label="Video playhead" />
              </div>
              <div className="stack-playhead" style={{left:`${duration?current/duration*100:0}%`}}><span/></div>
            </div>
            <div className="trim-controls"><label>IN <input type="number" min={0} max={trimEnd} step=".1" value={trimStart.toFixed(1)} onChange={(e)=>{const n=Math.min(+e.target.value,trimEnd-.1);setTrimStart(Math.max(0,n));seek(Math.max(0,n))}} /></label><span>Selected clip <b>{formatTime(trimEnd-trimStart)}</b></span><label>OUT <input type="number" min={trimStart} max={duration} step=".1" value={trimEnd.toFixed(1)} onChange={(e)=>setTrimEnd(Math.min(duration,Math.max(trimStart+.1,+e.target.value)))} /></label></div>
          </div>
        </section>

        <aside className="inspector">
          {!["Effects","Filters","Adjust","AI editor"].includes(activeTool) ? <div className="tool-panel">
            <div className="tool-panel-head"><div><span><UiIcon name={(activeTool==="Media"?"media":activeTool==="Audio"?"audio":activeTool==="Text"?"text":activeTool==="Transitions"?"transition":activeTool==="Captions"?"captions":"template") as UiIconName}/></span><strong>{activeTool}</strong></div></div>
            {activeTool==="Media"&&<><button className="primary-tool-action" onClick={()=>inputRef.current?.click()}><UiIcon name="upload"/> Import media</button><div className="media-library">{src?<div className="media-card"><div className="media-thumb">{thumbnails[0]?<img src={thumbnails[0]} alt="Video thumbnail"/>:<span><UiIcon name="play"/></span>}</div><b>{fileName}</b><small>{formatTime(duration)}</small></div>:<p>Your imported videos will appear here.</p>}</div></>}
            {activeTool==="Audio"&&<><p className="tool-help">Control clip sound or add your own music.</p><button className="setting-row" onClick={()=>setMuted(!muted)}><span>{muted?"Unmute clip":"Mute clip audio"}</span><b>{muted?"MUTED":"ON"}</b></button><button className="primary-tool-action music-upload" onClick={()=>musicInputRef.current?.click()}><UiIcon name="audio"/> Upload music</button>{musicSrc?<div className="music-track"><span><UiIcon name="audio"/></span><div><b>{musicName}</b><small>Plays with your video</small></div><button onClick={()=>{musicRef.current?.pause();URL.revokeObjectURL(musicSrc);setMusicSrc("");setMusicName("")}}>×</button></div>:<div className="audio-drop">MP3, WAV, M4A, OGG</div>}</>}
            {activeTool==="Text"&&<><p className="tool-help">Add a title, then drag it on the preview. Use the corner handle to resize.</p><input className="tool-input" value={overlayText} onChange={e=>{setOverlayText(e.target.value);setSelectedOverlay(e.target.value?"text":null)}} placeholder="Type your title…"/><div className="text-styles"><button onClick={()=>{setOverlayText("YOUR STORY");setSelectedOverlay("text")}}>BOLD</button><button onClick={()=>{setOverlayText("A moment to remember");setSelectedOverlay("text")}}>Elegant</button><button onClick={()=>{setOverlayText("");setSelectedOverlay(null)}}>Clear</button></div></>}
            {activeTool==="Transitions"&&<><p className="tool-help">Pick a transition style for your next split.</p><div className="transition-list">{["Dissolve","Fade to black","Slide left","Zoom","Flash"].map(t=><button key={t} onClick={()=>setNotice(`${t} transition selected. Add another clip to use it.`)}><i/>{t}<span>＋</span></button>)}</div></>}
            {activeTool==="Captions"&&<><p className="tool-help">Generate captions, then drag or resize them directly on the preview.</p><button className="primary-tool-action" onClick={()=>{setCaptions(!captions);setSelectedOverlay(!captions?"captions":null)}}>{captions?"Remove captions":"Generate auto captions"}</button><label className="caption-lang">Language<select><option>English (US)</option><option>Spanish</option><option>French</option></select></label></>}
            {activeTool==="Templates"&&<><p className="tool-help">Apply a ready-made editing style.</p><div className="template-list"><button onClick={()=>{setFilter("Warm");setSpeed(1)}}><i className="warm"/><b>Golden hour</b><small>Warm · Cinematic</small></button><button onClick={()=>{setFilter("Cool");setSpeed(1.5)}}><i className="cool"/><b>Fast vlog</b><small>Cool · Energetic</small></button><button onClick={()=>{setFilter("Mono");setSpeed(.5)}}><i className="mono"/><b>Film noir</b><small>Mono · Slow</small></button></div></>}
          </div> : <><div className="inspector-tabs"><button className={panel==="ai"?"active":""} onClick={()=>{setPanel("ai");setActiveTool("AI editor")}}><span><UiIcon name="ai"/></span> AI editor</button><button className={panel==="adjust"?"active":""} onClick={()=>{setPanel("adjust");setActiveTool("Adjust")}}>Adjust</button></div>
          {panel === "ai" ? <div className="ai-panel">
            <div className="ai-head"><div className="ai-orb"><UiIcon name="ai"/></div><div><strong>Solara AI</strong><span><i /> Ready to edit</span></div></div>
            <div className="chat">{messages.map((m,i)=><div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}{thinking&&<div className="bubble ai typing"><i/><i/><i/></div>}</div>
            <div className="quick-title">TRY A QUICK EDIT</div>
            <div className="quick-edits"><button onClick={()=>askAI("Cut the first 3 seconds")}><UiIcon name="scissors"/> Cut first 3s</button><button onClick={()=>askAI("Make it cinematic")}><UiIcon name="filter"/> Cinematic look</button><button onClick={()=>askAI("Speed it up")}><UiIcon name="speed"/> Speed it up</button><button onClick={()=>askAI("Mute the audio")}><UiIcon name="mute"/> Remove sound</button></div>
            <div className="composer"><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();askAI()}}} placeholder="Ask AI to edit your video…"/><button onClick={()=>askAI()} disabled={!prompt.trim()} aria-label="Send edit request"><UiIcon name="send"/></button><small>Enter to send · AI applies edits instantly</small></div>
          </div> : <div className="adjust-panel">
          <div className="panel-title"><div><span><UiIcon name="spark"/></span><strong>Video effects</strong></div><button onClick={()=>{setFilter("Clean");setSelectedOverlay(null)}}>Reset</button></div>
          <div className="effect-search"><UiIcon name="filter"/><input type="search" value={effectSearch} onChange={e=>setEffectSearch(e.target.value)} placeholder="Search effects" aria-label="Search effects"/>{effectSearch&&<button onClick={()=>setEffectSearch("")} aria-label="Clear effect search">×</button>}</div>
          <div className="effect-categories">{effectCategories.map(category=><button key={category} className={effectCategory===category?"active":""} onClick={()=>setEffectCategory(category)}>{category}</button>)}</div>
          <div className="filter-grid effect-library-grid">{visibleEffects.map((item) => <button key={item.name} className={filter===item.name ? "filter selected" : "filter"} onClick={()=>{setFilter(item.name);setSelectedOverlay(item.name==="Clean"?null:"effect")}}><span style={{background:item.color}}>{filter===item.name && <i>✓</i>}</span><b>{item.name}</b><small>{item.category}</small></button>)}</div>{!visibleEffects.length&&<div className="effect-empty">No effects found. Try another search.</div>}
          <div className="divider" />
          <p className="eyebrow">FRAME</p>
          <label className="slider-label"><span>Crop / zoom <b>{crop}%</b></span><input type="range" min="72" max="100" value={crop} onChange={(e)=>setCrop(+e.target.value)} /></label>
          <div className="rotate-row"><button onClick={()=>setRotation((rotation+270)%360)}>↶ Rotate</button><button onClick={()=>setRotation((rotation+90)%360)}>Rotate ↷</button></div>
          <div className="divider" />
          <p className="eyebrow">PLAYBACK SPEED</p>
          <div className="speed-row">{[.5,1,1.5,2].map(s=><button className={speed===s?"selected":""} key={s} onClick={()=>{setSpeed(s);if(videoRef.current)videoRef.current.playbackRate=s}}>{s}×</button>)}</div>
          <div className="tip"><span>⌁</span><div><b>Non-destructive editing</b><p>Your original video is never changed. Experiment freely.</p></div></div>
          </div>}</>}
        </aside>
      </section>
      {notice && <div className="toast" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    </main>
  );
}
