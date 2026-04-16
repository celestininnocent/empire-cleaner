import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncProfilePhoneFromUserMetadata } from "@/lib/profile-phone-sync";
import { sanitizeInternalPath } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeInternalPath(searchParams.get("next"), "/portal");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await syncProfilePhoneFromUserMetadata(supabase);
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
