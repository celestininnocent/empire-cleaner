import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { formatUsd } from "@/lib/pricing";
import { getStripe } from "@/lib/stripe";

type StripeSummary = {
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

async function getStripeSummary(sessionId: string): Promise<StripeSummary | null> {
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

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = (sp.session_id ?? "").trim();
  const stripeSummary = await getStripeSummary(sessionId);

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-4 py-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Step 2 of 2</p>
            <p className="text-xs text-muted-foreground">Finalize arrival details for your first visit.</p>
          </div>
          <Badge variant="secondary">Booking confirmed</Badge>
        </div>
        <Card className="border-border/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">One quick step before we dispatch</CardTitle>
            <CardDescription>
              Your booking is paid. Confirm details below so your crew arrives prepared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 rounded-lg border border-border/70 bg-muted/40 p-4">
              <p className="text-sm font-medium text-foreground">Your booking is confirmed</p>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <p>Service: {stripeSummary?.visitLabel ?? "Pending confirmation"}</p>
                <p>
                  Total charged:{" "}
                  {stripeSummary?.amountCents != null ? formatUsd(stripeSummary.amountCents) : "Shown on receipt"}
                </p>
                <p>Email receipt: {stripeSummary?.customerEmail ?? "Sent to booking email"}</p>
                <p>Payment status: {stripeSummary?.paid ? "Paid" : "Processing"}</p>
              </div>
            </div>
            <Separator className="mb-6" />
            <OnboardingForm />
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
