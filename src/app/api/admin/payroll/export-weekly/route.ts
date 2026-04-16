import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function parseWeekStart(input: string | null): Date {
  if (!input) {
    const now = new Date();
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const dow = d.getUTCDay(); // 0 Sun .. 6 Sat
    const delta = dow === 0 ? 6 : dow - 1; // Monday start
    d.setUTCDate(d.getUTCDate() - delta);
    return d;
  }
  const dt = new Date(`${input}T00:00:00.000Z`);
  if (!Number.isFinite(dt.getTime())) {
    throw new Error("Invalid weekStart. Use YYYY-MM-DD.");
  }
  return dt;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const role = await getProfileRoleForUser(user.id);
    if (role !== "admin") return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    const svc = createServiceRoleClient();
    if (!svc) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    const url = new URL(request.url);
    const weekStart = parseWeekStart(url.searchParams.get("weekStart"));
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data: entries } = await svc
      .from("time_entries")
      .select(
        "id, job_id, cleaner_id, clock_in, clock_out, commission_cents, base_commission_cents, quality_bonus_cents, on_time_bonus_cents"
      )
      .not("clock_out", "is", null)
      .gte("clock_out", weekStart.toISOString())
      .lt("clock_out", weekEnd.toISOString())
      .order("clock_out", { ascending: true });

    const rows = entries ?? [];
    const cleanerIds = [...new Set(rows.map((r) => r.cleaner_id))];
    const jobIds = [...new Set(rows.map((r) => r.job_id))];
    const entryIds = [...new Set(rows.map((r) => r.id))];

    const { data: cleaners } = cleanerIds.length
      ? await svc.from("cleaners").select("id, profile_id").in("id", cleanerIds)
      : { data: [] as { id: string; profile_id: string }[] };
    const profileIds = [...new Set((cleaners ?? []).map((c) => c.profile_id))];
    const { data: profiles } = profileIds.length
      ? await svc.from("profiles").select("id, full_name").in("id", profileIds)
      : { data: [] as { id: string; full_name: string | null }[] };

    const { data: jobs } = jobIds.length
      ? await svc.from("jobs").select("id, address_line, zip").in("id", jobIds)
      : { data: [] as { id: string; address_line: string; zip: string }[] };

    const { data: payouts } = entryIds.length
      ? await svc
          .from("crew_payouts")
          .select("time_entry_id, status, paid_at, failure_reason")
          .in("time_entry_id", entryIds)
      : {
          data: [] as {
            time_entry_id: string;
            status: string;
            paid_at: string | null;
            failure_reason: string | null;
          }[],
        };

    const cleanerToProfile = Object.fromEntries((cleaners ?? []).map((c) => [c.id, c.profile_id]));
    const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
    const jobMap = Object.fromEntries((jobs ?? []).map((j) => [j.id, j]));
    const payoutMap = Object.fromEntries((payouts ?? []).map((p) => [p.time_entry_id, p]));

    const header = [
      "week_start_utc",
      "week_end_utc",
      "time_entry_id",
      "cleaner_name",
      "job_address",
      "job_zip",
      "clock_in_utc",
      "clock_out_utc",
      "base_cents",
      "quality_bonus_cents",
      "on_time_bonus_cents",
      "total_cents",
      "payout_status",
      "payout_paid_at_utc",
      "payout_failure_reason",
    ];

    const csvLines = [header.map((h) => csvCell(h)).join(",")];
    for (const r of rows) {
      const pid = cleanerToProfile[r.cleaner_id];
      const cleanerName = pid ? profileMap[pid]?.full_name ?? "Unknown" : "Unknown";
      const job = jobMap[r.job_id];
      const payout = payoutMap[r.id];
      const base = r.base_commission_cents ?? r.commission_cents ?? 0;
      const quality = r.quality_bonus_cents ?? 0;
      const onTime = r.on_time_bonus_cents ?? 0;
      const total = r.commission_cents ?? base + quality + onTime;

      csvLines.push(
        [
          weekStart.toISOString(),
          weekEnd.toISOString(),
          r.id,
          cleanerName,
          job?.address_line ?? "",
          job?.zip ?? "",
          r.clock_in,
          r.clock_out,
          base,
          quality,
          onTime,
          total,
          payout?.status ?? "pending",
          payout?.paid_at ?? "",
          payout?.failure_reason ?? "",
        ]
          .map((v) => csvCell(v))
          .join(",")
      );
    }

    const filename = `weekly_payroll_${weekStart.toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csvLines.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not export payroll CSV";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
