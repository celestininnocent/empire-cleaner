import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, getStripeEnvStatus } from "@/lib/stripe";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";
import { siteConfig } from "@/config/site";

type Body = { tier?: "basic" | "preferred" };

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: string }).message === "string") {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return "Stripe checkout failed";
}

const CLUB = {
  basic: {
    priceCents: 2900,
    label: "Empire Club — Basic",
    description:
      "Priority scheduling + member pricing + quarterly add-on credit.",
  },
  preferred: {
    priceCents: 4900,
    label: "Empire Club — Preferred",
    description:
      "Priority scheduling + 10% member pricing + add-on credits.",
  },
} as const;

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
    const tier = body.tier === "preferred" ? "preferred" : body.tier === "basic" ? "basic" : null;
    if (!tier) return NextResponse.json({ error: "tier must be basic or preferred." }, { status: 400 });

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
        { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to enable memberships." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const meta = {
      flow_type: "club",
      club_tier: tier,
      profile_id: user.id,
      supabase_user_id: user.id,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email ?? undefined,
      success_url: `${appUrl}/thank-you?club=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/club`,
      metadata: meta,
      subscription_data: {
        metadata: meta,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: CLUB[tier].priceCents,
            recurring: { interval: "month", interval_count: 1 },
            product_data: {
              name: `${siteConfig.businessName} — ${CLUB[tier].label}`,
              description: CLUB[tier].description,
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
    return NextResponse.json({ error: stripeErrorMessage(err) }, { status: 400 });
  }
}

