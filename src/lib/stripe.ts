import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Secret (sk_) or restricted (rk_) keys only — not publishable (pk_) or webhook (whsec_). */
const STRIPE_SECRET_KEY_RE = /^(sk|rk)_(live|test)_/;

export type StripeEnvStatus = "missing" | "invalid_format" | "ok";

export function getStripeEnvStatus(): StripeEnvStatus {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return "missing";
  if (!STRIPE_SECRET_KEY_RE.test(key)) return "invalid_format";
  return "ok";
}

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!STRIPE_SECRET_KEY_RE.test(key)) {
    console.error(
      "[stripe] STRIPE_SECRET_KEY must start with sk_live_, sk_test_, rk_live_, or rk_test_. " +
        "Use Developers → API keys (secret or restricted). Never use pk_ or whsec_ here."
    );
    return null;
  }
  if (!stripe) {
    stripe = new Stripe(key, {
      typescript: true,
    });
  }
  return stripe;
}
