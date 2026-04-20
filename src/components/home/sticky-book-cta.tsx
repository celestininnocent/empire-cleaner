"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Fixed bottom bar on small screens so the primary booking action stays one tap away. */
export function StickyBookCta({ label }: { label: string }) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t border-border/80 bg-background/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
      )}
    >
      <div className="mx-auto flex max-w-lg items-center justify-center px-4">
        <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "w-full max-w-md font-semibold shadow-md")}>
          {label}
        </Link>
      </div>
    </div>
  );
}
