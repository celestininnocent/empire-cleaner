import { createClient } from "@/lib/supabase/server";
import { notifyCrewMembersJobAssigned } from "@/lib/crew-job-sms";
import {
  pickNearestTeam,
  type TeamDispatchCandidate,
  type TeamRow,
} from "@/lib/dispatch";

/** Re-run nearest-team assignment for jobs that are still unassigned or scheduled. */
export async function assignUnassignedJobs(): Promise<{ updated: number }> {
  const supabase = await createClient();
  const { data: teamsRaw } = await supabase.from("teams").select("*");
  const teams = (teamsRaw ?? []) as TeamRow[];
  const { data: cleanersRaw } = await supabase
    .from("cleaners")
    .select("team_id, current_lat, current_lng");
  const { data: activeJobsRaw } = await supabase
    .from("jobs")
    .select("team_id, status")
    .in("status", ["scheduled", "assigned", "in_progress"]);

  const workloadByTeam = (activeJobsRaw ?? []).reduce(
    (acc, j) => {
      const tid = j.team_id as string | null;
      if (!tid) return acc;
      acc[tid] = (acc[tid] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const liveByTeam = (cleanersRaw ?? []).reduce(
    (acc, c) => {
      const tid = c.team_id as string | null;
      if (!tid || c.current_lat == null || c.current_lng == null) return acc;
      if (!acc[tid]) acc[tid] = { latSum: 0, lngSum: 0, n: 0 };
      acc[tid]!.latSum += Number(c.current_lat);
      acc[tid]!.lngSum += Number(c.current_lng);
      acc[tid]!.n += 1;
      return acc;
    },
    {} as Record<string, { latSum: number; lngSum: number; n: number }>
  );

  const teamCandidates: TeamDispatchCandidate[] = teams.map((t) => {
    const live = liveByTeam[t.id];
    return {
      ...t,
      live_lat: live ? live.latSum / live.n : null,
      live_lng: live ? live.lngSum / live.n : null,
      workload_count: workloadByTeam[t.id] ?? 0,
    };
  });

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, zip, lat, lng, status, team_id")
    .in("status", ["scheduled", "assigned"])
    .is("team_id", null);

  let updated = 0;
  for (const job of jobs ?? []) {
    const team = pickNearestTeam(
      {
        zip: job.zip,
        lat: job.lat,
        lng: job.lng,
      },
      teamCandidates
    );
    if (!team) continue;
    const { error } = await supabase
      .from("jobs")
      .update({ team_id: team.id, status: "assigned" })
      .eq("id", job.id);
    if (!error) {
      updated += 1;
      void notifyCrewMembersJobAssigned(job.id).catch((e) =>
        console.error("[dispatch] crew SMS:", e)
      );
    }
  }

  return { updated };
}
