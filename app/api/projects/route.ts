import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Vercel-compatible boundary for optional cloud project storage. */
export async function GET() {
  return NextResponse.json({ projects: [], storage: "device" });
}

export async function POST() {
  return NextResponse.json(
    { error: "Cloud project storage is not configured. Export remains available on this device." },
    { status: 503 },
  );
}
