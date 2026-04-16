import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdminUser();
  } catch {
    return NextResponse.json({ error: "Owner access only." }, { status: 403 });
  }

  const svc = createServiceRoleClient();
  if (!svc) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  const { data: rows, error } = await svc
    .from("customers")
    .select(
      [
        "id",
        "profile_id",
        "stripe_customer_id",
        "address_line",
        "city",
        "state",
        "zip",
        "lat",
        "lng",
        "access_notes",
        "pets_notes",
        "parking_notes",
        "onboarding_completed_at",
        "created_at",
        "profiles(full_name, phone, zip_code, role)",
      ].join(", ")
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const header = [
    "customer_id",
    "profile_id",
    "profile_full_name",
    "profile_phone",
    "profile_zip_code",
    "profile_role",
    "stripe_customer_id",
    "address_line",
    "city",
    "state",
    "zip",
    "lat",
    "lng",
    "access_notes",
    "pets_notes",
    "parking_notes",
    "onboarding_completed_at",
    "customer_created_at",
  ];

  const lines = [header.map(csvCell).join(",")];

  for (const row of rows ?? []) {
    const r = row as {
      id: string;
      profile_id: string;
      stripe_customer_id: string | null;
      address_line: string | null;
      city: string | null;
      state: string | null;
      zip: string | null;
      lat: number | null;
      lng: number | null;
      access_notes: string | null;
      pets_notes: string | null;
      parking_notes: string | null;
      onboarding_completed_at: string | null;
      created_at: string;
      profiles:
        | { full_name: string | null; phone: string | null; zip_code: string | null; role: string | null }
        | { full_name: string | null; phone: string | null; zip_code: string | null; role: string | null }[]
        | null;
    };

    const prof = Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles;

    lines.push(
      [
        r.id,
        r.profile_id,
        prof?.full_name ?? "",
        prof?.phone ?? "",
        prof?.zip_code ?? "",
        prof?.role ?? "",
        r.stripe_customer_id ?? "",
        r.address_line ?? "",
        r.city ?? "",
        r.state ?? "",
        r.zip ?? "",
        r.lat ?? "",
        r.lng ?? "",
        r.access_notes ?? "",
        r.pets_notes ?? "",
        r.parking_notes ?? "",
        r.onboarding_completed_at ?? "",
        r.created_at,
      ]
        .map((v) => csvCell(v))
        .join(",")
    );
  }

  const filename = `customers_export_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
