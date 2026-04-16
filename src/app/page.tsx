import Link from "next/link";
import { CalendarClock, Home, MapPin, ShieldCheck, Sparkles, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-primary/[0.03]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {siteConfig.businessName}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {siteConfig.heroTitle}
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              {siteConfig.heroLead}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/book"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-auto min-h-12 px-8 py-3.5 text-base font-semibold tracking-tight shadow-lg shadow-primary/30 ring-2 ring-primary/25 transition hover:brightness-[1.03] hover:shadow-xl hover:shadow-primary/35 hover:ring-primary/40 active:scale-[0.98] sm:min-h-14 sm:px-10 sm:py-4 sm:text-lg"
                )}
              >
                Book a clean
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 pt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden />
                Secure checkout
              </span>
              <span className="inline-flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" aria-hidden />
                One visit or recurring plans
              </span>
              <span className="inline-flex items-center gap-2">
                <Users className="size-4 text-primary" aria-hidden />
                Professional cleaning teams
              </span>
            </div>
          </div>
          <div className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-xl shadow-primary/5">
            <div className="absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-primary/10 blur-2xl lg:block" />
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <Home className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Pricing that matches your space</p>
                  <p className="text-muted-foreground">
                    Bedrooms, baths, and square footage shape your quote — no surprises at checkout.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">When you want us there</p>
                  <p className="text-muted-foreground">
                    Book a single visit or set up weekly, bi-weekly, or monthly service — whatever works for you.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Local teams</p>
                  <p className="text-muted-foreground">
                    We send experienced cleaners to your address and keep you in the loop from booking to finish.
                  </p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Your account, your visits</p>
                  <p className="text-muted-foreground">
                    After you book, sign in anytime to see upcoming visits, updates, and who we are sending.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
