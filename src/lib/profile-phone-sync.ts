import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * If Auth `user_metadata.phone` exists but `profiles.phone` is empty, copy it over.
 * Covers email-confirmation flows and accounts created before `handle_new_user` stored phone.
 */
export async function syncProfilePhoneFromUserMetadata(
  supabase: SupabaseClient
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const raw = user.user_metadata?.phone;
  if (typeof raw !== "string" || !raw.trim()) return;

  const { data: prof } = await supabase
    .from("profiles")
    .select("phone")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.phone?.trim()) return;

  await supabase.from("profiles").update({ phone: raw.trim() }).eq("id", user.id);
}
