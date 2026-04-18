import { createClient } from "@/lib/supabase/server";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import { getServerUser } from "@/lib/supabase/get-server-user";

/** Use in server actions and routes that must only run for dashboard owners. */
export async function requireAdminUser() {
  const user = await getServerUser();
  if (!user) {
    throw new Error("Sign in required.");
  }
  const supabase = await createClient();
  const role = await getProfileRoleForUser(user.id);
  if (role !== "admin") {
    throw new Error("Owner access only.");
  }
  return { user, supabase };
}
