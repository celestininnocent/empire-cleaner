export type AddOnId =
  | "inside_fridge"
  | "inside_oven"
  | "interior_windows"
  | "laundry_fold"
  | "inside_cabinets";

export type AddOnOption = {
  id: AddOnId;
  label: string;
  description: string;
  addCents: number;
};

export const ADD_ONS: AddOnOption[] = [
  {
    id: "inside_fridge",
    label: "Inside fridge",
    description: "Wipe shelves and bins inside refrigerator.",
    addCents: 2500,
  },
  {
    id: "inside_oven",
    label: "Inside oven",
    description: "Degrease and detail inside oven interior.",
    addCents: 3000,
  },
  {
    id: "interior_windows",
    label: "Interior windows",
    description: "Detailed interior window and sill cleaning.",
    addCents: 4000,
  },
  {
    id: "laundry_fold",
    label: "Laundry fold",
    description: "Up to one standard load folded neatly.",
    addCents: 2000,
  },
  {
    id: "inside_cabinets",
    label: "Inside cabinets",
    description: "Wipe reachable cabinet interiors.",
    addCents: 3500,
  },
];

const ADD_ON_IDS = new Set<AddOnId>(ADD_ONS.map((a) => a.id));
const ADD_ON_PRICE_BY_ID = new Map<AddOnId, number>(ADD_ONS.map((a) => [a.id, a.addCents]));

export function isAddOnId(v: string): v is AddOnId {
  return ADD_ON_IDS.has(v as AddOnId);
}

export function normalizeAddOnIds(input: unknown): AddOnId[] {
  if (!Array.isArray(input)) return [];
  const unique = new Set<AddOnId>();
  for (const raw of input) {
    if (typeof raw !== "string") continue;
    if (!isAddOnId(raw)) continue;
    unique.add(raw);
  }
  return Array.from(unique);
}

export function getAddOnsTotalCents(addOnIds: AddOnId[]): number {
  return addOnIds.reduce((sum, id) => sum + (ADD_ON_PRICE_BY_ID.get(id) ?? 0), 0);
}

export function getAddOnLabel(id: AddOnId): string {
  return ADD_ONS.find((a) => a.id === id)?.label ?? id;
}
