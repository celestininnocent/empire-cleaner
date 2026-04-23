import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { applyCrewPublicAlias, applySubdomainRouting } from "@/lib/subdomain-routing";

export async function middleware(request: NextRequest) {
  const crewAlias = applyCrewPublicAlias(request);
  if (crewAlias) return crewAlias;
  const routed = applySubdomainRouting(request);
  if (routed) return routed;
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
