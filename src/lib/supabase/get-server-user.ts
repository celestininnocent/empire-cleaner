import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Deduplicates `auth.getUser()` within a single RSC request (e.g. `SiteShell` + page both need the user).
 * Middleware still refreshes the session separately on the edge.
 */
export const getServerUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
