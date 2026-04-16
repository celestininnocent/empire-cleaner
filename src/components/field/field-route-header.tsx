import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FieldRouteHeader({
  headline,
  sub,
  ctaHref,
  ctaLabel,
}: {
  headline: string;
  sub: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{headline}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
      </div>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
