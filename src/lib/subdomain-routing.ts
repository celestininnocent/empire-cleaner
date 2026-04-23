import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional split hosts for internal tools (set in production on Vercel + DNS).
 * When unset (e.g. local dev), all routes stay on the default host.
 */
export function applySubdomainRouting(request: NextRequest): NextResponse | null {
  const adminHost = process.env.NEXT_PUBLIC_ADMIN_HOST?.trim().toLowerCase();
  const crewHost = process.env.NEXT_PUBLIC_CREW_HOST?.trim().toLowerCase();
  if (!adminHost && !crewHost) return null;

  const rawHost = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!rawHost) return null;

  const url = request.nextUrl.clone();
  const path = url.pathname;

  /** Owner / admin app */
  if (adminHost && rawHost === adminHost) {
    if (path === "/" || path === "") {
      url.pathname = "/admin";
      return NextResponse.redirect(url, 308);
    }
    if (
      path.startsWith("/login") ||
      path.startsWith("/auth/") ||
      path.startsWith("/admin") ||
      path.startsWith("/_next") ||
      path.startsWith("/api/")
    ) {
      return null;
    }
    url.pathname = "/admin";
    return NextResponse.redirect(url, 308);
  }

  /** Crew field app (not the public demo). */
  if (crewHost && rawHost === crewHost) {
    if (path === "/" || path === "") {
      url.pathname = "/field";
      return NextResponse.redirect(url, 308);
    }
    if (
      path.startsWith("/login") ||
      path.startsWith("/auth/") ||
      path.startsWith("/field") ||
      path.startsWith("/_next") ||
      path.startsWith("/api/")
    ) {
      return null;
    }
    url.pathname = "/field";
    return NextResponse.redirect(url, 308);
  }

  /** Main marketing host — send deep links to the dedicated subdomains. */
  if (adminHost && rawHost !== adminHost && path.startsWith("/admin")) {
    const target = new URL(request.url);
    target.hostname = adminHost;
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  if (
    crewHost &&
    rawHost !== crewHost &&
    path.startsWith("/field") &&
    !path.startsWith("/field/demo")
  ) {
    const target = new URL(request.url);
    target.hostname = crewHost;
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  return null;
}
