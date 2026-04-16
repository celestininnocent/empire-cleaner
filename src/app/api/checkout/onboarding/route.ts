import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

type OnboardingBody = {
  sessionId?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  zip?: string;
  accessNotes?: string;
  petsNotes?: string;
  parkingNotes?: string;
  customerNotes?: string;
};

function trimLimit(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const originBlock = assertBrowserSameOriginPost(request);
    if (originBlock) return originBlock;

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const svc = createServiceRoleClient();
    if (!svc) {
      return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const body = (raw ?? {}) as OnboardingBody;
    const sessionId = trimLimit(body.sessionId, 200);
    if (!sessionId.startsWith("cs_")) {
      return NextResponse.json({ error: "Valid checkout session id is required." }, { status: 400 });
    }

    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
    if (!stripeSession || stripeSession.status !== "complete") {
      return NextResponse.json({ error: "Checkout is not complete yet." }, { status: 409 });
    }

    const { data: job } = await svc
      .from("jobs")
      .select("id, customer_id")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle();

    if (!job?.id || !job.customer_id) {
      return NextResponse.json(
        { error: "We are still finalizing your booking. Please try again in a few seconds." },
        { status: 409 }
      );
    }

    const addressLine = trimLimit(body.addressLine, 300);
    const city = trimLimit(body.city, 100);
    const state = trimLimit(body.state, 32);
    const zip = trimLimit(body.zip, 20);
    const accessNotes = trimLimit(body.accessNotes, 500);
    const petsNotes = trimLimit(body.petsNotes, 500);
    const parkingNotes = trimLimit(body.parkingNotes, 500);
    const customerNotes = trimLimit(body.customerNotes, 500);

    await svc
      .from("customers")
      .update({
        address_line: addressLine || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        access_notes: accessNotes || null,
        pets_notes: petsNotes || null,
        parking_notes: parkingNotes || null,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq("id", job.customer_id);

    if (customerNotes) {
      await svc.from("jobs").update({ customer_notes: customerNotes }).eq("id", job.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not save onboarding details.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
