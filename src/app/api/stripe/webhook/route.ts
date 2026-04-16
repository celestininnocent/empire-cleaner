import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import {
  pickNearestTeam,
  type TeamDispatchCandidate,
  type TeamRow,
} from "@/lib/dispatch";
import { approximateLatLngFromZip } from "@/lib/geo";
import { DEFAULT_ROOMS } from "@/lib/checklist";
import {
  notifyCrewMembersJobAssigned,
  notifyCrewMembersJobUnclaimed,
} from "@/lib/crew-job-sms";
import { normalizeAddOnIds } from "@/lib/add-ons";
import { resolveOrCreateUserForPaidBooking } from "@/lib/checkout/resolve-guest-user";

function serviceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!stripe || !secret) {
    return NextResponse.json({ received: true, skipped: true });
  }

  let event: Stripe.Event;
  try {
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = serviceSupabase();
  if (!admin) {
    return NextResponse.json({ received: true, skipped: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    if (meta.flow_type === "tip") {
      const jobId = typeof meta.job_id === "string" ? meta.job_id.trim() : "";
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      const amountCents =
        typeof session.amount_total === "number"
          ? session.amount_total
          : parseInt(String(meta.amount_cents ?? "0"), 10) || 0;

      if (!jobId || !paymentIntentId || amountCents <= 0) {
        return NextResponse.json({ received: true, error: "tip_metadata_invalid" });
      }

      const { data: existingTip } = await admin
        .from("tips")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntentId)
        .maybeSingle();
      if (existingTip?.id) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      await admin.from("tips").insert({
        job_id: jobId,
        amount_cents: amountCents,
        stripe_payment_intent_id: paymentIntentId,
      });
      return NextResponse.json({ received: true, tip: true });
    }

    /** Stripe may retry webhooks — avoid duplicate jobs & checklist rows. */
    const { data: existingJob } = await admin
      .from("jobs")
      .select("id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();
    if (existingJob?.id) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    let userId =
      typeof meta.supabase_user_id === "string" && meta.supabase_user_id.length > 0
        ? meta.supabase_user_id
        : "";

    if (!userId && meta.guest_checkout === "true") {
      const sessionEmail =
        typeof session.customer_details?.email === "string"
          ? session.customer_details.email
          : typeof session.customer_email === "string"
            ? session.customer_email
            : "";
      const email = (meta.guest_email as string | undefined)?.trim() || sessionEmail;
      const phone = String(meta.guest_phone ?? "").replace(/\D/g, "");
      const fullName = String(meta.guest_full_name ?? "").trim();
      if (!email.includes("@")) {
        return NextResponse.json({ received: true, error: "guest_email_missing" });
      }
      if (phone.length < 10 || fullName.length < 2) {
        return NextResponse.json({ received: true, error: "guest_contact_invalid" });
      }
      const resolved = await resolveOrCreateUserForPaidBooking(admin, {
        email,
        phone,
        fullName,
      });
      if ("error" in resolved) {
        console.error("[stripe webhook] guest user:", resolved.error);
        return NextResponse.json({ received: true, error: resolved.error });
      }
      userId = resolved.userId;
    }

    if (!userId) {
      return NextResponse.json({ received: true });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ received: true });
    }

    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : null;
    const { lat, lng } = approximateLatLngFromZip(meta.zip ?? "00000");

    let customerId: string | null = null;
    const existing = await admin
      .from("customers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    if (existing.data?.id) {
      customerId = existing.data.id;
      if (stripeCustomerId) {
        await admin
          .from("customers")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", customerId);
      }
    } else {
      const { data: created, error: createErr } = await admin
        .from("customers")
        .insert({
          profile_id: userId,
          stripe_customer_id: stripeCustomerId,
          zip: meta.zip,
          address_line: meta.address,
          city: meta.city,
          state: meta.state,
          lat,
          lng,
        })
        .select("id")
        .single();
      if (createErr || !created) {
        return NextResponse.json({ received: true, error: createErr?.message });
      }
      customerId = created.id;
    }

    if (!customerId) {
      return NextResponse.json({ received: true });
    }

    const priceCents = parseInt(meta.price_cents ?? "0", 10) || 0;
    const zip = meta.zip ?? "00000";
    const jobCoords = { zip, lat, lng };

    const { data: teamsRaw } = await admin.from("teams").select("*");
    const teams = (teamsRaw ?? []) as TeamRow[];
    const { data: cleanersRaw } = await admin
      .from("cleaners")
      .select("team_id, current_lat, current_lng");
    const { data: activeJobsRaw } = await admin
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

    const team = pickNearestTeam(jobCoords, teamCandidates);

    const scheduledStart = meta.scheduled_start
      ? new Date(meta.scheduled_start).toISOString()
      : new Date().toISOString();
    const addOnIds = normalizeAddOnIds((meta.add_on_ids ?? "").split(","));

    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .insert({
        customer_id: customerId,
        team_id: team?.id ?? null,
        status: team ? "assigned" : "scheduled",
        scheduled_start: scheduledStart,
        price_cents: priceCents,
        bedrooms: parseInt(meta.bedrooms ?? "2", 10),
        bathrooms: parseInt(meta.bathrooms ?? "2", 10),
        square_footage: parseInt(meta.square_footage ?? "1500", 10),
        property_type: meta.property_type ?? "residential",
        service_tier: meta.service_tier ?? "standard",
        address_line: meta.address ?? "",
        city: meta.city,
        state: meta.state,
        zip,
        lat,
        lng,
        stripe_checkout_session_id: session.id,
        add_on_ids: addOnIds,
        customer_notes: (() => {
          const raw = meta.customer_notes;
          if (raw == null || raw === "") return null;
          const s = String(raw).trim();
          return s.length ? s.slice(0, 500) : null;
        })(),
      })
      .select("id")
      .single();

    if (jobErr || !job) {
      const isDupSession =
        jobErr?.code === "23505" ||
        (jobErr?.message &&
          /duplicate|unique|idx_jobs_stripe_checkout_session/i.test(jobErr.message));
      if (isDupSession) {
        return NextResponse.json({ received: true, duplicate: true });
      }
      return NextResponse.json({ received: true, error: jobErr?.message });
    }

    const subId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (subId) {
      await admin.from("recurring_schedules").insert({
        customer_id: customerId,
        stripe_subscription_id: subId,
        frequency: (meta.frequency as "weekly" | "biweekly" | "monthly") ?? "monthly",
        is_active: true,
        next_service_at: scheduledStart,
      });
    }

    const rows = DEFAULT_ROOMS.map((r) => ({
      job_id: job.id,
      room_key: r.room_key,
      label: r.label,
      requires_photo: r.requires_photo,
    }));
    await admin.from("job_checklist_items").insert(rows);

    if (team?.id) {
      void notifyCrewMembersJobAssigned(job.id).catch((e) =>
        console.error("[stripe webhook] crew SMS:", e)
      );
    } else {
      void notifyCrewMembersJobUnclaimed(job.id).catch((e) =>
        console.error("[stripe webhook] unclaimed crew SMS:", e)
      );
    }
  }

  return NextResponse.json({ received: true });
}
