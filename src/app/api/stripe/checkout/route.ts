import { NextResponse } from "next/server";
import { getStripe, getStripeEnvStatus } from "@/lib/stripe";
import { calculateJobPriceCents, calculatePerUnitJobPriceCents } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";
import { getPropertyTypeLabel } from "@/lib/property-types";
import { getServiceTierShortLabel } from "@/lib/service-tiers";
import { getAddOnLabel } from "@/lib/add-ons";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";
import { parseCheckoutBody } from "@/lib/security/validate-checkout-body";
import { getReferrerHost } from "@/lib/attribution";

const intervalMap = {
  weekly: { interval: "week" as const, interval_count: 1 },
  biweekly: { interval: "week" as const, interval_count: 2 },
  monthly: { interval: "month" as const, interval_count: 1 },
};

function stripeErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: string }).message === "string") {
    return (err as { message: string }).message;
  }
  if (err instanceof Error) return err.message;
  return "Stripe checkout failed";
}

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

    const parsed = parseCheckoutBody(raw);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const body = parsed.body;
    const attribution = body.attribution;
    const checkoutStartedAt = new Date().toISOString();
    const referrerHost = getReferrerHost(attribution.referrerUrl);
    const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 500);

    const unitCount = body.unitCount;
    const perUnitCents = calculatePerUnitJobPriceCents({
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      squareFootage: body.squareFootage,
      propertyType: body.propertyType,
      serviceTier: body.serviceTier,
      addOnIds: body.addOnIds,
    });
    const priceCents = calculateJobPriceCents({
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      squareFootage: body.squareFootage,
      propertyType: body.propertyType,
      serviceTier: body.serviceTier,
      addOnIds: body.addOnIds,
      unitCount,
    });

    if (!Number.isFinite(priceCents) || priceCents < 50) {
      return NextResponse.json(
        {
          error:
            "Price is too low for Stripe (minimum $0.50 USD). Increase rooms, baths, or square footage.",
        },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (!stripe) {
      if (getStripeEnvStatus() === "invalid_format") {
        return NextResponse.json(
          {
            error:
              "Invalid STRIPE_SECRET_KEY. Use a secret key (sk_live_ / sk_test_) or restricted key (rk_live_ / rk_test_) from Stripe Dashboard → Developers → API keys.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({
        demo: true,
        message:
          "Stripe is not configured. Set STRIPE_SECRET_KEY in .env.local to enable checkout.",
        redirectUrl: `${appUrl}/portal?demo=1`,
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const stripeCustomerEmail = (user?.email ?? body.customerEmail).trim();
    const isGuestCheckout = !user;
    const supabaseUserIdForMeta = user?.id ?? "";

    const bookingType = body.bookingType;
    const frequency = body.frequency;

    const typeLabel = getPropertyTypeLabel(body.propertyType);
    const tierShort = getServiceTierShortLabel(body.serviceTier);
    const unitSuffix = unitCount > 1 ? ` · ${unitCount} units` : "";
    const stripeDesc = `${tierShort} · ${typeLabel} · ${body.bedrooms} bed / ${body.bathrooms} bath · ${body.squareFootage} sq ft${unitSuffix}`;
    const addOnsSummary = body.addOnIds.length
      ? ` · Add-ons: ${body.addOnIds.map((id) => getAddOnLabel(id)).join(", ")}`
      : "";

    const phoneDigits = body.customerPhone.replace(/\D/g, "");

    const commonMeta = {
      supabase_user_id: supabaseUserIdForMeta,
      guest_checkout: isGuestCheckout ? "true" : "false",
      guest_email: body.customerEmail.slice(0, 320),
      guest_phone: phoneDigits.slice(0, 20),
      guest_full_name: body.customerFullName.slice(0, 200),
      bedrooms: String(body.bedrooms),
      bathrooms: String(body.bathrooms),
      square_footage: String(body.squareFootage),
      property_type: body.propertyType,
      service_tier: body.serviceTier,
      address: body.addressLine,
      city: body.city,
      state: body.state,
      zip: body.zip,
      scheduled_start: body.scheduledStart,
      price_cents: String(priceCents),
      per_unit_price_cents: String(perUnitCents),
      unit_count: String(unitCount),
      booking_type: bookingType,
      customer_notes: body.customerNotes || "",
      add_on_ids: body.addOnIds.join(","),
      checkout_started_at: checkoutStartedAt,
      utm_source: attribution.utmSource,
      utm_medium: attribution.utmMedium,
      utm_campaign: attribution.utmCampaign,
      utm_content: attribution.utmContent,
      utm_term: attribution.utmTerm,
      referrer_url: attribution.referrerUrl,
      referrer_host: referrerHost,
      landing_path: attribution.landingPath,
      user_agent: userAgent,
    };
    const stripeCustomText = {
      submit: {
        message: siteConfig.bookingStripeTrustMessage,
      },
    } as const;

    if (bookingType === "once") {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: stripeCustomerEmail || undefined,
        success_url: `${appUrl}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/book`,
        metadata: {
          ...commonMeta,
          frequency: "none",
        },
        custom_text: stripeCustomText,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${siteConfig.businessName} — One-time · ${tierShort} (${typeLabel})`,
                description: `${stripeDesc}${addOnsSummary}`.slice(0, 500),
              },
              unit_amount: perUnitCents,
            },
            quantity: unitCount,
          },
        ],
      });
      if (!session.url) {
        return NextResponse.json(
          { error: "Stripe did not return a checkout URL." },
          { status: 502 }
        );
      }
      return NextResponse.json({ url: session.url });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: stripeCustomerEmail || undefined,
      success_url: `${appUrl}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/book`,
      metadata: {
        ...commonMeta,
        frequency,
      },
      custom_text: stripeCustomText,
      subscription_data: {
        metadata: {
          frequency,
        },
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${siteConfig.businessName} — ${siteConfig.stripeProductLine} · ${tierShort} (${typeLabel})`,
              description: `${stripeDesc}${addOnsSummary}`.slice(0, 500),
            },
            unit_amount: perUnitCents,
            recurring: intervalMap[frequency],
          },
          quantity: unitCount,
        },
      ],
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 }
      );
    }
    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: stripeErrorMessage(err) },
      { status: 500 }
    );
  }
}
