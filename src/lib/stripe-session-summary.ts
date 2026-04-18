import { getStripe } from "@/lib/stripe";

export type StripeCheckoutSummary = {
  amountCents: number | null;
  customerEmail: string | null;
  paid: boolean;
  visitLabel: string;
};

function frequencyLabel(v: string | null | undefined): string {
  if (v === "weekly") return "Weekly recurring";
  if (v === "biweekly") return "Bi-weekly recurring";
  if (v === "monthly") return "Monthly recurring";
  return "One-time clean";
}

/** Used by onboarding and booking-confirmed (conversion) pages when `session_id` is present. */
export async function getStripeCheckoutSessionSummary(
  sessionId: string
): Promise<StripeCheckoutSummary | null> {
  const stripe = getStripe();
  if (!stripe || !sessionId.startsWith("cs_")) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return {
      amountCents: typeof session.amount_total === "number" ? session.amount_total : null,
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      paid: session.payment_status === "paid",
      visitLabel: frequencyLabel(session.metadata?.frequency),
    };
  } catch {
    return null;
  }
}
