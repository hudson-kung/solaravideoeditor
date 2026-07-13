import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";

const schema = `CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, name TEXT NOT NULL, file_name TEXT NOT NULL, object_key TEXT NOT NULL, duration_ms INTEGER NOT NULL DEFAULT 0, edit_state TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`;

function email(request: NextRequest) { return request.headers.get("oai-authenticated-user-email"); }

export async function GET(request: NextRequest) {
  const owner = email(request); if (!owner) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  await env.DB.prepare(schema).run();
  const result = await env.DB.prepare("SELECT id,name,file_name,duration_ms,edit_state,updated_at FROM projects WHERE owner_email=? ORDER BY updated_at DESC").bind(owner).all();
  return NextResponse.json({ projects: result.results });
}

export async function POST(request: NextRequest) {
  const owner = email(request); if (!owner) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const form = await request.formData(); const file = form.get("video");
  if (!(file instanceof File)) return NextResponse.json({ error: "Video required" }, { status: 400 });
  const id = crypto.randomUUID(); const key = `${encodeURIComponent(owner)}/${id}/${file.name}`; const now = new Date().toISOString();
  await env.VIDEOS.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
  await env.DB.prepare(schema).run();
  await env.DB.prepare("INSERT INTO projects (id,owner_email,name,file_name,object_key,duration_ms,edit_state,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)").bind(id,owner,String(form.get("name")||file.name),file.name,key,Math.round(Number(form.get("duration")||0)*1000),String(form.get("editState")||"{}"),now,now).run();
  return NextResponse.json({ id, saved: true });
}
