import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Home,
  Lock,
  MapPin,
  Quote,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { HomeHeroVisual } from "@/components/home/home-hero-visual";
import { StickyBookCta } from "@/components/home/sticky-book-cta";
import { SiteShell } from "@/components/site-shell";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <p className="text-amber-500" aria-label={`${count} out of 5 stars`}>
      {"★".repeat(count)}
    </p>
  );
}

export default function HomePage() {
  const faqItems = siteConfig.homeFaq;
  const googleReviewUrl = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL?.trim();
  const whatsIncluded = [...siteConfig.homeWhatsIncludedItems];
  const checklistItems = [...siteConfig.homeChecklistSampleItems];

  const trustBadges = [
    { icon: ShieldCheck, label: siteConfig.homeTrustInsured },
    { icon: UserCheck, label: siteConfig.homeTrustBackgroundChecked },
    { icon: BadgeCheck, label: siteConfig.homeTrustGuaranteeShort },
    { icon: Lock, label: siteConfig.homeTrustCheckout },
  ];

  const statGoogle = (
    <div className="rounded-xl border border-border/80 bg-card/90 p-3 text-center shadow-sm">
      <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
        {siteConfig.homeTrustStatGoogleValue}
        <span className="text-amber-500">★</span>
      </p>
      <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{siteConfig.homeTrustStatGoogleLabel}</p>
      <p className="text-[10px] text-muted-foreground">{siteConfig.homeTrustStatGoogleSub}</p>
    </div>
  );

  return (
    <SiteShell marketingHeader>
      <div className="pb-24 md:pb-0">
        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-background via-background to-primary/[0.03]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:gap-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-start lg:gap-14 lg:py-24">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                  {siteConfig.businessName} · Portland area
                </p>
                <p className="text-xs font-medium text-muted-foreground">{siteConfig.heroLocalLine}</p>
              </div>
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {siteConfig.heroTitle}
              </h1>
              <p className="max-w-xl text-pretty text-lg text-muted-foreground">{siteConfig.heroLead}</p>
              <div className="flex max-w-xl flex-wrap gap-2 pt-1">
                {[siteConfig.heroAudienceChip1, siteConfig.heroAudienceChip2, siteConfig.heroAudienceChip3].map(
                  (label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full border border-border/80 bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {label}
                    </span>
                  )
                )}
              </div>
              <p className="max-w-xl text-xs text-muted-foreground">{siteConfig.heroAudienceFoot}</p>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {googleReviewUrl ? (
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-center shadow-sm ring-1 ring-primary/10 transition hover:bg-primary/[0.07]"
                  >
                    <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
                      {siteConfig.homeTrustStatGoogleValue}
                      <span className="text-amber-500">★</span>
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                      {siteConfig.homeTrustStatGoogleLabel}
                    </p>
                    <p className="text-[10px] text-primary underline-offset-2 hover:underline">
                      {siteConfig.homeTrustStatGoogleSub}
                    </p>
                  </a>
                ) : (
                  statGoogle
                )}
                <div className="rounded-xl border border-border/80 bg-card/90 p-3 text-center shadow-sm">
                  <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
                    {siteConfig.homeTrustStatCleansValue}
                  </p>
                  <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
                    {siteConfig.homeTrustStatCleansLabel}
                  </p>
                </div>
                <div className="rounded-xl border border-border/80 bg-card/90 p-3 text-center shadow-sm">
                  <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
                    {siteConfig.homeTrustStatRecurringValue}
                  </p>
                  <p className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
                    {siteConfig.homeTrustStatRecurringLabel}
                  </p>
                </div>
              </div>
              <figure className="rounded-2xl border border-primary/20 bg-card p-4 shadow-sm">
                <StarRating />
                <blockquote className="mt-2 text-pretty text-sm font-medium leading-relaxed text-foreground">
                  “{siteConfig.heroTestimonialQuote}”
                </blockquote>
                <figcaption className="mt-3 flex flex-wrap items-baseline gap-x-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{siteConfig.heroTestimonialName}</span>
                  <span>· {siteConfig.heroTestimonialDetail}</span>
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {siteConfig.heroTestimonialSource}
                  </span>
                </figcaption>
              </figure>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href="/book"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "inline-flex h-auto min-h-12 w-full justify-center px-10 py-4 text-base font-semibold shadow-lg shadow-primary/30 ring-2 ring-primary/25 transition hover:brightness-[1.03] hover:shadow-xl sm:w-auto sm:min-w-[220px] sm:px-12 sm:text-lg"
                  )}
                >
                  Book a clean
                </Link>
              </div>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {siteConfig.heroCallLineBeforePhone}{" "}
                <a
                  href={`tel:${siteConfig.supportPhoneTel}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {siteConfig.supportPhoneDisplay}
                </a>{" "}
                {siteConfig.heroCallLineAfterPhone}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {trustBadges.map(({ icon: Icon, label }) => (
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
          <HomeHeroVisual />
        </section>

        <section className="border-b border-border/60 bg-muted/15 py-12 sm:py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{siteConfig.homeWhyChooseTitle}</h2>
              <p className="mt-2 text-pretty text-muted-foreground">{siteConfig.homeWhyChooseLead}</p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Zap,
                  title: siteConfig.homeWhyChoose1Title,
                  body: siteConfig.homeWhyChoose1Body,
                },
                {
                  icon: ShieldCheck,
                  title: siteConfig.homeWhyChoose2Title,
                  body: siteConfig.homeWhyChoose2Body,
                },
                {
                  icon: CalendarClock,
                  title: siteConfig.homeWhyChoose3Title,
                  body: siteConfig.homeWhyChoose3Body,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
                >
                  <item.icon className="size-8 text-primary" aria-hidden />
                  <p className="mt-3 font-semibold text-foreground">{item.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                </div>
              ))}
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

        <section className="border-b border-border/60 bg-gradient-to-b from-primary/[0.06] to-background py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {siteConfig.homeSocialProofTitle}
              </h2>
              <p className="mt-3 text-pretty text-muted-foreground">{siteConfig.homeSocialProofLead}</p>
              {googleReviewUrl ? (
                <p className="mt-3">
                  <a
                    href={googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Read reviews on Google
                  </a>
                </p>
              ) : null}
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <figure className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <Quote className="absolute right-4 top-4 size-8 text-primary/15" aria-hidden />
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating />
                  <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wide">
                    {siteConfig.homeSocialProofServiceTag1}
                  </Badge>
                </div>
                <blockquote className="mt-2 text-pretty text-sm leading-relaxed text-foreground">
                  “{siteConfig.homeSocialProofQuote1}”
                </blockquote>
                <figcaption className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{siteConfig.homeSocialProofAttribution1}</span>
                  <span className="w-fit rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {siteConfig.homeSocialProofSourceGoogle}
                  </span>
                </figcaption>
              </figure>
              <figure className="relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <Quote className="absolute right-4 top-4 size-8 text-primary/15" aria-hidden />
                <div className="flex flex-wrap items-center gap-2">
                  <StarRating />
                  <Badge variant="secondary" className="text-[10px] font-normal uppercase tracking-wide">
                    {siteConfig.homeSocialProofServiceTag2}
                  </Badge>
                </div>
                <blockquote className="mt-2 text-pretty text-sm leading-relaxed text-foreground">
                  “{siteConfig.homeSocialProofQuote2}”
                </blockquote>
                <figcaption className="mt-4 flex flex-col gap-1 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{siteConfig.homeSocialProofAttribution2}</span>
                  <span className="w-fit rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {siteConfig.homeSocialProofSourceGoogle}
                  </span>
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{siteConfig.homeServiceAreaTitle}</h2>
              <p className="mt-2 text-pretty text-muted-foreground">{siteConfig.homeServiceAreaLead}</p>
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{siteConfig.homeServiceAreaCardTitle}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {siteConfig.homeServiceAreaCities}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                <p className="font-semibold text-foreground">{siteConfig.homeVisualProofChecklistTitle}</p>
                <p className="mt-1 text-sm text-muted-foreground">{siteConfig.homeVisualProofChecklistSub}</p>
                <ul className="mt-4 space-y-2">
                  {checklistItems.map((line) => (
                    <li
                      key={line}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <CheckCircle2 className="size-4 shrink-0 text-primary" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border/60 bg-muted/15 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{siteConfig.homeWhatsIncludedTitle}</h2>
                <p className="mt-3 text-pretty text-muted-foreground">{siteConfig.homeWhatsIncludedIntro}</p>
                <ul className="mt-6 space-y-2.5">
                  {whatsIncluded.map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-relaxed text-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
                <h2 className="text-xl font-semibold tracking-tight">{siteConfig.homeVsIndependentsTitle}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{siteConfig.homeVsIndependentsBody}</p>
              </div>
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
            <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
              {siteConfig.homeFaqSubtitle}
            </p>
            <div className="mt-8 space-y-5">
              {faqItems.map((item) => (
                <div
                  key={item.q}
                  className="rounded-xl border border-border/80 bg-card p-5 shadow-sm"
                >
                  <h3 className="text-base font-semibold leading-snug text-foreground">{item.q}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    <FaqAnswer text={item.a} />
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">
              {siteConfig.homeFaqFooterNote}{" "}
              <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>
            </p>
            <div className="mt-8 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.07] to-background p-6 shadow-sm sm:p-8">
              <p className="text-center text-lg font-semibold text-foreground">{siteConfig.homeStillUnsureTitle}</p>
              <p className="mx-auto mt-1 max-w-md text-center text-sm text-muted-foreground">
                {siteConfig.homeStillUnsureLead}
              </p>
              <div className="mx-auto mt-5 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={`tel:${siteConfig.supportPhoneTel}`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full justify-center sm:w-auto sm:min-w-[200px]"
                  )}
                >
                  Call {siteConfig.supportPhoneDisplay}
                </a>
                <Link
                  href="/book"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full justify-center font-semibold sm:w-auto sm:min-w-[200px]"
                  )}
                >
                  {siteConfig.homeStickyCtaLabel}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <StickyBookCta label={siteConfig.homeStickyCtaLabel} />
    </SiteShell>
  );
}
