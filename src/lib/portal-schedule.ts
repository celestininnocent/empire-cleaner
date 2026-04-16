/** Customer portal — next visit line and subscription-aware scheduling helpers. */

export type PortalJobLike = {
  scheduled_start: string;
  status: string;
};

export type PortalScheduleLike = {
  next_service_at: string | null;
};

const TERMINAL: Record<string, true> = { completed: true, cancelled: true };

/**
 * Earliest upcoming visit: open jobs from `jobs`, else `next_service_at` on active recurring rows.
 */
export function computeNextCleaningIso(options: {
  jobs: PortalJobLike[];
  recurringSchedules: PortalScheduleLike[];
}): string | null {
  const hasRecurring = options.recurringSchedules.length > 0;
  const now = Date.now();
  const skewMs = 60 * 60 * 1000;

  const fromJobs = [...options.jobs]
    .filter((j) => !TERMINAL[j.status])
    .filter((j) => {
      const t = new Date(j.scheduled_start).getTime();
      return Number.isFinite(t) && t >= now - skewMs;
    })
    .sort(
      (a, b) =>
        new Date(a.scheduled_start).getTime() -
        new Date(b.scheduled_start).getTime()
    );

  if (fromJobs.length) {
    return new Date(fromJobs[0]!.scheduled_start).toISOString();
  }

  if (!hasRecurring) return null;

  const times = options.recurringSchedules
    .map((s) => s.next_service_at)
    .filter((t): t is string => Boolean(t))
    .map((t) => new Date(t).getTime())
    .filter((t) => Number.isFinite(t) && t >= now - skewMs);

  if (!times.length) return null;
  return new Date(Math.min(...times)).toISOString();
}

/** e.g. "Friday at 10:00 AM" in the user locale */
export function formatNextCleaningLine(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const weekday = d.toLocaleDateString(undefined, { weekday: "long" });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${weekday} at ${time}`;
}

export function formatBillingFrequencyLabel(
  f: string | null | undefined
): string | null {
  if (f === "weekly") return "Weekly";
  if (f === "biweekly") return "Bi-weekly";
  if (f === "monthly") return "Monthly";
  return null;
}
