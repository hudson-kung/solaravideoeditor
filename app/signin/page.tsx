"use client";

import { FormEvent, useState } from "react";
import { accountUsername, getAccount, hashPassword, normalizeUsername, safeReturnTo } from "../lib/local-auth";

export default function SignInPage(){
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async(e:FormEvent)=>{
    e.preventDefault();
    setError("");
    setLoading(true);
    const account=getAccount();
    const passwordHash=await hashPassword(password);
    const matches=account
      && accountUsername(account)===normalizeUsername(username)
      && account.email.toLowerCase()===email.trim().toLowerCase()
      && account.passwordHash===passwordHash;
    if(!matches){
      setError("That username, email, or password is incorrect.");
      setLoading(false);
      return;
    }
    localStorage.setItem("solara-profile",JSON.stringify({name:account.name,username:accountUsername(account),email:account.email,createdAt:account.createdAt}));
    location.href=safeReturnTo(location.search);
  };

  return <main className="signin-page">
    <a className="signin-logo" href="/"><span>✦</span>SOLARA</a>
    <section className="signin-card">
      <div className="signin-spark">✦</div>
      <p className="signin-kicker">WELCOME BACK</p>
      <h1>Log in to Solara</h1>
      <p className="signin-copy">Open your dashboard and continue creating.</p>
      <form onSubmit={submit}>
        <label>Username<input required minLength={3} value={username} onChange={e=>setUsername(e.target.value)} placeholder="Your username" autoComplete="username"/></label>
        <label>Email address<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label>
        <label>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password"/></label>
        {error&&<p className="signin-error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>{loading?"Logging in…":"Log in"}<span>→</span></button>
      </form>
      <p className="auth-switch">New to Solara? <a href="/signup">Sign up</a></p>
    </section>
    <p className="signin-note">Your account stays private on this device.</p>
  </main>;
}
