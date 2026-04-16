import { NextResponse } from "next/server";

/**
 * Rejects cross-site POSTs to sensitive API routes when the browser sends Origin/Referer.
 * Does not block same-origin, server-to-server, or clients that omit the header (curl).
 */
export function assertBrowserSameOriginPost(request: Request): NextResponse | null {
  if (request.method !== "POST") return null;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  const expected =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : null);

  if (!expected) {
    return null;
  }

  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(expected).origin) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }
    return null;
  }

  if (referer) {
    try {
      if (new URL(referer).origin !== new URL(expected).origin) {
        return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
    }
  }

  return null;
}
