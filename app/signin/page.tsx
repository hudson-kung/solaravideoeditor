"use client";

import { FormEvent, useEffect, useState } from "react";

export default function SignInPage() {
  const [name,setName]=useState(""); const [email,setEmail]=useState("");
  useEffect(()=>{ const saved=localStorage.getItem("solara-profile"); if(saved){try{const p=JSON.parse(saved);setName(p.name||"");setEmail(p.email||"")}catch{}} },[]);
  const submit=(e:FormEvent)=>{e.preventDefault();localStorage.setItem("solara-profile",JSON.stringify({name:name.trim(),email:email.trim(),createdAt:new Date().toISOString()}));location.href="/dashboard"};
  return <main className="signin-page"><a className="signin-logo" href="/"><span>✦</span>SOLARA</a><section className="signin-card"><div className="signin-spark">✦</div><p className="signin-kicker">WELCOME TO SOLARA</p><h1>Create your account</h1><p className="signin-copy">Save your editing profile and jump back into your creative workspace.</p><form onSubmit={submit}><label>Your name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Hudson" autoComplete="name"/></label><label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><button type="submit">Continue to Solara <span>→</span></button></form><small>By continuing, you agree to Solara’s Terms and Privacy Policy.</small></section><p className="signin-note">Your editing profile stays on this device.</p></main>
}
