"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

type BookingConfirmedProps = {
  sessionId: string;
  valueUsd: number | null;
  currency: string;
  customerEmail: string | null;
};

/**
 * Fires once per page load for ad/analytics tags (GTM, GA4, Meta, etc.).
 * Configure GTM to listen for `purchase` and/or `empire_booking_confirmed`.
 */
export function BookingConfirmedDataLayer({
  sessionId,
  valueUsd,
  currency,
  customerEmail,
}: BookingConfirmedProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !sessionId.startsWith("cs_")) return;
    fired.current = true;

    window.dataLayer = window.dataLayer ?? [];
    const value = typeof valueUsd === "number" && Number.isFinite(valueUsd) ? valueUsd : 0;

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: sessionId,
        value,
        currency: currency.toUpperCase(),
        items: [
          {
            item_id: sessionId,
            item_name: "Home cleaning booking",
            price: value,
            quantity: 1,
          },
        ],
      },
    });

    window.dataLayer.push({
      event: "empire_booking_confirmed",
      transaction_id: sessionId,
      value,
      currency: currency.toUpperCase(),
      customer_email: customerEmail ?? undefined,
    });
  }, [sessionId, valueUsd, currency, customerEmail]);

  return null;
}

type ThankYouProps = {
  /** Flattened query pairs for GTM variables (utm_*, source, etc.). */
  trackingParams: Record<string, string>;
};

/** Generic post-conversion page (e.g. lead forms, campaigns pointing to /thank-you). */
export function ThankYouDataLayer({ trackingParams }: ThankYouProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: "thank_you",
      page_path: "/thank-you",
      page_location: typeof window !== "undefined" ? window.location.href : "/thank-you",
      ...trackingParams,
    });
  }, [trackingParams]);

  return null;
}
