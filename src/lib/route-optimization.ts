import { haversineMiles } from "@/lib/geo";

/** Any job row that has schedule + optional geocode for routing. */
export type RoutableJob = {
  id: string;
  scheduled_start: string;
  lat: number | null;
  lng: number | null;
};

function isNonDecreasingBySchedule(jobs: { scheduled_start: string }[]): boolean {
  for (let i = 1; i < jobs.length; i++) {
    const a = new Date(jobs[i - 1]!.scheduled_start).getTime();
    const b = new Date(jobs[i]!.scheduled_start).getTime();
    if (b < a) return false;
  }
  return true;
}

/** Greedy nearest-neighbor from depot through all given jobs (must have coords). */
function nearestNeighborOrder<T extends RoutableJob>(
  jobs: T[],
  depot: { lat: number; lng: number }
): T[] {
  if (jobs.length === 0) return [];
  const remaining = [...jobs];
  const ordered: T[] = [];
  let curLat = depot.lat;
  let curLng = depot.lng;
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const j = remaining[i]!;
      const d = haversineMiles(curLat, curLng, j.lat!, j.lng!);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0]!;
    ordered.push(next);
    curLat = next.lat!;
    curLng = next.lng!;
  }
  return ordered;
}

/** Approximate road distance as straight-line miles: depot → each coord job in order (skips unknown coords). */
export function estimateRouteMiles<T extends RoutableJob>(
  jobs: T[],
  depot: { lat: number; lng: number }
): number | null {
  const pts = jobs.filter((j): j is T & { lat: number; lng: number } => j.lat != null && j.lng != null);
  if (pts.length === 0) return null;
  let miles = 0;
  let curLat = depot.lat;
  let curLng = depot.lng;
  for (const j of pts) {
    miles += haversineMiles(curLat, curLng, j.lat, j.lng);
    curLat = j.lat;
    curLng = j.lng;
  }
  return Math.round(miles * 10) / 10;
}

export type RouteOptimizationResult<T extends RoutableJob> = {
  appointmentOrder: T[];
  driveOrder: T[];
  defaultMode: "appointment" | "drive";
  /** True when drive order keeps scheduled_start non-decreasing */
  driveMatchesAppointments: boolean;
  milesAppointment: number | null;
  milesDrive: number | null;
  /** Show toggle (two distinct orders worth comparing) */
  optimizerAvailable: boolean;
};

/**
 * Builds a **shorter-drive** stop order (nearest-neighbor from crew base) vs **appointment** order.
 * Defaults to drive order only when it also respects appointment times; otherwise defaults to time order.
 */
export function computeRouteOrders<T extends RoutableJob>(
  jobs: T[],
  depot: { lat: number; lng: number } | null
): RouteOptimizationResult<T> {
  const appointmentOrder = [...jobs].sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  );

  if (!depot || jobs.length < 2) {
    return {
      appointmentOrder,
      driveOrder: appointmentOrder,
      defaultMode: "appointment",
      driveMatchesAppointments: true,
      milesAppointment: depot ? estimateRouteMiles(appointmentOrder, depot) : null,
      milesDrive: depot ? estimateRouteMiles(appointmentOrder, depot) : null,
      optimizerAvailable: false,
    };
  }

  const withCoords = jobs.filter((j): j is T & { lat: number; lng: number } => j.lat != null && j.lng != null);
  const withoutCoords = jobs.filter((j) => j.lat == null || j.lng == null);
  const withoutSorted = [...withoutCoords].sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  );

  if (withCoords.length < 2) {
    const miles = estimateRouteMiles(appointmentOrder, depot);
    return {
      appointmentOrder,
      driveOrder: appointmentOrder,
      defaultMode: "appointment",
      driveMatchesAppointments: true,
      milesAppointment: miles,
      milesDrive: miles,
      optimizerAvailable: false,
    };
  }

  const nnCore = nearestNeighborOrder(withCoords, depot);
  const driveOrder = [...nnCore, ...withoutSorted] as T[];

  const driveMatchesAppointments = isNonDecreasingBySchedule(driveOrder);
  const milesAppointment = estimateRouteMiles(appointmentOrder, depot);
  const milesDrive = estimateRouteMiles(driveOrder, depot);

  const sameOrder = appointmentOrder.every((j, i) => j.id === driveOrder[i]?.id);
  if (sameOrder) {
    return {
      appointmentOrder,
      driveOrder,
      defaultMode: "appointment",
      driveMatchesAppointments: true,
      milesAppointment,
      milesDrive,
      optimizerAvailable: false,
    };
  }

  const defaultMode: "appointment" | "drive" =
    driveMatchesAppointments ? "drive" : "appointment";

  return {
    appointmentOrder,
    driveOrder,
    defaultMode,
    driveMatchesAppointments,
    milesAppointment,
    milesDrive,
    optimizerAvailable: true,
  };
}
