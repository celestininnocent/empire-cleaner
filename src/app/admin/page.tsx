import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  Clock3,
  Download,
  MapPinned,
  MessageCircle,
  Route,
  Users,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPropertyTypeLabel } from "@/lib/property-types";
import { getServiceTierShortLabel } from "@/lib/service-tiers";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import { DispatchMap } from "@/components/admin/dispatch-map";
import { DispatchControls } from "@/components/admin/dispatch-controls";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <SiteShell>
        <p className="p-10 text-center text-muted-foreground">Configure Supabase env vars.</p>
      </SiteShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const role = await getProfileRoleForUser(user.id);

  if (role !== "admin") {
    return (
      <SiteShell>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">{siteConfig.adminRestrictedTitle}</h1>
          <p className="mt-2 text-muted-foreground">{siteConfig.adminRestrictedBody}</p>
          <Link href="/" className={cn(buttonVariants({ className: "mt-6" }))}>
            Back home
          </Link>
        </div>
      </SiteShell>
    );
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .order("scheduled_start", { ascending: true })
    .limit(50);

  const { data: teams } = await supabase.from("teams").select("*");

  const { data: cleaners } = await supabase
    .from("cleaners")
    .select("id, team_id, profile_id")
    .not("team_id", "is", null);

  const { data: crewMsgsRaw, error: crewMsgsError } = await supabase
    .from("crew_dispatch_messages")
    .select("id, body, created_at, team_id, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(15);

  type CrewMsg = {
    id: string;
    body: string;
    created_at: string;
    team_id: string;
    profiles: { full_name: string | null } | null;
  };

  const crewMsgs: CrewMsg[] = crewMsgsError
    ? []
    : (crewMsgsRaw ?? []).map((row) => {
        const r = row as {
          id: string;
          body: string;
          created_at: string;
          team_id: string;
          profiles: { full_name: string | null } | { full_name: string | null }[] | null;
        };
        const prof = Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles;
        return {
          id: r.id,
          body: r.body,
          created_at: r.created_at,
          team_id: r.team_id,
          profiles: prof,
        };
      });

  const teamIds = (teams ?? []).map((t) => t.id);
  const teamNameById = Object.fromEntries((teams ?? []).map((t) => [t.id, t.name]));
  const cleanerCountByTeam = (cleaners ?? []).reduce(
    (acc, c) => {
      if (!c.team_id) return acc;
      acc[c.team_id] = (acc[c.team_id] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const now = new Date();
  const nowIso = now.toISOString();
  const nowMs = now.getTime();
  const soonIso = new Date(nowMs + 2 * 60 * 60 * 1000).toISOString();
  const lateIso = new Date(nowMs - 30 * 60 * 1000).toISOString();

  const { count: unassignedSoonCount } = await supabase
    .from("jobs")
    .select("*", { head: true, count: "exact" })
    .in("status", ["scheduled", "assigned"])
    .is("team_id", null)
    .gte("scheduled_start", nowIso)
    .lte("scheduled_start", soonIso);

  const { count: lateStartCount } = await supabase
    .from("jobs")
    .select("*", { head: true, count: "exact" })
    .in("status", ["scheduled", "assigned"])
    .lt("scheduled_start", lateIso);

  const { count: payoutFailCount } = await supabase
    .from("crew_payouts")
    .select("*", { head: true, count: "exact" })
    .in("status", ["failed", "awaiting_destination"]);

  const { count: smsFailCount } = await supabase
    .from("sms_messages")
    .select("*", { head: true, count: "exact" })
    .eq("direction", "outbound")
    .eq("status", "failed");

  const { data: timeEntriesRaw } = await supabase
    .from("time_entries")
    .select("id, clock_in, clock_out, commission_cents, job_id, cleaner_id")
    .order("clock_in", { ascending: false })
    .limit(30);

  const timeEntryJobIds = [...new Set((timeEntriesRaw ?? []).map((e) => e.job_id))];
  const timeEntryCleanerIds = [...new Set((timeEntriesRaw ?? []).map((e) => e.cleaner_id))];

  const { data: timeEntryJobs } = timeEntryJobIds.length
    ? await supabase
        .from("jobs")
        .select("id, address_line, scheduled_start, status")
        .in("id", timeEntryJobIds)
    : { data: [] };

  const { data: timeEntryCleaners } = timeEntryCleanerIds.length
    ? await supabase.from("cleaners").select("id, profile_id").in("id", timeEntryCleanerIds)
    : { data: [] };

  const timeEntryProfileIds = [...new Set((timeEntryCleaners ?? []).map((c) => c.profile_id))];
  const { data: timeEntryProfiles } = timeEntryProfileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", timeEntryProfileIds)
    : { data: [] };

  const timeEntryJobMap = Object.fromEntries((timeEntryJobs ?? []).map((j) => [j.id, j]));
  const timeEntryCleanerToProfile = Object.fromEntries(
    (timeEntryCleaners ?? []).map((c) => [c.id, c.profile_id])
  );
  const timeEntryProfileMap = Object.fromEntries(
    (timeEntryProfiles ?? []).map((p) => [p.id, p])
  );

  const { data: claimEventsRaw } = await supabase
    .from("job_claim_events")
    .select("id, job_id, team_id, cleaner_id, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const claimJobIds = [...new Set((claimEventsRaw ?? []).map((e) => e.job_id))];
  const claimCleanerIds = [...new Set((claimEventsRaw ?? []).map((e) => e.cleaner_id))];

  const { data: claimJobs } = claimJobIds.length
    ? await supabase.from("jobs").select("id, address_line, city, state, zip").in("id", claimJobIds)
    : { data: [] };

  const { data: claimCleaners } = claimCleanerIds.length
    ? await supabase.from("cleaners").select("id, profile_id").in("id", claimCleanerIds)
    : { data: [] };

  const claimProfileIds = [...new Set((claimCleaners ?? []).map((c) => c.profile_id))];
  const { data: claimProfiles } = claimProfileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", claimProfileIds)
    : { data: [] };

  const claimJobMap = Object.fromEntries((claimJobs ?? []).map((j) => [j.id, j]));
  const claimCleanerToProfile = Object.fromEntries(
    (claimCleaners ?? []).map((c) => [c.id, c.profile_id])
  );
  const claimProfileMap = Object.fromEntries((claimProfiles ?? []).map((p) => [p.id, p]));

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col justify-between gap-6 border-b border-border/60 pb-8 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.adminHeadline}</h1>
            <p className="mt-1 text-muted-foreground">{siteConfig.adminSub}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/finance"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Banknote className="size-4" />
              Finance &amp; payroll
            </Link>
            <Link
              href="/admin/hiring"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Users className="size-4" />
              {siteConfig.adminHiringCta}
            </Link>
            <Link
              href="/admin/sms-templates"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <MessageCircle className="size-4" />
              SMS templates
            </Link>
            <a
              href="/api/admin/exports/customers"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <Download className="size-4" />
              Export customers (CSV)
            </a>
            <DispatchControls />
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/80 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPinned className="size-5 text-primary" />
                Dispatch map
              </CardTitle>
              <CardDescription>
                Blue markers: team bases · Amber: scheduled jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DispatchMap
                jobs={(jobs ?? []).map((j) => ({
                  id: j.id,
                  lat: j.lat,
                  lng: j.lng,
                  address_line: j.address_line,
                  status: j.status,
                  customer_notes: (j as { customer_notes?: string | null }).customer_notes,
                }))}
                teams={(teams ?? []).map((t) => ({
                  id: t.id,
                  base_lat: t.base_lat,
                  base_lng: t.base_lng,
                  name: t.name,
                }))}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Route className="size-5 text-primary" />
                Routing rules
              </CardTitle>
              <CardDescription>
                Our crews (by ZIP) — nearest available two-person team wins the job.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Teams marked <Badge variant="secondary">available</Badge> get new work.
                Same ZIP first; otherwise the closest base to the home wins.
              </p>
              <p>
                Run dispatch after you add crews or when a job still needs people assigned.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="size-5 text-primary" />
              Exception center
            </CardTitle>
            <CardDescription>
              Jobs and operations needing attention right now.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Unassigned jobs in next 2 hours</p>
              <p className="mt-1 text-2xl font-semibold">{unassignedSoonCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Late starts (&gt;30 min)</p>
              <p className="mt-1 text-2xl font-semibold">{lateStartCount ?? 0}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Payout failures / blocked</p>
              <p className="mt-1 text-2xl font-semibold">{payoutFailCount ?? 0}</p>
              <Link
                href="/admin/finance"
                className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Open payout controls
              </Link>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
              <p className="text-sm text-muted-foreground">Failed outbound SMS</p>
              <p className="mt-1 text-2xl font-semibold">{smsFailCount ?? 0}</p>
              <Link
                href="/admin/sms-templates"
                className="mt-1 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                Open SMS ops
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8 border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-primary" />
              Job claim history
            </CardTitle>
            <CardDescription>
              Recent jobs claimed by crew from the mobile app.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claimed at</TableHead>
                  <TableHead>Crew member</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Job</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(claimEventsRaw ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      No claims yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (claimEventsRaw ?? []).map((e) => {
                    const profileId = claimCleanerToProfile[e.cleaner_id];
                    const cleanerName = profileId
                      ? claimProfileMap[profileId]?.full_name?.trim() || "Crew member"
                      : "Crew member";
                    const teamName = teamNameById[e.team_id] ?? "Team";
                    const job = claimJobMap[e.job_id];
                    const jobLabel = job
                      ? [job.address_line, job.city, job.state, job.zip].filter(Boolean).join(", ")
                      : `Job ${e.job_id.slice(0, 8)}...`;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(e.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{cleanerName}</TableCell>
                        <TableCell>{teamName}</TableCell>
                        <TableCell className="max-w-[320px]">
                          <span className="line-clamp-2 text-muted-foreground" title={jobLabel}>
                            {jobLabel}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-8 border-border/80">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock3 className="size-5 text-primary" />
                Crew time clock
              </CardTitle>
              <CardDescription>
                Recent clock-in and clock-out from the Crew app (who, which stop, and times).
              </CardDescription>
            </div>
            <Link
              href="/admin/finance#time-entries"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "shrink-0 self-start"
              )}
            >
              Full history &amp; pay detail
            </Link>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Stop</TableHead>
                  <TableHead>Clock in</TableHead>
                  <TableHead>Clock out</TableHead>
                  <TableHead>On site</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(timeEntriesRaw ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground">
                      No time entries yet. Crew clocks in on each stop from the Crew app after jobs
                      are assigned.
                    </TableCell>
                  </TableRow>
                ) : (
                  (timeEntriesRaw ?? []).map((e) => {
                    const pid = timeEntryCleanerToProfile[e.cleaner_id];
                    const name = pid ? timeEntryProfileMap[pid]?.full_name?.trim() || "—" : "—";
                    const job = timeEntryJobMap[e.job_id];
                    const stopLabel = job?.address_line?.trim() || `Job ${e.job_id.slice(0, 8)}…`;
                    const clockIn = new Date(e.clock_in);
                    const clockOut = e.clock_out ? new Date(e.clock_out) : null;
                    const onSiteMins =
                      clockOut != null
                        ? Math.round((clockOut.getTime() - clockIn.getTime()) / 60_000)
                        : null;
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="max-w-[220px]">
                          <span className="line-clamp-2 text-muted-foreground" title={stopLabel}>
                            {stopLabel}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {clockIn.toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {clockOut ? clockOut.toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {clockOut ? (
                            onSiteMins != null && onSiteMins >= 0 ? (
                              `${onSiteMins} min`
                            ) : (
                              "—"
                            )
                          ) : (
                            <Badge variant="secondary" className="font-normal">
                              On site
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mt-8 border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="size-5 text-primary" />
              {siteConfig.adminCrewMessagesTitle}
            </CardTitle>
            <CardDescription>{siteConfig.adminCrewMessagesSub}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {crewMsgs.length === 0 ? (
              <p className="text-muted-foreground">
                No crew messages yet — they appear when staff post from the crew app (after the
                messages migration is applied).
              </p>
            ) : (
              <ul className="space-y-3">
                {crewMsgs.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {teamNameById[m.team_id] ?? "Team"} ·{" "}
                        {m.profiles?.full_name?.trim() || "Crew"}
                      </span>
                      <time dateTime={m.created_at}>
                        {new Date(m.created_at).toLocaleString()}
                      </time>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-foreground">{m.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8 border-border/80">
          <CardHeader>
            <CardTitle>Active jobs</CardTitle>
            <CardDescription>Latest 50 visits across all territories.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Service / site</TableHead>
                  <TableHead>{siteConfig.adminJobNotesHeading}</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>ZIP</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(jobs ?? []).map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(j.scheduled_start).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getServiceTierShortLabel(
                        (j as { service_tier?: string | null }).service_tier ?? undefined
                      )}
                      {" · "}
                      {getPropertyTypeLabel(
                        (j as { property_type?: string | null }).property_type ?? undefined
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      {(j as { customer_notes?: string | null }).customer_notes?.trim() ? (
                        <span
                          className="line-clamp-3 text-sm text-foreground"
                          title={
                            (j as { customer_notes?: string | null }).customer_notes ?? undefined
                          }
                        >
                          {(j as { customer_notes?: string | null }).customer_notes}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{j.address_line}</TableCell>
                    <TableCell>{j.zip}</TableCell>
                    <TableCell>
                      {j.team_id
                        ? `${(teams ?? []).find((t) => t.id === j.team_id)?.name ?? "Team"} · ${
                            cleanerCountByTeam[j.team_id] ?? 0
                          } cleaners`
                        : "Unassigned"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{j.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {teamIds.length ? (
          <p className="mt-6 text-xs text-muted-foreground">
            Tracking {teamIds.length} team bases ·{" "}
            {(cleaners ?? []).length} active cleaners linked to teams.
          </p>
        ) : null}
      </div>
    </SiteShell>
  );
}
