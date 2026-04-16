import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * Match Auth user to an applicant email. Primary `user.email` may be empty for some
 * providers; identities carry the login email.
 */
export function authUserMatchesEmail(user: User, normalizedEmail: string): boolean {
  const target = normalizedEmail.trim().toLowerCase();
  if (user.email?.trim().toLowerCase() === target) return true;
  for (const row of user.identities ?? []) {
    const raw = row.identity_data;
    if (raw && typeof raw === "object" && "email" in raw) {
      const em = (raw as { email?: unknown }).email;
      if (typeof em === "string" && em.trim().toLowerCase() === target) return true;
    }
  }
  return false;
}

/**
 * Looks up Auth users by email. Paginates through **all** list results.
 *
 * Important: GoTrue’s `lastPage` / Link header is often missing or wrong, so we must not
 * rely on `data.lastPage`. We keep requesting pages while each page is “full” (same length
 * as `perPage`), then stop on a short or empty page.
 */
export async function findAuthUserByEmail(
  sb: SupabaseClient,
  email: string
): Promise<User | null> {
  const target = email.trim().toLowerCase();
  if (!target) return null;

  const perPage = 1000;
  let page = 1;

  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const users = data.users ?? [];
    const found = users.find((u) => authUserMatchesEmail(u, target));
    if (found) return found;

    if (users.length === 0) break;
    if (users.length < perPage) break;

    page += 1;
    if (page > 500) break;
  }

  return null;
}
