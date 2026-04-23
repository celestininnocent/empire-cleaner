import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import {
  ensureDefaultCrewAccessForFieldUser,
  syncCrewAccessForUser,
} from "@/lib/crew-sync";
import { FieldRouteHeader } from "@/components/field/field-route-header";
import { FieldCrewMessaging } from "@/components/field/field-crew-messaging";
import { FieldCrewRefreshBanner } from "@/components/field/field-crew-refresh-banner";
import { FieldShift } from "@/components/field/field-shift";
import { buttonVariants } from "@/components/ui/button";
import { computeRouteOrders } from "@/lib/route-optimization";
import { explainFieldCrewBlocked } from "@/lib/field-crew-blocked-copy";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type ClaimCrewResult = {
  ok?: boolean;
  linked?: boolean;
  reason?: string;
  error?: string;
  team_id?: string;
};

function parseClaimCrewResult(raw: unknown): ClaimCrewResult | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ClaimCrewResult;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as ClaimCrewResult;
  }
  return null;
}

type CleanerRow = {
  id: string;
  team_id: string | null;
  bio: string | null;
  photo_url: string | null;
  teams:
    | { base_lat: number | null; base_lng: number | null; zip_code: string | null }
    | { base_lat: number | null; base_lng: number | null; zip_code: string | null }[]
    | null;
};

async function loadCleanerRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("cleaners")
    .select("id, team_id, bio, photo_url, teams(base_lat, base_lng, zip_code)")
    .eq("profile_id", userId)
    .maybeSingle();
  return data as CleanerRow | null;
}

async function loadCleanerRowServiceRole(userId: string) {
  const svc = createServiceRoleClient();
  if (!svc) return null;
  const { data } = await svc
    .from("cleaners")
    .select("id, team_id, bio, photo_url, teams(base_lat, base_lng, zip_code)")
    .eq("profile_id", userId)
    .maybeSingle();
  return (data as CleanerRow | null) ?? null;
}

export default async function FieldPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <SiteShell>
        <p className="p-10 text-center text-muted-foreground">Configure Supabase.</p>
      </SiteShell>
    );
  }

  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/crew");
  }

  const supabase = await createClient();
  await syncCrewAccessForUser(user.id);
  await ensureDefaultCrewAccessForFieldUser(user.id);

  /** Works when `SUPABASE_SERVICE_ROLE_KEY` is missing on the server — links crew via DB RPC + JWT. */
  const { data: claimRaw, error: claimErr } = await supabase.rpc("claim_crew_access_for_me");
  if (claimErr) {
    const msg = claimErr.message ?? "";
    if (msg.includes("Could not find the function") || msg.includes("schema cache")) {
      console.warn(
        "[field] Database RPC missing: apply `supabase/migrations/010_claim_crew_access_rpc.sql` in Supabase → SQL Editor, then refresh /field."
      );
    } else {
      console.error("[field] claim_crew_access_for_me:", msg);
    }
  }

  const claim = parseClaimCrewResult(claimRaw);

  let cleaner = await loadCleanerRow(supabase, user.id);

  if (!cleaner?.team_id && claim?.ok === true && claim?.linked) {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      cleaner = await loadCleanerRow(supabase, user.id);
      if (cleaner?.team_id) break;
    }
  }

  if (!cleaner?.team_id && claim?.ok === true && claim?.linked) {
    const svcCleaner = await loadCleanerRowServiceRole(user.id);
    if (svcCleaner?.team_id) cleaner = svcCleaner;
  }

  const rawTeam = cleaner?.teams as
    | { base_lat: number | null; base_lng: number | null; zip_code: string | null }
    | { base_lat: number | null; base_lng: number | null; zip_code: string | null }[]
    | null
    | undefined;
  const teamRow = Array.isArray(rawTeam) ? rawTeam[0] : rawTeam;
  const teamBase =
    teamRow &&
    teamRow.base_lat != null &&
    teamRow.base_lng != null &&
    Number.isFinite(Number(teamRow.base_lat)) &&
    Number.isFinite(Number(teamRow.base_lng))
      ? {
          lat: Number(teamRow.base_lat),
          lng: Number(teamRow.base_lng),
        }
      : null;
  const teamZip = (teamRow?.zip_code ?? "").trim();

  const role = await getProfileRoleForUser(user.id);

  /** RPC returns 200 with `{ ok: false, reason }` in the body — not a PostgREST error. */
  const rpcSaysOwner =
    claim?.reason === "owner_admin" || claim?.reason === "applicant_owner";

  const isAdminViewer = role === "admin" || rpcSaysOwner;
  const { data: teams } = isAdminViewer
    ? await supabase.from("teams").select("id").order("id", { ascending: true }).limit(1)
    : { data: [] as { id: string }[] };
  const adminFallbackTeamId = teams?.[0]?.id ?? null;
  const crewTeamId =
    cleaner?.team_id ?? claim?.team_id ?? (isAdminViewer ? adminFallbackTeamId : null);
  const crewReady = Boolean(crewTeamId);
  const svc = createServiceRoleClient();

  if (!crewReady && !isAdminViewer) {
    if (claim?.ok === true && claim?.linked) {
      console.warn(
        "[field] claim_crew_access_for_me reported success but no cleaner row visible — check Supabase `cleaners` for profile_id =",
        user.id
      );
    } else if (claim && claim.ok === false) {
      console.warn("[field] claim_crew_access_for_me:", JSON.stringify(claim));
    }

    const explained = await explainFieldCrewBlocked({
      user,
      svc,
      claim,
      claimErr,
      cleaner: cleaner ? { team_id: cleaner.team_id ?? null } : null,
      profileRole: role,
      supportPhoneDisplay: siteConfig.supportPhoneDisplay,
    });

    return (
      <SiteShell>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">{explained.headline}</h1>
          <p className="mt-2 text-muted-foreground">{explained.body}</p>
          {explained.sub ? (
            <p className="mt-3 text-sm text-muted-foreground">{explained.sub}</p>
          ) : null}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login?next=/crew" className={cn(buttonVariants({ variant: "outline" }))}>
              Switch account
            </Link>
            <Link href="/" className={cn(buttonVariants({ className: "" }))}>
              Back home
            </Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { data: jobsRaw } = crewTeamId
    ? await supabase
        .from("jobs")
        .select("*")
        .eq("team_id", crewTeamId)
        .gte("scheduled_start", start.toISOString())
        .order("scheduled_start", { ascending: true })
        .limit(20)
    : { data: [] };

  const jobsList = jobsRaw ?? [];
  const routeOptimization = computeRouteOrders(jobsList, teamBase);
  const jobs =
    routeOptimization.optimizerAvailable && routeOptimization.defaultMode === "drive"
      ? routeOptimization.driveOrder
      : routeOptimization.appointmentOrder;

  const jobIds = jobs.map((j) => j.id);

  const { data: checklist } = crewReady && jobIds.length
    ? await supabase
        .from("job_checklist_items")
        .select("*")
        .in("job_id", jobIds)
    : { data: [] };

  const { data: payouts } =
    cleaner?.id != null
      ? await supabase
          .from("crew_payouts")
          .select(
            "id, time_entry_id, amount_cents, currency, status, paid_at, created_at, failure_reason"
          )
          .eq("cleaner_id", cleaner.id)
          .order("created_at", { ascending: false })
          .limit(8)
      : { data: [] };

  const { data: claimableJobs } =
    svc && crewTeamId
      ? await (() => {
          const q = svc
            .from("jobs")
            .select(
              "id, scheduled_start, address_line, city, state, zip, status, price_cents, bedrooms, bathrooms, square_footage"
            )
            .is("team_id", null)
            .eq("status", "scheduled")
            .gte("scheduled_start", start.toISOString())
            .order("scheduled_start", { ascending: true })
            .limit(12);
          return teamZip ? q.eq("zip", teamZip) : q;
        })()
      : { data: [] };

  return (
    <SiteShell>
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-10">
        <FieldRouteHeader
          headline={siteConfig.fieldHeadline}
          sub={siteConfig.fieldSubtitle}
          ctaHref="/field/demo"
          ctaLabel={siteConfig.fieldTryDemoLabel}
        />
        <FieldCrewRefreshBanner show={!crewReady} />
        <FieldShift
          cleanerId={cleaner?.id ?? null}
          jobs={jobs}
          claimableJobs={claimableJobs ?? []}
          checklist={checklist ?? []}
          payouts={payouts ?? []}
          teamBase={teamBase}
          crewAssignmentReady={crewReady}
          routeOptimization={
            routeOptimization.optimizerAvailable ? routeOptimization : undefined
          }
        />
        <div className="mt-8">
          <FieldCrewMessaging teamId={crewTeamId} />
        </div>
      </div>
    </SiteShell>
  );
}
