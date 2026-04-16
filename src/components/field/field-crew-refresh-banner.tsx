"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

/** Shown when the user is signed in but we still don’t have a `cleaners.team_id` — keeps /field looking like the live app, not an error page. */
export function FieldCrewRefreshBanner({ show }: { show: boolean }) {
  const router = useRouter();
  if (!show) return null;
  return (
    <div className="mb-5 space-y-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 flex-1 leading-snug">{siteConfig.fieldPendingCrewBanner}</p>
        <Button type="button" variant="secondary" size="sm" className="shrink-0" onClick={() => router.refresh()}>
          {siteConfig.fieldPendingCrewRefresh}
        </Button>
      </div>
      <p className="text-xs opacity-90">
        Need help? Call{" "}
        <a
          href={`tel:${siteConfig.supportPhoneTel}`}
          className="font-medium underline underline-offset-2 hover:opacity-100"
        >
          {siteConfig.supportPhoneDisplay}
        </a>
      </p>
    </div>
  );
}
