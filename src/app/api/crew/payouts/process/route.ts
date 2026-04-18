import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import { getStripe } from "@/lib/stripe";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

type Body = { timeEntryId?: string };

export async function POST(request: Request) {
  try {
    const originBlock = assertBrowserSameOriginPost(request);
    if (originBlock) return originBlock;

    let body: Body = {};
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const timeEntryId = body.timeEntryId?.trim();
    if (!timeEntryId) {
      return NextResponse.json({ error: "timeEntryId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const svc = createServiceRoleClient();
    if (!svc) {
      return NextResponse.json(
        { error: "Server missing SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const { data: entry } = await svc
      .from("time_entries")
      .select("id, cleaner_id, commission_cents")
      .eq("id", timeEntryId)
      .maybeSingle();
    if (!entry?.id) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    const { data: cleaner } = await svc
      .from("cleaners")
      .select("id, profile_id")
      .eq("id", entry.cleaner_id)
      .maybeSingle();
    if (!cleaner?.id) {
      return NextResponse.json({ error: "Cleaner not found" }, { status: 404 });
    }

    const role = await getProfileRoleForUser(user.id);
    const isAdmin = role === "admin";
    if (!isAdmin && cleaner.profile_id !== user.id) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    const { data: payout } = await svc
      .from("crew_payouts")
      .select(
        "id, status, amount_cents, base_cents, quality_bonus_cents, on_time_bonus_cents, currency, stripe_transfer_id, failure_reason, cleaner_id"
      )
      .eq("time_entry_id", timeEntryId)
      .maybeSingle();
    if (!payout?.id) {
      return NextResponse.json(
        { error: "Payout row missing for this time entry" },
        { status: 404 }
      );
    }
    if (payout.status === "paid") {
      return NextResponse.json({ ok: true, status: "paid", payoutId: payout.id });
    }

    const { data: profile } = await svc
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", cleaner.profile_id)
      .maybeSingle();

    const destination = profile?.stripe_connect_account_id?.trim() || null;
    if (!destination) {
      await svc
        .from("crew_payouts")
        .update({
          status: "awaiting_destination",
          failure_reason:
            "Missing Stripe Connect account. Ask admin to connect contractor account.",
        })
        .eq("id", payout.id);
      return NextResponse.json({
        ok: false,
        status: "awaiting_destination",
        payoutId: payout.id,
      });
    }

    const stripe = getStripe();
    if (!stripe) {
      await svc
        .from("crew_payouts")
        .update({
          status: "failed",
          failure_reason: "Stripe is not configured on server.",
        })
        .eq("id", payout.id);
      return NextResponse.json(
        { ok: false, status: "failed", error: "Stripe not configured" },
        { status: 400 }
      );
    }

    await svc
      .from("crew_payouts")
      .update({ status: "processing", failure_reason: null })
      .eq("id", payout.id);

    try {
      const transfer = await stripe.transfers.create(
        {
          amount: payout.amount_cents,
          currency: payout.currency || "usd",
          destination,
          metadata: {
            crew_payout_id: payout.id,
            time_entry_id: timeEntryId,
            cleaner_id: payout.cleaner_id,
            base_cents: String(payout.base_cents ?? payout.amount_cents),
            quality_bonus_cents: String(payout.quality_bonus_cents ?? 0),
            on_time_bonus_cents: String(payout.on_time_bonus_cents ?? 0),
          },
        },
        { idempotencyKey: `crew_payout_${payout.id}` }
      );

      await svc
        .from("crew_payouts")
        .update({
          status: "paid",
          stripe_transfer_id: transfer.id,
          paid_at: new Date().toISOString(),
          failure_reason: null,
        })
        .eq("id", payout.id);

      return NextResponse.json({
        ok: true,
        status: "paid",
        payoutId: payout.id,
        transferId: transfer.id,
      });
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : "Stripe transfer failed";
      await svc
        .from("crew_payouts")
        .update({
          status: "failed",
          failure_reason: msg.slice(0, 500),
        })
        .eq("id", payout.id);
      return NextResponse.json({ ok: false, status: "failed", error: msg }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Payout failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

