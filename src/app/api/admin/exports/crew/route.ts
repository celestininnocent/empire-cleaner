import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function csvCell(v: string | number | boolean | null | undefined): string {
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
    .from("cleaners")
    .select(
      [
        "id",
        "profile_id",
        "team_id",
        "bio",
        "photo_url",
        "current_lat",
        "current_lng",
        "last_location_at",
        "created_at",
        "profiles(full_name, phone, zip_code, role, avatar_url, stripe_connect_account_id, created_at, updated_at)",
        "teams(name, zip_code, base_lat, base_lng, is_available, created_at)",
      ].join(", ")
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const header = [
    "cleaner_id",
    "profile_id",
    "profile_full_name",
    "profile_phone",
    "profile_zip_code",
    "profile_role",
    "profile_avatar_url",
    "profile_stripe_connect_account_id",
    "profile_created_at",
    "profile_updated_at",
    "team_id",
    "team_name",
    "team_zip_code",
    "team_base_lat",
    "team_base_lng",
    "team_is_available",
    "team_created_at",
    "cleaner_bio",
    "cleaner_photo_url",
    "cleaner_current_lat",
    "cleaner_current_lng",
    "cleaner_last_location_at",
    "cleaner_created_at",
  ];

  const lines = [header.map(csvCell).join(",")];

  for (const row of (rows ?? []) as unknown[]) {
    const r = row as {
      id: string;
      profile_id: string;
      team_id: string | null;
      bio: string | null;
      photo_url: string | null;
      current_lat: number | null;
      current_lng: number | null;
      last_location_at: string | null;
      created_at: string;
      profiles:
        | {
            full_name: string | null;
            phone: string | null;
            zip_code: string | null;
            role: string | null;
            avatar_url: string | null;
            stripe_connect_account_id: string | null;
            created_at: string;
            updated_at: string;
          }
        | {
            full_name: string | null;
            phone: string | null;
            zip_code: string | null;
            role: string | null;
            avatar_url: string | null;
            stripe_connect_account_id: string | null;
            created_at: string;
            updated_at: string;
          }[]
        | null;
      teams:
        | {
            name: string;
            zip_code: string;
            base_lat: number;
            base_lng: number;
            is_available: boolean;
            created_at: string;
          }
        | {
            name: string;
            zip_code: string;
            base_lat: number;
            base_lng: number;
            is_available: boolean;
            created_at: string;
          }[]
        | null;
    };

    const prof = Array.isArray(r.profiles) ? r.profiles[0] ?? null : r.profiles;
    const team = Array.isArray(r.teams) ? r.teams[0] ?? null : r.teams;

    lines.push(
      [
        r.id,
        r.profile_id,
        prof?.full_name ?? "",
        prof?.phone ?? "",
        prof?.zip_code ?? "",
        prof?.role ?? "",
        prof?.avatar_url ?? "",
        prof?.stripe_connect_account_id ?? "",
        prof?.created_at ?? "",
        prof?.updated_at ?? "",
        r.team_id ?? "",
        team?.name ?? "",
        team?.zip_code ?? "",
        team?.base_lat ?? "",
        team?.base_lng ?? "",
        team?.is_available ?? "",
        team?.created_at ?? "",
        r.bio ?? "",
        r.photo_url ?? "",
        r.current_lat ?? "",
        r.current_lng ?? "",
        r.last_location_at ?? "",
        r.created_at,
      ]
        .map((v) => csvCell(v))
        .join(",")
    );
  }

  const filename = `crew_export_${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
