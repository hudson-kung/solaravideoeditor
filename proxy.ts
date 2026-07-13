import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/" && !request.nextUrl.searchParams.has("share")) {
    const url = request.nextUrl.clone();
    url.searchParams.set("share", "solara-v4");
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: "/" };
