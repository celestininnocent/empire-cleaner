/** Assign nearest available 2-person team by zip + haversine distance. */

import { haversineMiles } from "@/lib/geo";
import { normalizeZipKey } from "@/lib/crew-team-matching";

export type TeamRow = {
  id: string;
  zip_code: string;
  base_lat: number;
  base_lng: number;
  is_available: boolean;
};

export type TeamDispatchCandidate = TeamRow & {
  /** Live centroid from crew pings/current location; falls back to team base. */
  live_lat?: number | null;
  live_lng?: number | null;
  /** Open workload count (scheduled/assigned/in_progress) to avoid overloading one team. */
  workload_count?: number;
};

export type JobCoords = {
  zip: string;
  lat: number | null;
  lng: number | null;
};

/**
 * Prefer same ZIP, then smallest great-circle distance from team base to job.
 * Falls back to first available team if job has no lat/lng (uses ZIP match only).
 */
export function pickNearestTeam(
  job: JobCoords,
  teams: TeamDispatchCandidate[]
): TeamDispatchCandidate | null {
  const available = teams.filter((t) => t.is_available);
  if (!available.length) return null;

  if (job.lat == null || job.lng == null) {
    return (
      [...available].sort(
        (a, b) => (a.workload_count ?? 0) - (b.workload_count ?? 0)
      )[0] ?? null
    );
  }

  const jobKey = normalizeZipKey(job.zip);
  let best: TeamDispatchCandidate | null = null;
  let bestScore = Infinity;
  for (const t of available) {
    const anchorLat =
      t.live_lat != null && Number.isFinite(t.live_lat) ? t.live_lat : t.base_lat;
    const anchorLng =
      t.live_lng != null && Number.isFinite(t.live_lng) ? t.live_lng : t.base_lng;
    const dist = haversineMiles(job.lat, job.lng, anchorLat, anchorLng);
    const tz = normalizeZipKey(t.zip_code);
    const zipBonus = jobKey != null && tz != null && jobKey === tz ? 1.2 : 0;
    const workloadPenalty = (t.workload_count ?? 0) * 1.75;
    const score = dist + workloadPenalty - zipBonus;
    if (score < bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}
