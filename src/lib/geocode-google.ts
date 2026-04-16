/**
 * Server-side Geocoding API. Optional env:
 * - GOOGLE_MAPS_SERVER_API_KEY (preferred, secret)
 * - GOOGLE_MAPS_API_KEY
 * - NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (works if key is allowed for Geocoding API)
 */

export async function geocodeAddressLine(input: {
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  const key =
    process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return null;

  const parts = [input.address, input.city, input.state, input.zip].filter(
    (p) => typeof p === "string" && p.trim().length > 0
  ) as string[];
  if (!parts.length) return null;

  const address = parts.join(", ");
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", address);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    status?: string;
    results?: { geometry?: { location?: { lat?: number; lng?: number } } }[];
  };
  if (data.status !== "OK" || !data.results?.length) return null;

  const loc = data.results[0]?.geometry?.location;
  if (loc?.lat == null || loc?.lng == null) return null;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}
