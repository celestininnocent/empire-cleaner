/** Transparent pricing (USD cents). Property type applies a multiplier — see `property-types.ts`. */

import { getPropertyTypeMultiplier } from "./property-types";
import type { PropertyTypeId } from "./property-types";
import { getServiceTierMultiplier } from "./service-tiers";
import type { ServiceTierId } from "./service-tiers";
import { getAddOnsTotalCents } from "./add-ons";
import type { AddOnId } from "./add-ons";

const BASE_CENTS = 12_900; // $129
const PER_BEDROOM_CENTS = 2_500;
const PER_BATHROOM_CENTS = 1_800;

const SQFT_TIERS: { max: number; addCents: number }[] = [
  { max: 1500, addCents: 0 },
  { max: 2500, addCents: 4_500 },
  { max: 3500, addCents: 9_000 },
  /** Base add for 3501+ sq ft; see `extraSqftAddCents` for additional scale */
  { max: Infinity, addCents: 14_500 },
];

/** Per full 1,000 sq ft above 3,500 (removes a flat “ceiling” on huge homes). */
const SQFT_PER_1000_ABOVE_3500_CENTS = 600; // $6 / 1k sq ft

function extraSqftAddCents(sqft: number): number {
  if (sqft <= 3500) return 0;
  const blocks = Math.floor((sqft - 3500) / 1000);
  return blocks * SQFT_PER_1000_ABOVE_3500_CENTS;
}

export type BookingInput = {
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  /** Defaults to residential when omitted */
  propertyType?: PropertyTypeId | string;
  /** Defaults to standard maintenance when omitted */
  serviceTier?: ServiceTierId | string;
  /** Optional upsells/add-ons selected at booking */
  addOnIds?: AddOnId[];
};

/** Promo: discounted first clean to reduce first-time friction. */
export const INTRO_ONCE_PRICE_CENTS = 14_900; // $149
/** Recurring plans are priced below regular one-time rate. */
export const RECURRING_DISCOUNT_PERCENT = 15; // 15% off per visit

export function calculateJobPriceCents(input: BookingInput): number {
  const beds = Math.max(0, Math.min(10, Math.floor(input.bedrooms)));
  const baths = Math.max(1, Math.min(10, Math.floor(input.bathrooms)));
  const sqft = Math.max(500, Math.min(20000, Math.floor(input.squareFootage)));

  let sqftAdd = SQFT_TIERS[SQFT_TIERS.length - 1]!.addCents;
  for (const t of SQFT_TIERS) {
    if (sqft <= t.max) {
      sqftAdd = t.addCents;
      break;
    }
  }
  sqftAdd += extraSqftAddCents(sqft);

  const base =
    BASE_CENTS + beds * PER_BEDROOM_CENTS + baths * PER_BATHROOM_CENTS + sqftAdd;
  const propertyMult = getPropertyTypeMultiplier(input.propertyType);
  const tierMult = getServiceTierMultiplier(input.serviceTier);
  const scaled = Math.round(base * propertyMult * tierMult);
  const addOns = getAddOnsTotalCents(input.addOnIds ?? []);
  return scaled + addOns;
}

export function calculateIntroOncePriceCents(regularPriceCents: number): number {
  return Math.min(regularPriceCents, INTRO_ONCE_PRICE_CENTS);
}

export function calculateRecurringPriceCents(regularPriceCents: number): number {
  const discounted = Math.round(regularPriceCents * (1 - RECURRING_DISCOUNT_PERCENT / 100));
  return Math.max(50, discounted);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}
