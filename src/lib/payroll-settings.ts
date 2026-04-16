/**
 * Crew pay rules — tune via env (restart dev server after changes).
 * NEXT_PUBLIC_COMMISSION_POOL_PERCENT — percent of job total that goes to the crew pool (default 20).
 * NEXT_PUBLIC_CREW_SPLIT_WAYS — how many people split that pool on a job (default 2).
 */

export function getCommissionPoolPercent(): number {
  const raw = process.env.NEXT_PUBLIC_COMMISSION_POOL_PERCENT;
  const n = raw != null && raw !== "" ? Number(raw) : 20;
  if (Number.isNaN(n) || n < 0 || n > 100) return 20;
  return n;
}

export function getCommissionPoolFraction(): number {
  return getCommissionPoolPercent() / 100;
}

export function getCrewSplitWays(): number {
  const raw = process.env.NEXT_PUBLIC_CREW_SPLIT_WAYS;
  const n = raw != null && raw !== "" ? Number(raw) : 2;
  if (Number.isNaN(n) || n < 1) return 2;
  return Math.floor(n);
}

export function commissionPerCleanerCents(
  jobTotalCents: number,
  teamSize?: number
): number {
  const ways = teamSize ?? getCrewSplitWays();
  if (ways <= 0) return 0;
  const pool = Math.floor(jobTotalCents * getCommissionPoolFraction());
  return Math.floor(pool / ways);
}

export function getQualityBonusCents(): number {
  const raw = process.env.NEXT_PUBLIC_QUALITY_BONUS_CENTS;
  const n = raw != null && raw !== "" ? Number(raw) : 500;
  if (Number.isNaN(n) || n < 0) return 500;
  return Math.floor(n);
}

export function getOnTimeBonusCents(): number {
  const raw = process.env.NEXT_PUBLIC_ON_TIME_BONUS_CENTS;
  const n = raw != null && raw !== "" ? Number(raw) : 300;
  if (Number.isNaN(n) || n < 0) return 300;
  return Math.floor(n);
}

export function getOnTimeWindowMinutes(): number {
  const raw = process.env.NEXT_PUBLIC_ON_TIME_WINDOW_MINUTES;
  const n = raw != null && raw !== "" ? Number(raw) : 20;
  if (Number.isNaN(n) || n < 1 || n > 180) return 20;
  return Math.floor(n);
}

export type CrewPayoutBreakdown = {
  base_cents: number;
  quality_bonus_cents: number;
  on_time_bonus_cents: number;
  total_cents: number;
  quality_qualified: boolean;
  on_time_qualified: boolean;
};

export function calculateCrewPayoutBreakdown(input: {
  jobTotalCents: number;
  teamSize?: number;
  qualityQualified: boolean;
  scheduledStartIso: string;
  clockInIso: string | null;
}): CrewPayoutBreakdown {
  const base = commissionPerCleanerCents(input.jobTotalCents, input.teamSize);
  const qualityBonus = input.qualityQualified ? getQualityBonusCents() : 0;
  const windowMinutes = getOnTimeWindowMinutes();

  const startMs = new Date(input.scheduledStartIso).getTime();
  const clockInMs = input.clockInIso ? new Date(input.clockInIso).getTime() : NaN;
  const onTimeQualified =
    Number.isFinite(startMs) &&
    Number.isFinite(clockInMs) &&
    clockInMs <= startMs + windowMinutes * 60_000;
  const onTimeBonus = onTimeQualified ? getOnTimeBonusCents() : 0;

  return {
    base_cents: base,
    quality_bonus_cents: qualityBonus,
    on_time_bonus_cents: onTimeBonus,
    total_cents: base + qualityBonus + onTimeBonus,
    quality_qualified: input.qualityQualified,
    on_time_qualified: onTimeQualified,
  };
}
