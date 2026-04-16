import { createClient } from "@/lib/supabase/server";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";

/** Use in server actions and routes that must only run for dashboard owners. */
export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Sign in required.");
  }
  const role = await getProfileRoleForUser(user.id);
  if (role !== "admin") {
    throw new Error("Owner access only.");
  }
  return { user, supabase };
}
