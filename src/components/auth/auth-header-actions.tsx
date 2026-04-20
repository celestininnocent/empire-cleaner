"use client";

import Link from "next/link";
import { User } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function AuthHeaderActions({
  userEmail,
  presentation = "default",
}: {
  userEmail: string | null;
  /** On marketing pages, hide email & heavy “signed in” UI — keep the header brand-first. */
  presentation?: "default" | "marketing";
}) {
  if (!userEmail) {
    return (
      <>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden sm:inline-flex"
          )}
        >
          Sign in
        </Link>
        <Link
          href="/book"
          className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
        >
          Book a clean
        </Link>
      </>
    );
  }

  if (presentation === "marketing") {
    /* My account is already in the main nav — keep the utility row to one clear booking CTA. */
    return (
      <Link
        href="/book"
        className={cn(buttonVariants({ size: "default" }), "hidden font-semibold sm:inline-flex")}
      >
        Book a clean
      </Link>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "hidden h-9 max-w-[min(100%,240px)] gap-2 sm:inline-flex"
          )}
        >
          <User className="size-4 shrink-0" aria-hidden />
          <span className="truncate">{userEmail}</span>
          <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide">
            Signed in
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="text-xs text-muted-foreground">Signed in as</span>
            <p className="truncate text-sm font-medium text-foreground">{userEmail}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/admin" className="cursor-pointer" />}>
            {siteConfig.nav.admin}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/field" className="cursor-pointer" />}>
            {siteConfig.nav.field}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/portal" className="cursor-pointer" />}>
            {siteConfig.nav.portal}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SignOutButton
        variant="outline"
        size="sm"
        className="inline-flex shrink-0 sm:hidden"
        iconOnly
      />
      <SignOutButton
        variant="outline"
        size="sm"
        className="hidden sm:inline-flex"
        label="Sign out"
      />
      <Link
        href="/book"
        className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
      >
        Book a clean
      </Link>
    </>
  );
}
