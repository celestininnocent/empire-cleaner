/** Re-export pay math — see `payroll-settings.ts` for env-driven rules. */
export {
  calculateCrewPayoutBreakdown,
  commissionPerCleanerCents,
  getOnTimeBonusCents,
  getOnTimeWindowMinutes,
  getCommissionPoolFraction,
  getCommissionPoolPercent,
  getCrewSplitWays,
  getQualityBonusCents,
} from "./payroll-settings";
