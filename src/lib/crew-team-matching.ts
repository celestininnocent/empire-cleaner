/**
 * Crew assignment & dispatch message threads — one algorithm.
 *
 * ## Signup data
 * New accounts can send **ZIP** and **phone** in Auth `user_metadata` (signup form). The DB trigger
 * copies ZIP and phone onto **`profiles`**, so Hiring approval and crew matching can use the same
 * ZIP as **`teams.zip_code`**, and Twilio can text **`profiles.phone`** when jobs are assigned.
 *
 * ## Who lands on which crew?
 * A field user’s **cleaners.team_id** comes from the same rules everywhere (Hiring grant, `/field`
 * sync, RPC). That ID is also the **thread key** for `crew_dispatch_messages`: RLS only allows
 * posting/reading when `cleaners.team_id === crew_dispatch_messages.team_id`. So “matching crews”
 * for people and for **message threads** is the same value.
 *
 * ## Resolution order (`resolveCrewTeamAssignment`)
 * 1. **Manual pick** — valid `teams.id` chosen in the Hiring UI for this grant (highest priority).
 * 2. **Stored applicant** — `applicants.crew_team_id` already set (e.g. re-grant, partial save).
 * 3. **Single crew** — if only one row exists in `teams`, use it (no ambiguity).
 * 4. **ZIP match** — normalize applicant/profile ZIP and `teams.zip_code` to the same 5-digit key
 *    (US-style; `94102` matches `94102-1234`). If several crews share a ZIP, pick stable by `id`.
 * 5. **Fallback** — lexicographically smallest `teams.id` so behavior is deterministic.
 *
 * ## Jobs vs people
 * **Jobs** use `pickNearestTeam` in `dispatch.ts`: prefer same ZIP (string), then haversine distance
 * from job coords to `teams.base_lat/base_lng`, among `is_available` crews. That keeps routes
 * geographically sane while **people** use ZIP + explicit owner choices above.
 */

import { approximateLatLngFromZip, haversineMiles } from "@/lib/geo";

export type TeamZipRow = {
  id: string;
  zip_code: string;
  base_lat?: number | null;
  base_lng?: number | null;
};

export type CrewAssignmentReason =
  | "manual_pick"
  | "stored_applicant"
  | "single_crew"
  | "zip"
  | "zip_nearest"
  | "fallback"
  | "none";

/** US-style: compare first 5 digits so 94102 and 94102-1234 match. */
export function normalizeZipKey(z: string | null | undefined): string | null {
  if (!z?.trim()) return null;
  const digits = z.replace(/\D/g, "");
  if (digits.length >= 5) return digits.slice(0, 5);
  if (digits.length > 0) return digits;
  return null;
}

/**
 * Picks the crew whose route ZIP matches the service ZIP (stable if several rows share a ZIP).
 */
export function matchTeamIdByApplicantZip(
  applicantZip: string | null | undefined,
  teams: TeamZipRow[]
): string | undefined {
  const nz = normalizeZipKey(applicantZip);
  if (!nz || teams.length === 0) return undefined;
  const matches = teams.filter((t) => {
    const tz = normalizeZipKey(t.zip_code);
    return tz !== null && tz === nz;
  });
  if (matches.length === 0) return undefined;
  matches.sort((a, b) => a.id.localeCompare(b.id));
  return matches[0]!.id;
}

/**
 * If no exact ZIP team exists, pick the geographically nearest team base to the ZIP centroid.
 */
export function matchNearestTeamIdByApplicantZip(
  applicantZip: string | null | undefined,
  teams: TeamZipRow[]
): string | undefined {
  const nz = normalizeZipKey(applicantZip);
  if (!nz || teams.length === 0) return undefined;
  const target = approximateLatLngFromZip(nz);

  const candidates = teams.filter(
    (t) =>
      t.base_lat != null &&
      t.base_lng != null &&
      Number.isFinite(Number(t.base_lat)) &&
      Number.isFinite(Number(t.base_lng))
  );
  if (candidates.length === 0) return undefined;

  let bestId: string | undefined;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const t of candidates) {
    const dist = haversineMiles(target.lat, target.lng, Number(t.base_lat), Number(t.base_lng));
    if (dist < bestDist) {
      bestDist = dist;
      bestId = t.id;
    } else if (dist === bestDist && bestId && t.id.localeCompare(bestId) < 0) {
      bestId = t.id;
    }
  }

  return bestId;
}

/**
 * Deterministic default when ZIP doesn’t match or is missing — first team by `id`.
 */
export function pickFallbackTeamId(teams: TeamZipRow[]): string | undefined {
  if (teams.length === 0) return undefined;
  return [...teams].sort((a, b) => a.id.localeCompare(b.id))[0]!.id;
}

export type ResolveCrewTeamAssignmentInput = {
  teams: TeamZipRow[];
  /** Hiring UI: crew dropdown for this grant action */
  manualPickTeamId?: string | null;
  /** `applicants.crew_team_id` when already set */
  storedTeamId?: string | null;
  /** Applicant ZIP and/or profile ZIP (home / service area) */
  serviceZip?: string | null;
};

/**
 * Single entry point for assigning a **person** to a **crew** (and therefore to that crew’s
 * dispatch message thread). See module doc for precedence.
 */
export function resolveCrewTeamAssignment(
  input: ResolveCrewTeamAssignmentInput
): { teamId: string | undefined; reason: CrewAssignmentReason } {
  const teams = input.teams ?? [];
  if (teams.length === 0) {
    return { teamId: undefined, reason: "none" };
  }

  const manual = input.manualPickTeamId?.trim();
  if (manual && teams.some((t) => t.id === manual)) {
    return { teamId: manual, reason: "manual_pick" };
  }

  const stored = input.storedTeamId?.trim();
  if (stored && teams.some((t) => t.id === stored)) {
    return { teamId: stored, reason: "stored_applicant" };
  }

  if (teams.length === 1) {
    return { teamId: teams[0]!.id, reason: "single_crew" };
  }

  const byZip = matchTeamIdByApplicantZip(input.serviceZip, teams);
  if (byZip) {
    return { teamId: byZip, reason: "zip" };
  }

  const nearZip = matchNearestTeamIdByApplicantZip(input.serviceZip, teams);
  if (nearZip) {
    return { teamId: nearZip, reason: "zip_nearest" };
  }

  const fb = pickFallbackTeamId(teams);
  return { teamId: fb, reason: fb ? "fallback" : "none" };
}

/** Used by the Hiring pipeline client to preview / confirm which crew a row will get. */
export function resolveCrewTeamIdForGrant(input: {
  applicantId: string;
  manualPick: Record<string, string>;
  storedCrewTeamId: string | null | undefined;
  applicantZip: string | null | undefined;
  teams: TeamZipRow[];
}): string | undefined {
  const fromPick = input.manualPick[input.applicantId];
  const { teamId } = resolveCrewTeamAssignment({
    teams: input.teams,
    manualPickTeamId: fromPick ?? null,
    storedTeamId: input.storedCrewTeamId,
    serviceZip: input.applicantZip,
  });
  return teamId;
}
