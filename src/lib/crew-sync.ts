import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { authUserMatchesEmail } from "@/lib/supabase/find-auth-user-by-email";
import { pickFallbackTeamId, resolveCrewTeamAssignment } from "@/lib/crew-team-matching";
import { approximateLatLngFromZip } from "@/lib/geo";

/**
 * If there are no crews yet, create one default row so owners never have to run SQL in Supabase.
 * Hiring approval and /field can always resolve a `team_id`.
 */
export async function ensureDefaultTeamExists(svc: SupabaseClient): Promise<void> {
  const { data: existing } = await svc.from("teams").select("id").limit(1).maybeSingle();
  if (existing?.id) return;

  const fallbackZip = (process.env.NEXT_PUBLIC_DEFAULT_SERVICE_ZIP ?? "97209").trim() || "97209";
  const { lat, lng } = approximateLatLngFromZip(fallbackZip);

  const { error } = await svc.from("teams").insert({
    name: "Main crew",
    zip_code: fallbackZip,
    base_lat: lat,
    base_lng: lng,
    is_available: true,
  });
  if (error) {
    console.error("[crew-sync] ensureDefaultTeamExists:", error.message);
  }
}

/**
 * Ensures `profiles.role` + `cleaners` row for a user who was approved for a crew in Hiring.
 * Used when linking from the admin action and as a safety net on /field (invite/DB trigger edge cases).
 */
export async function linkUserToCrewTeam(userId: string, teamId: string): Promise<void> {
  const svc = createServiceRoleClient();
  if (!svc) {
    throw new Error("Server misconfigured: missing Supabase URL or service role key.");
  }

  const { error: pErr } = await svc
    .from("profiles")
    .update({ role: "cleaner" })
    .eq("id", userId);
  if (pErr) {
    throw new Error(pErr.message);
  }

  const { error: cErr } = await svc.from("cleaners").upsert(
    { profile_id: userId, team_id: teamId },
    { onConflict: "profile_id" }
  );
  if (cErr) {
    throw new Error(cErr.message);
  }
}

/**
 * After `inviteUserByEmail`, the Auth user exists before `profiles` is always visible — retry briefly.
 */
export async function linkUserToCrewTeamWhenReady(
  userId: string,
  teamId: string,
  options?: { maxAttempts?: number; delayMs?: number }
): Promise<void> {
  const maxAttempts = options?.maxAttempts ?? 12;
  const delayMs = options?.delayMs ?? 150;
  const svc = createServiceRoleClient();
  if (!svc) {
    throw new Error("Server misconfigured: missing Supabase URL or service role key.");
  }

  for (let i = 0; i < maxAttempts; i++) {
    const { data: profile } = await svc
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      await linkUserToCrewTeam(userId, teamId);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  console.warn(
    "[crew-sync] Profile not found after invite; crew link will apply on next /field visit.",
    userId
  );
}

/**
 * ZIP for crew routing: applicant row first, else the signed-in user’s profile (same as Hiring).
 */
async function zipForApplicantAndProfile(
  svc: SupabaseClient,
  applicant: { zip_code: string | null; email: string },
  profileId: string
): Promise<string | null> {
  const fromApplicant = applicant.zip_code?.trim();
  if (fromApplicant) return fromApplicant;
  const { data: prof } = await svc
    .from("profiles")
    .select("zip_code")
    .eq("id", profileId)
    .maybeSingle();
  return prof?.zip_code?.trim() || null;
}

/**
 * If Hiring has this email at Onboarded/Hired, attach them to a crew and ensure `cleaners` exists.
 * Idempotent — safe on every crew app load.
 *
 * Handles the common case where the stage was set to Onboarded/Hired but “Grant crew app access”
 * was never clicked (`crew_team_id` still null): we resolve a team from ZIP or the first crew,
 * backfill `applicants.crew_team_id`, then link — same outcome as tapping Grant.
 *
 * Uses `auth.admin.getUserById` so we still match applicants when the session JWT has no
 * `email` (some OAuth / identity edge cases). Matches applicant emails the same way as Hiring
 * (`authUserMatchesEmail`), not only strict string equality.
 */
export async function syncCrewAccessForUser(userId: string): Promise<void> {
  const svc = createServiceRoleClient();
  if (!svc) return;

  const { data: authData, error: userErr } = await svc.auth.admin.getUserById(userId);
  if (userErr || !authData?.user) return;

  const user = authData.user;

  const { data: rows, error } = await svc
    .from("applicants")
    .select("id, email, crew_team_id, app_access_role, zip_code")
    .in("status", ["onboarded", "hired"]);

  if (error || !rows?.length) return;

  const match = rows.find(
    (r) => r.email?.trim() && authUserMatchesEmail(user, r.email.trim())
  );
  if (!match) return;

  if (match.app_access_role === "admin") return;

  await ensureDefaultTeamExists(svc);
  const { data: teamRows } = await svc.from("teams").select("id, zip_code, base_lat, base_lng");
  const teams = teamRows ?? [];
  if (teams.length === 0) return;

  const zipForMatch = await zipForApplicantAndProfile(svc, match, userId);
  const { teamId: resolved } = resolveCrewTeamAssignment({
    teams,
    manualPickTeamId: null,
    storedTeamId: match.crew_team_id,
    serviceZip: zipForMatch,
  });
  const teamId = resolved ?? null;

  if (!teamId) return;

  if (!match.crew_team_id || match.crew_team_id !== teamId) {
    const { error: upErr } = await svc
      .from("applicants")
      .update({ crew_team_id: teamId, app_access_role: "cleaner" })
      .eq("id", match.id);

    if (upErr) {
      console.error("[crew-sync] syncCrewAccessForUser: could not backfill crew_team_id:", upErr);
    }
  }

  const { data: existing } = await svc
    .from("cleaners")
    .select("id, team_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (existing?.team_id != null && existing.team_id === teamId) {
    return;
  }

  try {
    await linkUserToCrewTeam(userId, teamId);
  } catch (e) {
    console.error("[crew-sync] syncCrewAccessForUser failed to link cleaner row:", e);
  }
}

/**
 * Any signed-in user can open the crew app: if they still have no team, assign the default crew
 * (first team by id). Runs after `syncCrewAccessForUser` so Hiring approvals still win.
 * Skips users with `profiles.role = admin` so owners are not forced into a cleaner row.
 */
export async function ensureDefaultCrewAccessForFieldUser(userId: string): Promise<void> {
  const svc = createServiceRoleClient();
  if (!svc) return;

  const { data: profile } = await svc
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "admin") return;

  const { data: existing } = await svc
    .from("cleaners")
    .select("team_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (existing?.team_id) return;

  await ensureDefaultTeamExists(svc);
  const { data: teamRows } = await svc.from("teams").select("id, zip_code, base_lat, base_lng");
  const teams = teamRows ?? [];
  const { teamId: resolved } = resolveCrewTeamAssignment({
    teams,
    manualPickTeamId: null,
    storedTeamId: null,
    serviceZip: null,
  });
  const teamId = resolved ?? pickFallbackTeamId(teams);
  if (!teamId) return;

  try {
    await linkUserToCrewTeam(userId, teamId);
  } catch (e) {
    console.error("[crew-sync] ensureDefaultCrewAccessForFieldUser:", e);
  }
}
