import type { PropertyTypeId } from "@/lib/property-types";
import { PROPERTY_TYPES } from "@/lib/property-types";
import type { ServiceTierId } from "@/lib/service-tiers";
import { SERVICE_TIERS } from "@/lib/service-tiers";
import type { AddOnId } from "@/lib/add-ons";
import { normalizeAddOnIds } from "@/lib/add-ons";
import { sanitizeAttributionInput, type AttributionPayload } from "@/lib/attribution";

const PROPERTY_IDS = new Set<PropertyTypeId>(PROPERTY_TYPES.map((p) => p.id));
const SERVICE_TIER_IDS = new Set<ServiceTierId>(SERVICE_TIERS.map((t) => t.id));

export type CheckoutBody = {
  bedrooms: number;
  bathrooms: number;
  squareFootage: number;
  addressLine: string;
  city: string;
  state: string;
  zip: string;
  propertyType: PropertyTypeId;
  serviceTier: ServiceTierId;
  bookingType: "once" | "recurring";
  frequency: "weekly" | "biweekly" | "monthly";
  scheduledStart: string;
  /** Trimmed; max 500 for Stripe Checkout metadata per value */
  customerNotes: string;
  addOnIds: AddOnId[];
  /** Contact for Stripe receipt + guest account creation after payment */
  customerEmail: string;
  customerPhone: string;
  customerFullName: string;
  attribution: AttributionPayload;
};

function isNonEmptyString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.trim().length <= max;
}

/** Bounds aligned with `calculateJobPriceCents` clamping. */
export function parseCheckoutBody(json: unknown): { ok: true; body: CheckoutBody } | { ok: false; error: string } {
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }
  const o = json as Record<string, unknown>;

  const bookingType = o.bookingType === "once" || o.bookingType === "recurring" ? o.bookingType : null;
  if (!bookingType) {
    return { ok: false, error: "bookingType must be \"once\" or \"recurring\"." };
  }

  let propertyType: PropertyTypeId = "residential";
  if (o.propertyType !== undefined && o.propertyType !== null && o.propertyType !== "") {
    if (typeof o.propertyType !== "string" || !PROPERTY_IDS.has(o.propertyType as PropertyTypeId)) {
      return { ok: false, error: "propertyType must be a supported property type id." };
    }
    propertyType = o.propertyType as PropertyTypeId;
  }

  let serviceTier: ServiceTierId = "standard";
  if (o.serviceTier !== undefined && o.serviceTier !== null && o.serviceTier !== "") {
    if (typeof o.serviceTier !== "string" || !SERVICE_TIER_IDS.has(o.serviceTier as ServiceTierId)) {
      return { ok: false, error: "serviceTier must be a supported service tier id." };
    }
    serviceTier = o.serviceTier as ServiceTierId;
  }

  const bedrooms = Number(o.bedrooms);
  const bathrooms = Number(o.bathrooms);
  const squareFootage = Number(o.squareFootage);
  if (!Number.isFinite(bedrooms) || !Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 10) {
    return { ok: false, error: "bedrooms must be an integer from 0 to 10." };
  }
  if (!Number.isFinite(bathrooms) || !Number.isInteger(bathrooms) || bathrooms < 1 || bathrooms > 10) {
    return { ok: false, error: "bathrooms must be an integer from 1 to 10." };
  }
  if (!Number.isFinite(squareFootage) || !Number.isInteger(squareFootage) || squareFootage < 500 || squareFootage > 20000) {
    return { ok: false, error: "squareFootage must be an integer from 500 to 20000." };
  }

  if (!isNonEmptyString(o.addressLine, 300)) {
    return { ok: false, error: "addressLine is required (max 300 characters)." };
  }
  if (!isNonEmptyString(o.city, 100)) {
    return { ok: false, error: "city is required (max 100 characters)." };
  }
  const stateRaw = typeof o.state === "string" ? o.state.trim() : "";
  if (stateRaw.length < 2 || stateRaw.length > 32) {
    return { ok: false, error: "state must be 2–32 characters." };
  }
  const zipRaw = typeof o.zip === "string" ? o.zip.trim() : "";
  if (!/^[\dA-Za-z][\dA-Za-z\s\-]{2,14}$/.test(zipRaw)) {
    return { ok: false, error: "zip must be a valid postal code." };
  }

  const scheduledRaw = typeof o.scheduledStart === "string" ? o.scheduledStart.trim() : "";
  const scheduled = new Date(scheduledRaw);
  if (!Number.isFinite(scheduled.getTime())) {
    return { ok: false, error: "scheduledStart must be a valid ISO date string." };
  }
  const skewMs = 60 * 60 * 1000;
  if (scheduled.getTime() < Date.now() - skewMs) {
    return { ok: false, error: "scheduledStart must not be in the past." };
  }
  const maxFuture = Date.now() + 366 * 24 * 60 * 60 * 1000;
  if (scheduled.getTime() > maxFuture) {
    return { ok: false, error: "scheduledStart is too far in the future." };
  }

  let customerNotes = "";
  if (o.customerNotes != null && o.customerNotes !== "") {
    if (typeof o.customerNotes !== "string") {
      return { ok: false, error: "customerNotes must be a string." };
    }
    const t = o.customerNotes.trim();
    if (t.length > 500) {
      return { ok: false, error: "customerNotes must be at most 500 characters." };
    }
    customerNotes = t;
  }
  const addOnIds = normalizeAddOnIds(o.addOnIds);
  if (Array.isArray(o.addOnIds) && addOnIds.length !== o.addOnIds.length) {
    return { ok: false, error: "addOnIds must contain only supported add-on ids." };
  }
  if (addOnIds.length > 10) {
    return { ok: false, error: "Too many add-ons selected." };
  }

  const emailRaw = typeof o.customerEmail === "string" ? o.customerEmail.trim() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) || emailRaw.length > 320) {
    return { ok: false, error: "A valid email is required." };
  }
  const phoneRaw = typeof o.customerPhone === "string" ? o.customerPhone.trim() : "";
  const phoneDigits = phoneRaw.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return { ok: false, error: "Phone must include at least 10 digits." };
  }
  const nameRaw = typeof o.customerFullName === "string" ? o.customerFullName.trim() : "";
  if (nameRaw.length < 2 || nameRaw.length > 120) {
    return { ok: false, error: "Full name must be 2–120 characters." };
  }

  const attribution = sanitizeAttributionInput(
    o.attribution && typeof o.attribution === "object"
      ? (o.attribution as Partial<AttributionPayload>)
      : {}
  );

  let frequency: "weekly" | "biweekly" | "monthly" = "monthly";
  if (bookingType === "recurring") {
    const f = o.frequency;
    if (f !== "weekly" && f !== "biweekly" && f !== "monthly") {
      return { ok: false, error: "frequency must be weekly, biweekly, or monthly for recurring bookings." };
    }
    frequency = f;
  }

  return {
    ok: true,
    body: {
      bedrooms,
      bathrooms,
      squareFootage,
      addressLine: (o.addressLine as string).trim(),
      city: (o.city as string).trim(),
      state: stateRaw,
      zip: zipRaw,
      propertyType,
      serviceTier,
      bookingType,
      frequency,
      scheduledStart: scheduled.toISOString(),
      customerNotes,
      addOnIds,
      customerEmail: emailRaw,
      customerPhone: phoneRaw,
      customerFullName: nameRaw,
      attribution,
    },
  };
}
