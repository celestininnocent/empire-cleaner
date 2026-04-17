import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type GrowthRange = "4w" | "8w" | "12w" | "ytd";

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Owner access only." }, { status: 403 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range");
  const range: GrowthRange =
    rangeParam === "4w" || rangeParam === "8w" || rangeParam === "12w" || rangeParam === "ytd"
      ? rangeParam
      : "8w";
  const source = (url.searchParams.get("source") ?? "").trim();
  const campaign = (url.searchParams.get("campaign") ?? "").trim();
  const zip = (url.searchParams.get("zip") ?? "").trim();

  const { data: rows, error } = await svc
    .from("neighborhood_demand_weekly")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(1200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const now = new Date();
  const rangeStart = (() => {
    if (range === "ytd") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const weeks = range === "4w" ? 4 : range === "12w" ? 12 : 8;
    return new Date(now.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);
  })();

  const filtered = (rows ?? []).filter((row) => {
    const r = row as {
      week_start: string;
      utm_source: string;
      utm_campaign: string;
      zip: string;
    };
    if (new Date(r.week_start) < rangeStart) return false;
    if (source && r.utm_source !== source) return false;
    if (campaign && r.utm_campaign !== campaign) return false;
    if (zip && r.zip !== zip) return false;
    return true;
  }) as Array<{
    week_start: string;
    city: string;
    state: string;
    zip: string;
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    bookings_count: number;
    booked_revenue_cents: number;
    avg_ticket_cents: number;
    completed_count: number;
    cancelled_count: number;
  }>;

  const header = [
    "week_start",
    "city",
    "state",
    "zip",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "bookings_count",
    "booked_revenue_cents",
    "avg_ticket_cents",
    "completed_count",
    "cancelled_count",
  ];
  const lines = [header.map(csvCell).join(",")];
  for (const r of filtered) {
    lines.push(
      [
        r.week_start,
        r.city,
        r.state,
        r.zip,
        r.utm_source,
        r.utm_medium,
        r.utm_campaign,
        r.bookings_count,
        r.booked_revenue_cents,
        r.avg_ticket_cents,
        r.completed_count,
        r.cancelled_count,
      ]
        .map((v) => csvCell(v))
        .join(",")
    );
  }

  const filename = `growth_export_${range}_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
