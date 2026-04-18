import Link from "next/link";
import { Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { MobileNav } from "@/components/mobile-nav";
import { SetupBanner } from "@/components/setup-banner";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/book", label: siteConfig.nav.book },
  { href: "/portal", label: siteConfig.nav.portal },
  { href: "/admin", label: siteConfig.nav.admin },
  { href: "/field", label: siteConfig.nav.field },
];

export async function SiteShell({
  children,
  cta,
}: {
  children: React.ReactNode;
  cta?: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                {l.label}
              </Link>
            ))}
          </nav>
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
        <p className="mt-3">
          <Link
            href="/field/demo"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Crew route demo
          </Link>
          <span className="text-muted-foreground"> — try stops &amp; checklist without saving</span>
        </p>
      </footer>
    </div>
  );
}
