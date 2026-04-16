"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/book", label: siteConfig.nav.book },
  { href: "/portal", label: siteConfig.nav.portal },
  { href: "/admin", label: siteConfig.nav.admin },
  { href: "/field", label: siteConfig.nav.field },
];

export function MobileNav({ userEmail }: { userEmail?: string | null }) {
  const [open, setOpen] = useState(false);
  const signedIn = Boolean(userEmail);

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
        {signedIn ? (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-primary">Signed in</p>
            <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
          </div>
        ) : null}
        <nav className="mt-6 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
            >
              {l.label}
            </Link>
          ))}
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
