import type { Metadata } from "next";
import Link from "next/link";
import { Building2, FileSpreadsheet, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Property management cleaning",
  description:
    "Portfolio-ready turnover cleaning for property managers — consistent quality, clear communication, and scalable scheduling across units.",
};

const points = [
  {
    title: "Portfolio scale",
    body: "Whether you manage a handful of units or dozens, we align on cadence, access, and expectations across your portfolio.",
    icon: Building2,
  },
  {
    title: "One point of contact",
    body: "We keep updates and issues routed so your team isn’t chasing threads across multiple systems.",
    icon: Users,
  },
  {
    title: "Operational clarity",
    body: "Checklist photos and documentation help you resolve issues faster and keep owners and residents aligned.",
    icon: FileSpreadsheet,
  },
];

const portfolioMailto = `mailto:?subject=${encodeURIComponent("Portfolio quote — Empire Cleaner")}&body=${encodeURIComponent(
  "Name:\nCompany:\n# of units / markets:\nDesired cadence:\nNotes:\n"
)}`;

export default function PropertyManagersPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Property managers</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Turnover cleaning for portfolios
          </h1>
          <p className="mt-3 text-muted-foreground">
            If you manage multiple units, you need repeatable quality and predictable communication —
            not one-off gigs that change week to week.
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
              <CardTitle className="text-lg">Next step</CardTitle>
              <CardDescription>
                Start with a portfolio quote request — include unit count, markets, and desired cadence.
                We’ll follow up by phone or email.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <a
                href={portfolioMailto}
                className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
              >
                Email a portfolio quote request
              </a>
              <Link href="/book" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}>
                Book a single turnover
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
          Hosting a single STR? Start on the{" "}
          <Link href="/hosts" className="font-medium text-primary underline-offset-4 hover:underline">
            Hosts & STR
          </Link>{" "}
          page.
        </p>
      </div>
    </SiteShell>
  );
}
