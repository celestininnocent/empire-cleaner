import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { haversineMiles } from "@/lib/geo";
import { normalizeUsPhoneToE164 } from "@/lib/sms";
import { queueOutboundSms, processSmsQueueBatch } from "@/lib/sms-queue";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { lat?: number; lng?: number };
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Valid lat/lng required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

    const svc = createServiceRoleClient();
    if (!svc) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    let { data: cleaner } = await svc
      .from("cleaners")
      .select("id, team_id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (!cleaner?.id) {
      await supabase.rpc("claim_crew_access_for_me");
      const retry = await svc
        .from("cleaners")
        .select("id, team_id")
        .eq("profile_id", user.id)
        .maybeSingle();
      cleaner = retry.data;
    }

    if (!cleaner?.id) {
      return NextResponse.json(
        { error: "Crew account is not linked yet. Refresh the page or sign out and back in, then try again." },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    const { error: upErr } = await svc
      .from("cleaners")
      .update({ current_lat: lat, current_lng: lng, last_location_at: nowIso })
      .eq("id", cleaner.id);
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 400 });
    }

    const { error: pingErr } = await svc.from("cleaner_location_pings").insert({
      cleaner_id: cleaner.id,
      lat,
      lng,
      source: "crew_app",
    });
    if (pingErr) {
      console.error("[crew/location/ping] cleaner_location_pings insert:", pingErr.message);
    }

    if (!cleaner.team_id) {
      return NextResponse.json({ ok: true, queued: 0, reason: "no_team" });
    }

    const soonIso = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    const { data: jobs } = await svc
      .from("jobs")
      .select(
        "id, address_line, city, state, zip, lat, lng, customer_id, status, scheduled_start, customer_eta_notified_at"
      )
      .eq("team_id", cleaner.team_id)
      .in("status", ["scheduled", "assigned", "in_progress"])
      .gte("scheduled_start", new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .lte("scheduled_start", soonIso)
      .order("scheduled_start", { ascending: true })
      .limit(15);

    let queued = 0;
    for (const j of jobs ?? []) {
      if (j.customer_eta_notified_at) continue;
      if (j.lat == null || j.lng == null) continue;
      const d = haversineMiles(lat, lng, Number(j.lat), Number(j.lng));
      if (d > 2.5) continue;

      const { data: customer } = await svc
        .from("customers")
        .select("profile_id")
        .eq("id", j.customer_id)
        .maybeSingle();
      if (!customer?.profile_id) continue;

      const { data: profile } = await svc
        .from("profiles")
        .select("phone")
        .eq("id", customer.profile_id)
        .maybeSingle();
      const to = normalizeUsPhoneToE164(profile?.phone ?? "");
      if (!to) continue;

      const address = [j.address_line, j.city, j.state, j.zip].filter(Boolean).join(", ");
      const r = await queueOutboundSms({
        toPhone: to,
        templateKey: "customer_crew_nearby",
        routingKind: "customer",
        profileId: customer.profile_id,
        teamId: cleaner.team_id,
        jobId: j.id,
        vars: {
          distance_miles: d.toFixed(1),
          address,
        },
      });
      if (!r.ok) continue;

      queued += 1;
      await svc
        .from("jobs")
        .update({
          customer_eta_notified_at: nowIso,
          customer_eta_notified_miles: d,
        })
        .eq("id", j.id);
    }

    if (queued > 0) await processSmsQueueBatch(20);

    return NextResponse.json({ ok: true, queued });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not process location ping";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
