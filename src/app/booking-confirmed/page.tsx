import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { BookingConfirmedDataLayer } from "@/components/conversion/data-layer";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { getStripeCheckoutSessionSummary } from "@/lib/stripe-session-summary";
import { formatUsd } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Booking confirmed",
  description: "Your payment went through. Continue to add arrival details for your crew.",
  robots: { index: false, follow: true },
};

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const sp = await searchParams;
  const sessionId = (sp.session_id ?? "").trim();
  const summary = sessionId ? await getStripeCheckoutSessionSummary(sessionId) : null;
  const valueUsd =
    summary?.amountCents != null ? Math.round((summary.amountCents / 100) * 100) / 100 : null;

  const onboardingHref =
    sessionId.startsWith("cs_") && sessionId
      ? `/onboarding?session_id=${encodeURIComponent(sessionId)}`
      : "/book";

  return (
    <SiteShell>
      {sessionId.startsWith("cs_") ? (
        <BookingConfirmedDataLayer
          sessionId={sessionId}
          valueUsd={valueUsd}
          currency="usd"
          customerEmail={summary?.customerEmail ?? null}
        />
      ) : null}

      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-6 flex justify-center">
          <Badge variant="secondary" className="text-sm">
            Paid
          </Badge>
        </div>
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Booking confirmed</CardTitle>
            <CardDescription className="text-base">
              {sessionId
                ? "Your spot is reserved. We sent a receipt to your email when payment finished."
                : "If you arrived here without finishing checkout, start a booking and you’ll return here after payment."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            {summary ? (
              <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-left text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Service:</span> {summary.visitLabel}
                </p>
                {summary.amountCents != null ? (
                  <p className="mt-1">
                    <span className="font-medium text-foreground">Total:</span>{" "}
                    {formatUsd(summary.amountCents)}
                  </p>
                ) : null}
                {summary.customerEmail ? (
                  <p className="mt-1">
                    <span className="font-medium text-foreground">Receipt:</span> {summary.customerEmail}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={onboardingHref}
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
              >
                {sessionId.startsWith("cs_") ? "Continue — arrival details" : "Book a clean"}
              </Link>
              <Link
                href="/portal"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
              >
                My account
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              Questions? Call{" "}
              <a className="font-medium text-primary" href={`tel:${siteConfig.supportPhoneTel}`}>
                {siteConfig.supportPhoneDisplay}
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
