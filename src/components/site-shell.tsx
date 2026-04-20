import Link from "next/link";
import { Phone, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { MobileNav } from "@/components/mobile-nav";
import { SetupBanner } from "@/components/setup-banner";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { getServerUser } from "@/lib/supabase/get-server-user";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Customer-first navigation only — team tools live in the footer. */
const primaryNav = [
  { href: "/book", label: siteConfig.nav.book },
  { href: "/hosts", label: siteConfig.nav.hosts },
  { href: "/property-managers", label: siteConfig.nav.propertyManagers },
  { href: "/portal", label: siteConfig.nav.portal },
];

export async function SiteShell({
  children,
  cta,
}: {
  children: React.ReactNode;
  cta?: React.ReactNode;
}) {
  const user = await getServerUser();
  const userEmail = user?.email ?? null;

  return (
    <div className="flex min-h-full flex-col">
      <SetupBanner />
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-primary">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <span className="hidden sm:inline">{siteConfig.businessName}</span>
          </Link>
          <nav
            className="hidden flex-1 flex-wrap items-center justify-center gap-x-0 gap-y-1 md:flex"
            aria-label="Main"
          >
            {primaryNav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "font-medium")}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <a
            href={`tel:${siteConfig.supportPhoneTel}`}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden shrink-0 items-center gap-1.5 font-semibold text-primary md:inline-flex"
            )}
          >
            <Phone className="size-4" aria-hidden />
            <span className="max-w-[9rem] truncate sm:max-w-none">{siteConfig.supportPhoneDisplay}</span>
          </a>
          <div className="flex items-center gap-2">
            <MobileNav userEmail={userEmail} />
            {cta ?? <AuthHeaderActions userEmail={userEmail} />}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border/80 py-10 text-center text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">{siteConfig.businessName}</span>
          <span className="text-muted-foreground"> · {siteConfig.footer}</span>
        </p>
        <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
            {siteConfig.legalTermsLink}
          </Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            {siteConfig.legalPrivacyLink}
          </Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <a
            href={`tel:${siteConfig.supportPhoneTel}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {siteConfig.supportPhoneDisplay}
          </a>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link href="/hosts" className="font-medium text-primary underline-offset-4 hover:underline">
            Hosts &amp; STR
          </Link>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <Link
            href="/property-managers"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Property managers
          </Link>
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{siteConfig.footerTeamToolsLead}</span>
          <span className="mx-1.5" aria-hidden>
            ·
          </span>
          <Link href="/admin" className="font-medium text-primary underline-offset-4 hover:underline">
            {siteConfig.nav.admin}
          </Link>
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          <Link href="/field" className="font-medium text-primary underline-offset-4 hover:underline">
            {siteConfig.nav.field}
          </Link>
          <span className="mx-1.5 text-border" aria-hidden>
            ·
          </span>
          <Link href="/field/demo" className="font-medium text-primary underline-offset-4 hover:underline">
            Crew route demo
          </Link>
          <span className="text-muted-foreground"> — sample route &amp; checklist</span>
        </p>
      </footer>
    </div>
  );
}
