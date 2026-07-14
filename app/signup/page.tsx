"use client";

import { FormEvent, useState } from "react";
import { hashPassword, normalizeUsername, safeReturnTo, SolaraAccount } from "../lib/local-auth";

export default function SignUpPage(){
  const [name,setName]=useState("");
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setError("");
    if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)){
      setError("Username must be 3–20 characters using letters, numbers, or underscores.");
      return;
    }
    if(password.length<8){setError("Password must be at least 8 characters.");return}
    if(password!==confirm){setError("Passwords do not match.");return}
    setLoading(true);
    const account:SolaraAccount={
      name:name.trim(),
      username:normalizeUsername(username),
      email:email.trim().toLowerCase(),
      passwordHash:await hashPassword(password),
      createdAt:new Date().toISOString()
    };
    localStorage.setItem("solara-account",JSON.stringify(account));
    localStorage.setItem("solara-profile",JSON.stringify({name:account.name,username:account.username,email:account.email,createdAt:account.createdAt}));
    location.href=safeReturnTo(location.search);
  };

  return <main className="signin-page">
    <a className="signin-logo" href="/"><span>✦</span>SOLARA</a>
    <section className="signin-card signup-card">
      <div className="signin-spark">✦</div>
      <p className="signin-kicker">JOIN SOLARA</p>
      <h1>Create your account</h1>
      <p className="signin-copy">Save projects and return to your creative workspace anytime.</p>
      <form onSubmit={submit}>
        <label>Your name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name"/></label>
        <label>Username<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Choose a username" autoComplete="username"/></label>
        <label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
        <label>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password"/></label>
        <label>Confirm password<input required minLength={8} type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password" autoComplete="new-password"/></label>
        {error&&<p className="signin-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading?"Creating account…":"Sign up"}<span>→</span></button>
      </form>
      <p className="auth-switch">Already have an account? <a href="/signin">Log in</a></p>
    </section>
    <p className="signin-note">Your password is stored as a one-way hash on this device.</p>
  </main>;
}
