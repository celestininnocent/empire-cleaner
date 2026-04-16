/** Where we clean — drives price multiplier (tune multipliers to your market). */

export type PropertyTypeId =
  | "residential"
  | "office"
  | "retail"
  | "gym"
  | "medical"
  | "other_commercial";

export const PROPERTY_TYPES: {
  id: PropertyTypeId;
  label: string;
  shortLabel: string;
  description: string;
  /** Applied to the full calculated base price (1 = no change) */
  multiplier: number;
}[] = [
  {
    id: "residential",
    label: "Home / apartment",
    shortLabel: "Residential",
    description: "Houses, condos, apartments",
    multiplier: 1,
  },
  {
    id: "office",
    label: "Office",
    shortLabel: "Office",
    description: "Desk space, conference rooms, break areas",
    multiplier: 1.2,
  },
  {
    id: "retail",
    label: "Retail store",
    shortLabel: "Retail",
    description: "Shop floor, stockroom, fitting rooms",
    multiplier: 1.25,
  },
  {
    id: "gym",
    label: "Gym / fitness",
    shortLabel: "Gym",
    description: "Equipment, locker rooms, studios",
    multiplier: 1.15,
  },
  {
    id: "medical",
    label: "Medical / dental",
    shortLabel: "Medical",
    description: "Exam rooms, waiting areas — extra care",
    multiplier: 1.2,
  },
  {
    id: "other_commercial",
    label: "Other commercial",
    shortLabel: "Commercial",
    description: "Salon, warehouse, studio, etc.",
    multiplier: 1.15,
  },
];

export function getPropertyTypeMultiplier(id: string | undefined): number {
  const row = PROPERTY_TYPES.find((p) => p.id === id);
  return row?.multiplier ?? 1;
}

export function getPropertyTypeLabel(id: string | undefined): string {
  const row = PROPERTY_TYPES.find((p) => p.id === id);
  return row?.shortLabel ?? "Residential";
}
