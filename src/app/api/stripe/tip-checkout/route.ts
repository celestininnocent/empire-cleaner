import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripeEnvStatus } from "@/lib/stripe";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

type Body = {
  jobId?: string;
  amountCents?: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const originBlock = assertBrowserSameOriginPost(request);
    if (originBlock) return originBlock;

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const body = (raw ?? {}) as Body;
    const jobId = body.jobId?.trim() ?? "";
    const amountCents = Number(body.amountCents);

    if (!UUID_RE.test(jobId)) {
      return NextResponse.json({ error: "Valid jobId required" }, { status: 400 });
    }
    if (!Number.isFinite(amountCents) || !Number.isInteger(amountCents) || amountCents < 100) {
      return NextResponse.json({ error: "Tip must be at least $1." }, { status: 400 });
    }
    if (amountCents > 100_000) {
      return NextResponse.json({ error: "Tip exceeds max allowed." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!customer?.id) {
      return NextResponse.json({ error: "Customer profile not found." }, { status: 403 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("id, customer_id, address_line")
      .eq("id", jobId)
      .maybeSingle();
    if (!job?.id) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (job.customer_id !== customer.id) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    if (!stripe) {
      if (getStripeEnvStatus() === "invalid_format") {
        return NextResponse.json(
          {
            error:
              "Invalid STRIPE_SECRET_KEY. Use a secret key (sk_live_ / sk_test_) or restricted key (rk_live_ / rk_test_).",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable tips." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email ?? undefined,
      success_url: `${appUrl}/portal?tip_paid=1`,
      cancel_url: `${appUrl}/portal`,
      metadata: {
        flow_type: "tip",
        job_id: job.id,
        profile_id: user.id,
        amount_cents: String(amountCents),
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: {
              name: "Crew tip",
              description: `Tip for service at ${job.address_line}`,
            },
          },
        },
      ],
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
    }
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not create tip checkout.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
