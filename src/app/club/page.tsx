import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { siteConfig } from "@/config/site";
import { ClubJoinButtons } from "@/components/club/club-join-buttons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Empire Club",
  description: "Membership perks for priority scheduling and member pricing.",
};

export default function ClubPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="secondary">Membership</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Empire Club
          </h1>
          <p className="mt-3 text-muted-foreground">
            Priority scheduling, member pricing, and perks that make your cleanings smoother.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="border-border/80 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Basic
                <span className="text-2xl font-semibold">$29</span>
              </CardTitle>
              <CardDescription>Best for occasional cleanings + VIP treatment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Priority scheduling</li>
                <li>Member pricing (5% off visits)</li>
                <li>Quarterly add-on credit</li>
                <li>Easy rescheduling</li>
              </ul>
              <ClubJoinButtons tier="basic" />
            </CardContent>
          </Card>

          <Card className="border-primary/25 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Preferred
                <span className="text-2xl font-semibold">$49</span>
              </CardTitle>
              <CardDescription>Our best value for recurring households.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Priority scheduling</li>
                <li>Member pricing (10% off visits)</li>
                <li>Add-on credits (monthly or every other month)</li>
                <li>Preferred recurring slot protection</li>
              </ul>
              <ClubJoinButtons tier="preferred" />
              <p className="text-xs text-muted-foreground">
                Questions? Call{" "}
                <a className="font-medium text-primary" href={`tel:${siteConfig.supportPhoneTel}`}>
                  {siteConfig.supportPhoneDisplay}
                </a>
                .
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <Card className="border-border/80 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
              <CardDescription>
                Membership is optional and billed monthly. Cancel anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>
                After joining, you’ll see your membership in <strong>My account</strong>. Dispatch uses it
                to prioritize scheduling and apply member pricing.
              </p>
              <p>
                If you don’t have an account yet, start by booking a clean. Membership checkout requires sign-in.
              </p>
              <Link
                href="/book"
                className={cn(buttonVariants({ variant: "outline" }), "mt-2 w-fit")}
              >
                Book a clean
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteShell>
  );
}

