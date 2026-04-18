import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { ThankYouDataLayer } from "@/components/conversion/data-layer";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Thank you",
  description: `Thank you for connecting with ${siteConfig.businessName}.`,
  robots: { index: false, follow: true },
};

function collectTrackingParams(
  sp: Record<string, string | string[] | undefined>
): Record<string, string> {
  const out: Record<string, string> = {};
  const keys = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "fbclid",
    "msclkid",
    "ttclid",
    "source",
    "ref",
  ];
  for (const k of keys) {
    const v = sp[k];
    if (typeof v === "string" && v.trim()) {
      out[k] = v.trim().slice(0, 500);
    }
  }
  return out;
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const trackingParams = collectTrackingParams(sp);

  return (
    <SiteShell>
      <ThankYouDataLayer trackingParams={trackingParams} />

      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-24">
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Thank you</CardTitle>
            <CardDescription className="text-base">
              We received your message. If you were booking a clean, you can continue below — otherwise
              we’ll be in touch shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
              Book a clean
            </Link>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
              Back home
            </Link>
          </CardContent>
        </Card>
      </div>
    </SiteShell>
  );
}
