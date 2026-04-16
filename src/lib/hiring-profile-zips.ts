import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/supabase/find-auth-user-by-email";

/**
 * For each email, if a user exists and `profiles.zip_code` is set, map email → ZIP.
 * Used on the hiring page so crew matching uses the ZIP they entered at signup when the
 * applicant row doesn’t have one.
 */
export async function buildProfileZipByEmailMap(
  svc: SupabaseClient,
  emails: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  const map: Record<string, string> = {};
  for (const email of unique) {
    const u = await findAuthUserByEmail(svc, email);
    if (!u) continue;
    const { data: prof } = await svc
      .from("profiles")
      .select("zip_code")
      .eq("id", u.id)
      .maybeSingle();
    const z = prof?.zip_code?.trim();
    if (z) map[email] = z;
  }
  return map;
}
