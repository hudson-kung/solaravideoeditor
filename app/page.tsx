"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";

type FilterName = "Clean" | "Cinema" | "Mono" | "Warm" | "Cool" | "Fade";
type ChatMessage = { role: "ai" | "user"; text: string };

const filters: { name: FilterName; css: string; color: string }[] = [
  { name: "Clean", css: "none", color: "linear-gradient(135deg,#b8d4eb,#38536c)" },
  { name: "Cinema", css: "contrast(1.18) saturate(.82) sepia(.18)", color: "linear-gradient(135deg,#e0b16d,#172b3e)" },
  { name: "Mono", css: "grayscale(1) contrast(1.1)", color: "linear-gradient(135deg,#ddd,#333)" },
  { name: "Warm", css: "sepia(.28) saturate(1.22) brightness(1.04)", color: "linear-gradient(135deg,#ffcc7c,#984b45)" },
  { name: "Cool", css: "hue-rotate(18deg) saturate(1.12) brightness(.96)", color: "linear-gradient(135deg,#87d9ff,#41407d)" },
  { name: "Fade", css: "contrast(.82) brightness(1.12) saturate(.72)", color: "linear-gradient(135deg,#e0d8c7,#818a87)" },
];

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return "00:00.0";
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toFixed(1).padStart(4, "0");
  return `${String(m).padStart(2, "0")}:${s}`;
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
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

  const activeFilter = useMemo(() => filters.find((f) => f.name === filter)!, [filter]);
  const timelineWidth = duration ? Math.max(0, ((trimEnd - trimStart) / duration) * 100) : 100;

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("editor") === "1") setStarted(true); }, []);

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

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= trimEnd - .05) v.currentTime = trimStart;
    if (v.paused) v.play(); else v.pause();
  };

  const seek = (value: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setCurrent(value);
  };

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
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation * Math.PI / 180);
      const scale = 100 / crop;
      ctx.scale(scale, scale);
      ctx.drawImage(v, -v.videoWidth / 2, -v.videoHeight / 2, v.videoWidth, v.videoHeight);
      ctx.restore();
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
    const form = new FormData(); form.set("video",sourceFile); form.set("name",fileName); form.set("duration",String(duration)); form.set("editState",JSON.stringify({trimStart,trimEnd,filter,speed,muted,crop,rotation}));
    try { const response=await fetch("/api/projects",{method:"POST",body:form}); if(response.status===401){setNotice("Sign in to save videos to your Solara account.");} else if(!response.ok){setNotice("Couldn’t save this project yet.");} else {setNotice("Project saved to your Solara library.");} } catch { setNotice("Couldn’t reach project storage."); } finally {setSaving(false);}
  };

  if (!started) return (
    <main className="landing">
      <nav className="landing-nav">
        <a className="solara-logo" href="#"><span>✦</span>SOLARA</a>
        <div className="nav-links"><a href="#features">Features</a><a href="#ai">AI Editor</a><a href="#how">How it works</a></div>
        <div className="nav-account"><a href="/signin?returnTo=/?editor=1">Sign in</a><button className="nav-cta" onClick={()=>setStarted(true)}>Start creating <span>↗</span></button></div>
      </nav>
      <section className="hero">
        <div className="sun-glow one"/><div className="sun-glow two"/>
        <div className="hero-copy">
          <div className="hero-tag"><i/> AI-POWERED VIDEO EDITOR</div>
          <h1>Your vision.<br/><em>Edited in seconds.</em></h1>
          <p>Turn raw clips into polished stories with an editor that understands what you want. Just describe it, and Solara makes it happen.</p>
          <div className="hero-actions"><button onClick={()=>setStarted(true)}>Get started — it’s free <span>→</span></button><a href="#how"><b>▶</b> See how it works</a></div>
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
    </main>
  );

  return (
    <main className="studio">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">✦</span><span>SOLARA</span><b>AI EDITOR</b></div>
        <div className="project-title"><span className="status-dot" />{fileName}<span className="saved">Saved locally</span></div>
        <div className="top-actions"><a className="account-link" href="/signin?returnTo=/?editor=1">◎ Account</a><button className="save-btn" onClick={saveProject} disabled={saving||!src}>{saving?"Saving…":"Save"}</button><button className="export" onClick={exportVideo} disabled={exporting || !src}>{exporting ? "Rendering…" : "Export"}<span>↗</span></button></div>
      </header>

      <section className="workspace">
        <aside className="toolrail" aria-label="Editor tools">
          {[['▣','Media'],['♫','Audio'],['T','Text'],['★','Stickers'],['✦','Effects'],['↝','Transitions'],['CC','Captions'],['◐','Filters'],['☷','Adjust'],['▤','Templates'],['AI','AI avatar']].map(([icon,label], i) => <button key={label} className={i === 0 ? "tool active" : "tool"} onClick={()=> ["Effects","Filters","Adjust"].includes(label) ? setPanel("adjust") : label==="AI avatar" ? setPanel("ai") : undefined}><span>{icon}</span>{label}</button>)}
        </aside>

        <section className="stage-column">
          <div className="stage-wrap">
            <div className={`stage ${dragging ? "dragging" : ""}`} onDragOver={(e) => {e.preventDefault(); setDragging(true)}} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
              {!src ? (
                <div className="upload-state">
                  <div className="upload-icon">↑</div>
                  <h1>Bring your story to life</h1>
                  <p>Drop a video here, or choose one from your device.</p>
                  <button className="choose" onClick={() => inputRef.current?.click()}>Choose video</button>
                  <small>MP4, MOV, WebM · Your files stay on this device</small>
                </div>
              ) : (
                <div className="video-shell" style={{width: `${crop}%`, transform: `rotate(${rotation}deg)`}}>
                  <video ref={videoRef} src={src} style={{filter: activeFilter.css}} muted={muted} onLoadedMetadata={(e) => { const d=e.currentTarget.duration; setDuration(d); setTrimStart(0); setTrimEnd(d); makeThumbnails(src,d); }} onTimeUpdate={(e) => { const t=e.currentTarget.currentTime; setCurrent(t); if (t >= trimEnd) {e.currentTarget.pause(); setPlaying(false)} }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
                </div>
              )}
              <input ref={inputRef} type="file" accept="video/*" hidden onChange={(e: ChangeEvent<HTMLInputElement>) => loadFile(e.target.files?.[0])} />
            </div>
            <div className="transport">
              <button onClick={() => seek(trimStart)} aria-label="Go to start">◀</button><button className="play" onClick={togglePlay} disabled={!src}>{playing ? "Ⅱ" : "▶"}</button><button onClick={() => seek(trimEnd)} aria-label="Go to end">▶</button>
              <span>{formatTime(current)} <i>/</i> {formatTime(duration)}</span>
              <button className={muted ? "muted" : ""} onClick={() => setMuted(!muted)}>{muted ? "🔇" : "🔊"}</button><button onClick={() => setNotice("Preview fits automatically in your workspace.")}>⌗</button>
            </div>
          </div>

          <div className="timeline-card">
            <div className="timeline-head"><strong>Timeline</strong><div><button onClick={() => setSpeed(speed === 2 ? .5 : speed + .5)}>{speed}×</button><button onClick={() => {setTrimStart(0);setTrimEnd(duration)}}>Reset trim</button></div></div>
            <div className="clip-meta"><span>{src ? fileName : "No clip loaded"}</span><b>{formatTime(current)} / {formatTime(duration)}</b></div>
            <div className="ruler">{Array.from({length:7},(_,i)=><span key={i}>{formatTime(duration*(i/6))}</span>)}</div>
            <div className="track">
              <div className="track-fill" style={{left: `${duration ? trimStart/duration*100 : 0}%`, width: `${timelineWidth}%`}} />
              <div className="filmstrip">{thumbnails.length ? thumbnails.map((thumb,i)=><img key={i} src={thumb} alt="" draggable="false" />) : <div className="empty-strip">{src ? "Generating video preview…" : "Upload a video to build your timeline"}</div>}</div>
              <div className="playhead" style={{left: `${duration ? current/duration*100 : 0}%`}}><span /></div>
            </div>
            <input className="scrubber" type="range" min={0} max={duration || 1} step="0.01" value={current} onChange={(e)=>seek(+e.target.value)} disabled={!src} aria-label="Video playhead" />
            <div className="trim-controls"><label>IN <input type="number" min={0} max={trimEnd} step=".1" value={trimStart.toFixed(1)} onChange={(e)=>{const n=Math.min(+e.target.value,trimEnd-.1);setTrimStart(Math.max(0,n));seek(Math.max(0,n))}} /></label><span>Selected clip <b>{formatTime(trimEnd-trimStart)}</b></span><label>OUT <input type="number" min={trimStart} max={duration} step=".1" value={trimEnd.toFixed(1)} onChange={(e)=>setTrimEnd(Math.min(duration,Math.max(trimStart+.1,+e.target.value)))} /></label></div>
          </div>
        </section>

        <aside className="inspector">
          <div className="inspector-tabs"><button className={panel==="ai"?"active":""} onClick={()=>setPanel("ai")}><span>✦</span> AI editor</button><button className={panel==="adjust"?"active":""} onClick={()=>setPanel("adjust")}>Adjust</button></div>
          {panel === "ai" ? <div className="ai-panel">
            <div className="ai-head"><div className="ai-orb">✦</div><div><strong>Solara AI</strong><span><i /> Ready to edit</span></div></div>
            <div className="chat">{messages.map((m,i)=><div key={i} className={`bubble ${m.role}`}>{m.text}</div>)}{thinking&&<div className="bubble ai typing"><i/><i/><i/></div>}</div>
            <div className="quick-title">TRY A QUICK EDIT</div>
            <div className="quick-edits"><button onClick={()=>askAI("Cut the first 3 seconds")}>✂ Cut first 3s</button><button onClick={()=>askAI("Make it cinematic")}>◐ Cinematic look</button><button onClick={()=>askAI("Speed it up")}>» Speed it up</button><button onClick={()=>askAI("Mute the audio")}>♩ Remove sound</button></div>
            <div className="composer"><textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} onKeyDown={(e)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();askAI()}}} placeholder="Ask AI to edit your video…"/><button onClick={()=>askAI()} disabled={!prompt.trim()}>↑</button><small>Enter to send · AI applies edits instantly</small></div>
          </div> : <div className="adjust-panel">
          <div className="panel-title"><div><span>✦</span><strong>Looks & effects</strong></div><button onClick={() => setFilter("Clean")}>Reset</button></div>
          <p className="eyebrow">FILTERS</p>
          <div className="filter-grid">{filters.map((item) => <button key={item.name} className={filter===item.name ? "filter selected" : "filter"} onClick={()=>setFilter(item.name)}><span style={{background:item.color}}>{filter===item.name && <i>✓</i>}</span>{item.name}</button>)}</div>
          <div className="divider" />
          <p className="eyebrow">FRAME</p>
          <label className="slider-label"><span>Crop / zoom <b>{crop}%</b></span><input type="range" min="72" max="100" value={crop} onChange={(e)=>setCrop(+e.target.value)} /></label>
          <div className="rotate-row"><button onClick={()=>setRotation((rotation+270)%360)}>↶ Rotate</button><button onClick={()=>setRotation((rotation+90)%360)}>Rotate ↷</button></div>
          <div className="divider" />
          <p className="eyebrow">PLAYBACK SPEED</p>
          <div className="speed-row">{[.5,1,1.5,2].map(s=><button className={speed===s?"selected":""} key={s} onClick={()=>{setSpeed(s);if(videoRef.current)videoRef.current.playbackRate=s}}>{s}×</button>)}</div>
          <div className="tip"><span>⌁</span><div><b>Non-destructive editing</b><p>Your original video is never changed. Experiment freely.</p></div></div>
          </div>}
        </aside>
      </section>
      {notice && <div className="toast" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    </main>
  );
}
