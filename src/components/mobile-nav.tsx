"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Menu, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/book", label: siteConfig.nav.book },
  { href: "/hosts", label: siteConfig.nav.hosts },
  { href: "/property-managers", label: siteConfig.nav.propertyManagers },
  { href: "/portal", label: siteConfig.nav.portal },
];

export function MobileNav({
  userEmail,
  presentation = "default",
}: {
  userEmail?: string | null;
  presentation?: "default" | "marketing";
}) {
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(userEmail);
  const marketing = presentation === "marketing";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon-sm" }),
          "md:hidden"
        )}
        aria-label="Open menu"
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(100%,280px)]">
        <SheetHeader>
          <SheetTitle className="text-left">{siteConfig.businessName}</SheetTitle>
        </SheetHeader>
        {signedIn && !marketing ? (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary">Signed in</p>
            <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
          </div>
        ) : null}
        {signedIn && marketing ? (
          <p className="mt-4 px-3 text-xs text-muted-foreground">You’re signed in — manage visits in My account.</p>
        ) : null}
        <nav className="mt-6 flex flex-col gap-1">
          {primaryNav.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
          <a
            href={`tel:${siteConfig.supportPhoneTel}`}
            onClick={() => setOpen(false)}
            className="mt-2 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3 text-sm font-semibold text-primary hover:bg-primary/10"
          >
            <Phone className="size-4 shrink-0" aria-hidden />
            {siteConfig.supportPhoneDisplay}
          </a>
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-3 text-sm font-semibold text-foreground hover:bg-muted/50"
          >
            <Mail className="size-4 shrink-0 text-primary" aria-hidden />
            {siteConfig.supportEmail}
          </a>
          {signedIn ? (
            <SignOutButton
              className="mt-2 w-full justify-center"
              variant="outline"
              label="Sign out"
              afterSignOut={() => setOpen(false)}
            />
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              Sign in
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
