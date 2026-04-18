import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Camera, KeyRound, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Short-term rental & Airbnb cleaning",
  description:
    "Turnover-ready cleaning for hosts and vacation rentals — clear communication, checklist photos, and dependable scheduling.",
};

const points = [
  {
    title: "Turnover windows",
    body: "We plan around check-out / check-in timing so your calendar stays predictable.",
    icon: CalendarClock,
  },
  {
    title: "Photo documentation",
    body: "Checklist proof helps you resolve issues faster and keep quality consistent guest-to-guest.",
    icon: Camera,
  },
  {
    title: "Access & notes",
    body: "Lockbox codes, parking, and unit quirks live with the job so crews arrive prepared.",
    icon: KeyRound,
  },
];

export default function HostsPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Hosts & STR</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Cleaning built for short-term rentals
          </h1>
          <p className="mt-3 text-muted-foreground">
            We support hosts who need fast turnovers, clear communication, and crews that show up
            prepared — whether it’s a studio or a full home.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {points.map((p) => {
            const Icon = p.icon;
            return (
            <Card key={p.title} className="border-border/80 shadow-sm">
              <CardHeader className="pb-2">
                <Icon className="size-9 rounded-lg bg-primary/10 p-2 text-primary" />
                <CardTitle className="text-base">{p.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{p.body}</CardContent>
            </Card>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <Card className="border-primary/25 bg-primary/[0.04] shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="size-5 text-primary" />
                Empire Club (optional)
              </CardTitle>
              <CardDescription>
                If you run frequent turnovers, membership can help with priority scheduling and member
                pricing. Not required to book.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}>
                Book a turnover
              </Link>
              <Link
                href="/club"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
              >
                View Empire Club
              </Link>
              <a
                href={`tel:${siteConfig.supportPhoneTel}`}
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "w-full sm:w-auto")}
              >
                Call {siteConfig.supportPhoneDisplay}
              </a>
            </CardContent>
          </Card>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          Have multiple units? We can route you to our property manager workflow — see{" "}
          <Link href="/property-managers" className="font-medium text-primary underline-offset-4 hover:underline">
            Property managers
          </Link>
          .
        </p>
      </div>
    </SiteShell>
  );
}
