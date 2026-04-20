import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TERMS = "Terms of Service";

function FaqAnswer({ text }: { text: string }) {
  if (!text.includes(TERMS)) {
    return <>{text}</>;
  }
  const parts = text.split(TERMS);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 ? (
            <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
              {TERMS}
            </Link>
          ) : null}
        </span>
      ))}
    </>
  );
}

export default function HomePage() {
  const faqItems = siteConfig.homeFaq;

  return (
    <SiteShell>
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-primary/[0.03]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-start lg:gap-14 lg:py-24">
          <div className="space-y-6">
            <p className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              {siteConfig.businessName} · Portland area
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {siteConfig.heroTitle}
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">{siteConfig.heroLead}</p>
            <p className="max-w-xl border-l-2 border-primary/35 pl-4 text-sm font-medium leading-relaxed text-foreground/90">
              {siteConfig.heroTrustLine}
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
              <a
                href={`tel:${siteConfig.supportPhoneTel}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-auto min-h-12 px-6 py-3.5 text-base sm:min-h-14 sm:px-8 sm:py-4"
                )}
              >
                Call {siteConfig.supportPhoneDisplay}
              </a>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { icon: ShieldCheck, label: siteConfig.homeTrustInsured },
                { icon: BadgeCheck, label: siteConfig.homeTrustGuaranteeShort },
                { icon: MapPin, label: siteConfig.homeTrustLocal },
                { icon: CheckCircle2, label: siteConfig.homeTrustCheckout },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm"
                >
                  <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl border border-border/80 bg-card p-6 shadow-xl shadow-primary/5">
            <div className="absolute -right-6 -top-6 hidden h-24 w-24 rounded-full bg-primary/10 blur-2xl lg:block" />
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <Home className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">{siteConfig.homeFeatureQuoteTitle}</p>
                  <p className="text-muted-foreground">{siteConfig.homeFeatureQuoteBody}</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <CalendarClock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">{siteConfig.homeFeatureScheduleTitle}</p>
                  <p className="text-muted-foreground">{siteConfig.homeFeatureScheduleBody}</p>
                </div>
              </li>
              <li className="flex gap-3 rounded-2xl bg-muted/40 p-4">
                <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">{siteConfig.homeFeatureManageTitle}</p>
                  <p className="text-muted-foreground">{siteConfig.homeFeatureManageBody}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-b border-border/60 bg-muted/20 py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{siteConfig.homePathsTitle}</h2>
            <p className="mt-2 text-muted-foreground">{siteConfig.homePathsLead}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <Card className="border-border/80 shadow-sm transition hover:border-primary/25 hover:shadow-md">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Home className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{siteConfig.homePathHomeTitle}</CardTitle>
                <CardDescription className="text-pretty">{siteConfig.homePathHomeBody}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/book"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "inline-flex w-full items-center justify-center gap-2"
                  )}
                >
                  {siteConfig.homePathHomeCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm transition hover:border-primary/25 hover:shadow-md">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{siteConfig.homePathHostsTitle}</CardTitle>
                <CardDescription className="text-pretty">{siteConfig.homePathHostsBody}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/hosts"
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "inline-flex w-full items-center justify-center gap-2"
                  )}
                >
                  {siteConfig.homePathHostsCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-sm transition hover:border-primary/25 hover:shadow-md">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardList className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-lg">{siteConfig.homePathPmTitle}</CardTitle>
                <CardDescription className="text-pretty">{siteConfig.homePathPmBody}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href="/property-managers"
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "inline-flex w-full items-center justify-center gap-2"
                  )}
                >
                  {siteConfig.homePathPmCta}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{siteConfig.homeProcessTitle}</h2>
            <p className="mt-2 text-muted-foreground">{siteConfig.homeProcessLead}</p>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                step: "1",
                title: siteConfig.homeProcess1Title,
                body: siteConfig.homeProcess1Body,
              },
              {
                step: "2",
                title: siteConfig.homeProcess2Title,
                body: siteConfig.homeProcess2Body,
              },
              {
                step: "3",
                title: siteConfig.homeProcess3Title,
                body: siteConfig.homeProcess3Body,
              },
            ].map((item) => (
              <li
                key={item.step}
                className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
              >
                <span className="mb-3 flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {item.step}
                </span>
                <p className="font-semibold text-foreground">{item.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex justify-center">
            <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "min-w-[200px]")}>
              Get your quote
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/15 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            {siteConfig.homeFaqTitle}
          </h2>
          <div className="mt-8 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm open:ring-1 open:ring-primary/15"
              >
                <summary className="cursor-pointer list-none font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <ChevronDown
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:-rotate-180"
                      aria-hidden
                    />
                  </span>
                </summary>
                <p className="mt-3 border-t border-border/60 pt-3 text-sm leading-relaxed text-muted-foreground">
                  <FaqAnswer text={item.a} />
                </p>
              </details>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Still unsure?{" "}
            <a href={`tel:${siteConfig.supportPhoneTel}`} className="font-medium text-primary underline-offset-4 hover:underline">
              Call {siteConfig.supportPhoneDisplay}
            </a>{" "}
            or{" "}
            <Link href="/book" className="font-medium text-primary underline-offset-4 hover:underline">
              start a booking
            </Link>
            .
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
