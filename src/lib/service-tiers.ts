/**
 * Service level / intensity — multiplies the full quote after property-type pricing.
 * Tune multipliers for your market.
 */

export type ServiceTierId =
  | "standard"
  | "deep_clean"
  | "move_in_out"
  | "post_renovation";

export const SERVICE_TIERS: {
  id: ServiceTierId;
  label: string;
  shortLabel: string;
  description: string;
  /** Applied on top of beds/baths/sqft + property type */
  multiplier: number;
}[] = [
  {
    id: "standard",
    label: "Standard / maintenance clean",
    shortLabel: "Standard",
    description:
      "Regular upkeep — dust, vacuum, bathrooms, kitchen, surfaces. Best for recurring visits.",
    multiplier: 1,
  },
  {
    id: "deep_clean",
    label: "Deep clean",
    shortLabel: "Deep clean",
    description:
      "Extra detail: baseboards, inside appliances, grout, light fixtures, and heavy dusting.",
    multiplier: 1.42,
  },
  {
    id: "move_in_out",
    label: "Move-in / move-out",
    shortLabel: "Move in/out",
    description:
      "Empty or nearly empty home — cabinets, closets, and full wipe-down for handoff.",
    multiplier: 1.35,
  },
  {
    id: "post_renovation",
    label: "Post-renovation / construction dust",
    shortLabel: "Post-reno",
    description:
      "Fine dust, debris touch-up, and detail after contractors — allow extra time on site.",
    multiplier: 1.58,
  },
];

export function getServiceTierMultiplier(id: string | undefined): number {
  const row = SERVICE_TIERS.find((t) => t.id === id);
  return row?.multiplier ?? 1;
}

export function getServiceTierLabel(id: string | undefined): string {
  const row = SERVICE_TIERS.find((t) => t.id === id);
  return row?.label ?? "Standard / maintenance clean";
}

export function getServiceTierShortLabel(id: string | undefined): string {
  const row = SERVICE_TIERS.find((t) => t.id === id);
  return row?.shortLabel ?? "Standard";
}
