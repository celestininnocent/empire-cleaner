import { createClient as createSupabaseJs } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Resolve `profiles.role` for a user id verified via `getUser()`.
 * Uses the service role when available so this is not blocked by RLS quirks
 * (anon + JWT reading own row can fail with some key/session setups).
 */
export async function getProfileRoleForUser(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && serviceKey) {
    const sb = createSupabaseJs(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await sb
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (data?.role === "admin") return "admin";

    // Fallback for owner grants by email when profile role wasn't synced correctly.
    const { data: authUser } = await sb.auth.admin.getUserById(userId);
    const email = authUser?.user?.email?.trim().toLowerCase();
    if (email) {
      const { data: applicantOwner } = await sb
        .from("applicants")
        .select("id")
        .eq("app_access_role", "admin")
        .in("status", ["onboarded", "hired"])
        .eq("email", email)
        .maybeSingle();
      if (applicantOwner?.id) return "admin";
    }
    return data?.role ?? null;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role ?? null;
}
