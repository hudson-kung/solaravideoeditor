export type SolaraAccount={name:string;email:string;passwordHash:string;createdAt:string};

export async function hashPassword(password:string){
  const bytes=new TextEncoder().encode(password);
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("");
}

export function getAccount():SolaraAccount|null{
  const raw=localStorage.getItem("solara-account");
  if(!raw)return null;
  try{return JSON.parse(raw) as SolaraAccount}catch{return null}
}

export function safeReturnTo(search:string,fallback="/dashboard"){
  const value=new URLSearchParams(search).get("returnTo");
  return value?.startsWith("/")&&!value.startsWith("//")?value:fallback;
}
