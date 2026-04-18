import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Banknote, PiggyBank } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { haversineMiles } from "@/lib/geo";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import {
  getCommissionPoolPercent,
  getCrewSplitWays,
  getOnTimeBonusCents,
  getOnTimeWindowMinutes,
  getQualityBonusCents,
} from "@/lib/payroll-settings";
import { formatUsd } from "@/lib/pricing";
import { PayoutControlBoard } from "@/components/admin/payout-control-board";
import { buttonVariants } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function currentWeekStartIsoDateUtc(): string {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay(); // 0 Sun .. 6 Sat
  const delta = dow === 0 ? 6 : dow - 1; // Monday-based week
  d.setUTCDate(d.getUTCDate() - delta);
  return d.toISOString().slice(0, 10);
}

export default async function AdminFinancePage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <SiteShell>
        <p className="p-10 text-center text-muted-foreground">Configure Supabase.</p>
      </SiteShell>
    );
  }

  const user = await getServerUser();
  if (!user) {
    redirect("/login?next=/admin/finance");
  }

  const supabase = await createClient();
  const role = await getProfileRoleForUser(user.id);

  if (role !== "admin") {
    redirect("/admin");
  }

  const { data: entries } = await supabase
    .from("time_entries")
    .select(
      "id, clock_in, clock_out, commission_cents, base_commission_cents, quality_bonus_cents, on_time_bonus_cents, job_id, cleaner_id"
    )
    .order("clock_in", { ascending: false })
    .limit(200);

  const jobIds = [...new Set((entries ?? []).map((e) => e.job_id))];
  const cleanerIds = [...new Set((entries ?? []).map((e) => e.cleaner_id))];

  const { data: jobs } = jobIds.length
    ? await supabase.from("jobs").select("id, price_cents, scheduled_start, address_line, status").in("id", jobIds)
    : { data: [] };

  const { data: cleaners } = cleanerIds.length
    ? await supabase.from("cleaners").select("id, profile_id").in("id", cleanerIds)
    : { data: [] };

  const profileIds = [...new Set((cleaners ?? []).map((c) => c.profile_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", profileIds)
    : { data: [] };

  const jobMap = Object.fromEntries((jobs ?? []).map((j) => [j.id, j]));
  const cleanerToProfile = Object.fromEntries(
    (cleaners ?? []).map((c) => [c.id, c.profile_id])
  );
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const totalRecorded = (entries ?? []).reduce(
    (sum, e) => sum + (e.commission_cents ?? 0),
    0
  );

  const { data: tips } = await supabase
    .from("tips")
    .select("id, amount_cents, created_at, job_id")
    .order("created_at", { ascending: false })
    .limit(100);

  const tipJobIds = [...new Set((tips ?? []).map((t) => t.job_id))];
  const { data: tipJobs } = tipJobIds.length
    ? await supabase.from("jobs").select("id, address_line").in("id", tipJobIds)
    : { data: [] };
  const tipJobMap = Object.fromEntries((tipJobs ?? []).map((j) => [j.id, j]));

  const tipsTotal = (tips ?? []).reduce((s, t) => s + t.amount_cents, 0);

  const { data: payouts } = await supabase
    .from("crew_payouts")
    .select(
      "id, time_entry_id, cleaner_id, amount_cents, base_cents, quality_bonus_cents, on_time_bonus_cents, status, created_at, paid_at, failure_reason"
    )
    .order("created_at", { ascending: false })
    .limit(120);

  const entryMap = Object.fromEntries((entries ?? []).map((e) => [e.id, e]));
  const payoutRows = (payouts ?? []).map((p) => {
    const entry = entryMap[p.time_entry_id];
    const pid = p.cleaner_id ? cleanerToProfile[p.cleaner_id] : undefined;
    const cleanerName = pid ? profileMap[pid]?.full_name ?? "—" : "—";
    const job = entry ? jobMap[entry.job_id] : undefined;
    const jobLabel = job?.address_line ?? "Job";
    return {
      id: p.id,
      time_entry_id: p.time_entry_id,
      status: p.status as
        | "pending"
        | "processing"
        | "paid"
        | "failed"
        | "awaiting_destination",
      amount_cents: p.amount_cents,
      base_cents: p.base_cents,
      quality_bonus_cents: p.quality_bonus_cents,
      on_time_bonus_cents: p.on_time_bonus_cents,
      created_at: p.created_at,
      paid_at: p.paid_at,
      failure_reason: p.failure_reason,
      cleaner_name: cleanerName,
      job_label: jobLabel,
    };
  });

  const { data: pings } = cleanerIds.length
    ? await supabase
        .from("cleaner_location_pings")
        .select("cleaner_id, lat, lng, created_at")
        .in("cleaner_id", cleanerIds)
        .order("created_at", { ascending: false })
        .limit(1500)
    : { data: [] };

  const mileageByCleaner = (pings ?? []).reduce(
    (acc, row) => {
      const key = row.cleaner_id;
      const prev = acc[key]?.last;
      const cur = { lat: Number(row.lat), lng: Number(row.lng), t: row.created_at };
      if (!acc[key]) acc[key] = { miles: 0, last: cur };
      else if (prev) {
        const d = haversineMiles(prev.lat, prev.lng, cur.lat, cur.lng);
        // Ignore obvious GPS spikes/jumps beyond realistic between app pings.
        if (d <= 25) acc[key]!.miles += d;
        acc[key]!.last = cur;
      }
      return acc;
    },
    {} as Record<string, { miles: number; last: { lat: number; lng: number; t: string } }>
  );

  const mileageRows = Object.entries(mileageByCleaner)
    .map(([cleanerId, v]) => {
      const pid = cleanerToProfile[cleanerId];
      const name = pid ? profileMap[pid]?.full_name ?? "—" : "—";
      return {
        cleanerId,
        name,
        miles: Math.round(v.miles * 10) / 10,
      };
    })
    .sort((a, b) => b.miles - a.miles);
  const totalTrackedMiles = mileageRows.reduce((s, r) => s + r.miles, 0);
  const weekStart = currentWeekStartIsoDateUtc();
  const weeklyExportHref = `/api/admin/payroll/export-weekly?weekStart=${weekStart}`;

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          href="/admin"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-6 gap-2 px-0"
          )}
        >
          <ArrowLeft className="size-4" />
          {siteConfig.adminHeadline}
        </Link>

        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Finance &amp; payroll</h1>
            <p className="mt-1 text-muted-foreground">
              Clock-outs, recorded commission, and tips — plus the pay rules we use on new clock-outs.
            </p>
          </div>
          <Link
            href={weeklyExportHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Export weekly CSV
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <PiggyBank className="size-4 text-primary" />
                Pay rules (crew)
              </CardTitle>
              <CardDescription>
                Change in{" "}
                <code className="rounded bg-muted px-1">.env.local</code> — restart dev server.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Crew pool:</span>{" "}
                <strong>{getCommissionPoolPercent()}%</strong> of job total
              </p>
              <p>
                <span className="text-muted-foreground">Split:</span>{" "}
                <strong>{getCrewSplitWays()}</strong> way{getCrewSplitWays() === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                NEXT_PUBLIC_COMMISSION_POOL_PERCENT · NEXT_PUBLIC_CREW_SPLIT_WAYS
              </p>
              <p>
                <span className="text-muted-foreground">Quality bonus:</span>{" "}
                <strong>{formatUsd(getQualityBonusCents())}</strong> (required checklist + photos)
              </p>
              <p>
                <span className="text-muted-foreground">On-time bonus:</span>{" "}
                <strong>{formatUsd(getOnTimeBonusCents())}</strong> (clock-in within{" "}
                {getOnTimeWindowMinutes()} min)
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                NEXT_PUBLIC_QUALITY_BONUS_CENTS · NEXT_PUBLIC_ON_TIME_BONUS_CENTS · NEXT_PUBLIC_ON_TIME_WINDOW_MINUTES
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="size-4 text-primary" />
                Commission logged
              </CardTitle>
              <CardDescription>From clock-out on crew app.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatUsd(totalRecorded)}</p>
              <p className="text-xs text-muted-foreground">Sum of commission on listed rows</p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tips recorded</CardTitle>
              <CardDescription>Customer portal tips (DB).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatUsd(tipsTotal)}</p>
              <p className="text-xs text-muted-foreground">Last 100 tip rows</p>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tracked miles</CardTitle>
              <CardDescription>From crew GPS pings.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{totalTrackedMiles.toFixed(1)} mi</p>
              <p className="text-xs text-muted-foreground">Approximate, straight-line segments</p>
            </CardContent>
          </Card>
        </div>

        <PayoutControlBoard initialRows={payoutRows} />

        <Card id="time-entries" className="mb-8 border-border/80 scroll-mt-24">
          <CardHeader>
            <CardTitle>Time entries &amp; pay</CardTitle>
            <CardDescription>
              Each row is a cleaner clock-in/out. Commission is stored when they clock out.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Job total</TableHead>
                  <TableHead>Clock in</TableHead>
                  <TableHead>Clock out</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(entries ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground">
                      No time entries yet. Crew clocks in/out on the Crew app after jobs are assigned.
                    </TableCell>
                  </TableRow>
                ) : (
                  (entries ?? []).map((e) => {
                    const job = jobMap[e.job_id];
                    const pid = cleanerToProfile[e.cleaner_id];
                    const name = pid ? profileMap[pid]?.full_name ?? "—" : "—";
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {job?.address_line ?? e.job_id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          {job ? formatUsd(job.price_cents) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {new Date(e.clock_in).toLocaleString()}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {e.clock_out
                            ? new Date(e.clock_out).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {e.commission_cents != null
                            ? formatUsd(e.commission_cents)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {e.commission_cents != null ? (
                            <>
                              Base {formatUsd(e.base_commission_cents ?? e.commission_cents)}
                              {" · "}Quality {formatUsd(e.quality_bonus_cents ?? 0)}
                              {" · "}On-time {formatUsd(e.on_time_bonus_cents ?? 0)}
                            </>
                          ) : (
                            "—"
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

        <Card className="border-border/80">
          <CardHeader>
            <CardTitle>Tips</CardTitle>
            <CardDescription>Logged from customer portal; connect Stripe to charge cards in production.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tips ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No tips yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (tips ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(t.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate">
                        {tipJobMap[t.job_id]?.address_line ?? t.job_id.slice(0, 8)}
                      </TableCell>
                      <TableCell>{formatUsd(t.amount_cents)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="mb-8 border-border/80">
          <CardHeader>
            <CardTitle>Crew mileage (GPS tracked)</CardTitle>
            <CardDescription>
              Uses `cleaner_location_pings` from the crew app. Useful for mileage reimbursement and
              route verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Approx miles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mileageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      No GPS pings yet. Crew can tap “Share GPS with dispatch” in the Crew app.
                    </TableCell>
                  </TableRow>
                ) : (
                  mileageRows.map((r) => (
                    <TableRow key={r.cleanerId}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.miles.toFixed(1)} mi</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
