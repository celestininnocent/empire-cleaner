/** Fallback map centroid when ZIP cannot be parsed (not SF-specific). */
export function defaultServiceMapCenter(): { lat: number; lng: number } {
  const lat = Number.parseFloat(process.env.NEXT_PUBLIC_DEFAULT_SERVICE_LAT ?? "45.5231");
  const lng = Number.parseFloat(process.env.NEXT_PUBLIC_DEFAULT_SERVICE_LNG ?? "-122.6765");
  return {
    lat: Number.isFinite(lat) ? lat : 45.5231,
    lng: Number.isFinite(lng) ? lng : -122.6765,
  };
}

/** Great-circle distance in miles (WGS84 sphere). */

export function haversineMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Rough lat/lng for dispatch and Stripe webhook customer rows when full geocoding isn’t stored.
 * Deterministic from the 5-digit ZIP — not for turn-by-turn navigation.
 */
export function approximateLatLngFromZip(zip: string): { lat: number; lng: number } {
  const digits = zip.replace(/\D/g, "");
  const five = (digits.length >= 5 ? digits.slice(0, 5) : digits.padStart(5, "0")).slice(0, 5);
   const z = parseInt(five, 10);
  if (!Number.isFinite(z)) {
    return defaultServiceMapCenter();
  }
  const lat = 24.5 + ((z * 9301 + 49297) % 233_280) / 233_280 * 25;
  const lng = -124.85 + ((z * 49297 + 9301) % 233_280) / 233_280 * 57;
  return { lat, lng: Math.max(-124.9, Math.min(-66.9, lng)) };
}
