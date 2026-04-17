"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Calendar, Check, Loader2, Ruler } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { calculateJobPriceCents, formatUsd } from "@/lib/pricing";
import { PROPERTY_TYPES, type PropertyTypeId } from "@/lib/property-types";
import { SERVICE_TIERS, type ServiceTierId } from "@/lib/service-tiers";
import { ADD_ONS, getAddOnsTotalCents, type AddOnId } from "@/lib/add-ons";
import { siteConfig } from "@/config/site";
import { syncProfilePhoneFromUserMetadata } from "@/lib/profile-phone-sync";
import { friendlyFetchFailureMessage, sameOriginJsonPost } from "@/lib/network-error";
import { sanitizeAttributionInput, type AttributionPayload } from "@/lib/attribution";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const frequencies = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export function BookingForm() {
  const [attribution, setAttribution] = useState<AttributionPayload>({
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    utmContent: "",
    utmTerm: "",
    referrerUrl: "",
    landingPath: "",
  });
  const [bookingType, setBookingType] = useState<"once" | "recurring">("once");
  const [propertyType, setPropertyType] = useState<PropertyTypeId>("residential");
  const [serviceTier, setServiceTier] = useState<ServiceTierId>("standard");
  const [bedrooms, setBedrooms] = useState("3");
  const [bathrooms, setBathrooms] = useState("2");
  const [sqft, setSqft] = useState("1800");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("OR");
  const [zip, setZip] = useState("");
  const [frequency, setFrequency] =
    useState<(typeof frequencies)[number]["value"]>("biweekly");
  const [scheduledStart, setScheduledStart] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [addOnIds, setAddOnIds] = useState<AddOnId[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerFullName, setCustomerFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setCustomerEmail((e) => e || user.email || "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled || !profile) return;
      if (profile.full_name) setCustomerFullName((n) => n || profile.full_name || "");
      if (profile.phone) setCustomerPhone((p) => p || profile.phone || "");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "ec_attribution_v1";
    const params = new URLSearchParams(window.location.search);
    const incoming = sanitizeAttributionInput({
      utmSource: params.get("utm_source") ?? "",
      utmMedium: params.get("utm_medium") ?? "",
      utmCampaign: params.get("utm_campaign") ?? "",
      utmContent: params.get("utm_content") ?? "",
      utmTerm: params.get("utm_term") ?? "",
      referrerUrl: document.referrer ?? "",
      landingPath: `${window.location.pathname}${window.location.search}`.slice(0, 300),
    });
    let firstTouch: AttributionPayload | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        firstTouch = sanitizeAttributionInput(JSON.parse(raw) as Partial<AttributionPayload>);
      }
    } catch {
      firstTouch = null;
    }
    const hasIncomingUtm = Boolean(
      incoming.utmSource ||
      incoming.utmMedium ||
      incoming.utmCampaign ||
      incoming.utmContent ||
      incoming.utmTerm
    );
    if (!firstTouch) {
      const base = hasIncomingUtm ? incoming : sanitizeAttributionInput({
        referrerUrl: incoming.referrerUrl,
        landingPath: incoming.landingPath,
      });
      firstTouch = base;
      try {
        window.localStorage.setItem(key, JSON.stringify(base));
      } catch {
        // Ignore write failures (private mode / blocked storage).
      }
    } else if (hasIncomingUtm) {
      // Keep original first-touch; only refresh on explicit campaign UTMs.
      const updated = sanitizeAttributionInput({
        ...firstTouch,
        ...incoming,
      });
      firstTouch = updated;
      try {
        window.localStorage.setItem(key, JSON.stringify(updated));
      } catch {
        // Ignore write failures.
      }
    }
    setAttribution(firstTouch);
  }, []);

  const priceCents = useMemo(() => {
    return calculateJobPriceCents({
      bedrooms: Number(bedrooms) || 0,
      bathrooms: Number(bathrooms) || 1,
      squareFootage: Number(sqft) || 1000,
      propertyType,
      serviceTier,
      addOnIds,
    });
  }, [bedrooms, bathrooms, sqft, propertyType, serviceTier, addOnIds]);

  const addOnTotalCents = useMemo(() => getAddOnsTotalCents(addOnIds), [addOnIds]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await syncProfilePhoneFromUserMetadata(supabase);
      }

      const res = await fetch("/api/stripe/checkout", {
        ...sameOriginJsonPost,
        body: JSON.stringify({
          bookingType,
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          squareFootage: Number(sqft),
          addressLine,
          city,
          state,
          zip,
          frequency: bookingType === "recurring" ? frequency : undefined,
          propertyType,
          serviceTier,
          customerNotes,
          addOnIds,
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          customerFullName: customerFullName.trim(),
          attribution,
          scheduledStart: scheduledStart
            ? new Date(scheduledStart).toISOString()
            : new Date().toISOString(),
        }),
      });

      const raw = await res.text();
      let data: {
        error?: string;
        url?: string;
        demo?: boolean;
        redirectUrl?: string;
      } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          setError(
            `Server returned non-JSON (${res.status}). Check the terminal / network tab.`
          );
          return;
        }
      } else if (!res.ok) {
        setError(`Checkout failed (${res.status}) with an empty response.`);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Checkout failed");
        return;
      }
      if (data.demo && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Unexpected response from checkout");
    } catch (err) {
      setError(friendlyFetchFailureMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/80 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="size-5 text-primary" />
              Property &amp; size
            </CardTitle>
            <CardDescription>
              Tell us about the home — your quote updates instantly. Defaults work for most Portland-area
              houses; adjust if yours is different.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="bedrooms">
                {propertyType === "residential" ? "Bedrooms" : "Rooms / zones"}
              </Label>
              <Input
                id="bedrooms"
                inputMode="numeric"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bathrooms">
                {propertyType === "residential" ? "Bathrooms" : "Restrooms"}
              </Label>
              <Input
                id="bathrooms"
                inputMode="numeric"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sqft">Square footage</Label>
              <Input
                id="sqft"
                inputMode="numeric"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-3">
              <details className="rounded-lg border border-border/70 bg-card/50 px-3 py-2.5">
                <summary className="cursor-pointer text-sm font-medium text-foreground">
                  Advanced quote tweaks (optional)
                </summary>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="property-type">Property type</Label>
                    <Select
                      value={propertyType}
                      onValueChange={(v) => setPropertyType(v as PropertyTypeId)}
                    >
                      <SelectTrigger id="property-type" className="w-full">
                        <SelectValue placeholder="Property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPES.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {PROPERTY_TYPES.find((p) => p.id === propertyType)?.description}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-tier">Service level</Label>
                    <Select
                      value={serviceTier}
                      onValueChange={(v) => setServiceTier(v as ServiceTierId)}
                    >
                      <SelectTrigger id="service-tier" className="w-full">
                        <SelectValue placeholder="Service level" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_TIERS.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {SERVICE_TIERS.find((t) => t.id === serviceTier)?.description}
                    </p>
                  </div>
                </div>
              </details>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Your flat rate</CardTitle>
            <CardDescription>
              {bookingType === "once"
                ? "Total for this visit (before tax & tips) — what you pay at checkout."
                : "Per visit on your plan (before tax & tips)."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tracking-tight text-primary">
              {formatUsd(priceCents)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{siteConfig.bookingPriceHint}</p>
            {addOnIds.length ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Includes optional add-ons ({formatUsd(addOnTotalCents)}).
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Ruler className="size-5 text-primary" />
            Service address
          </CardTitle>
          <CardDescription>Where we&apos;ll send the crew.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Street address</Label>
            <Input
              id="address"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              placeholder="123 Market Street"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Portland"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                maxLength={2}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calendar className="size-5 text-primary" />
            Schedule &amp; billing
          </CardTitle>
          <CardDescription>
            One-time or recurring — you&apos;ll complete payment on the next step (no account required
            first).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="space-y-2">
            <Label>Visit type</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={bookingType === "once" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingType("once")}
              >
                One-time clean
              </Button>
              <Button
                type="button"
                variant={bookingType === "recurring" ? "default" : "outline"}
                size="sm"
                onClick={() => setBookingType("recurring")}
              >
                Recurring plan
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {bookingType === "recurring" ? (
              <div className="space-y-2">
                <Label htmlFor="freq">Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(v) =>
                    setFrequency(v as (typeof frequencies)[number]["value"])
                  }
                >
                  <SelectTrigger id="freq" className="w-full">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/20 p-3 text-sm text-muted-foreground md:col-span-1">
                Single secure charge for this visit. Book again anytime — no subscription lock-in.
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="start">
                {bookingType === "once" ? "Preferred service window" : "First service window"}
              </Label>
              <Input
                id="start"
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{siteConfig.bookingContactTitle}</CardTitle>
          <CardDescription>{siteConfig.bookingContactDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="customer-full-name">Full name</Label>
            <Input
              id="customer-full-name"
              autoComplete="name"
              value={customerFullName}
              onChange={(e) => setCustomerFullName(e.target.value)}
              placeholder="Alex Johnson"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="you@email.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Mobile phone</Label>
            <Input
              id="customer-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="(503) 555-0100"
              required
            />
          </div>
        </CardContent>
      </Card>

      <details className="rounded-xl border border-border/80 bg-card/40 px-4 py-3 shadow-sm open:bg-card/60">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          {siteConfig.bookingNotesSummary}
        </summary>
        <div className="mt-4 space-y-2 border-t border-border/60 pt-4">
          <Label htmlFor="customer-notes" className="text-muted-foreground">
            {siteConfig.bookingNotesTitle}
          </Label>
          <Textarea
            id="customer-notes"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value.slice(0, 500))}
            placeholder="Gate codes, pets, parking, allergies, rooms to prioritize…"
            rows={3}
            className="min-h-[88px] resize-y"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right tabular-nums">
            {500 - customerNotes.length} characters left
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {siteConfig.bookingPricingAdjustmentNote}
            <Link
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {siteConfig.bookingPricingAdjustmentTermsLink}
            </Link>
            .
          </p>
        </div>
      </details>

      <details className="rounded-xl border border-border/80 bg-card/40 px-4 py-3 shadow-sm open:bg-card/60">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          {siteConfig.bookingAddonsSummary}
          <span className="ml-2 font-normal text-muted-foreground">
            — {siteConfig.bookingAddonsHint}
          </span>
        </summary>
        <div className="mt-4 grid gap-3 border-t border-border/60 pt-4 sm:grid-cols-2">
          {ADD_ONS.map((addOn) => {
            const checked = addOnIds.includes(addOn.id);
            return (
              <label
                key={addOn.id}
                htmlFor={`addon-${addOn.id}`}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-border/70 p-3 hover:bg-muted/20"
              >
                <Checkbox
                  id={`addon-${addOn.id}`}
                  checked={checked}
                  onCheckedChange={(v) =>
                    setAddOnIds((prev) =>
                      v === true
                        ? Array.from(new Set([...prev, addOn.id]))
                        : prev.filter((id) => id !== addOn.id)
                    )
                  }
                  className="mt-0.5"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium">
                    {addOn.label} (+{formatUsd(addOn.addCents)})
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {addOn.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </details>

      <div className="rounded-xl border border-primary/25 bg-primary/[0.04] px-4 py-4">
        <p className="text-sm font-medium text-foreground">Before you pay</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          <li className="flex gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{siteConfig.bookTrustGuarantee}</span>
          </li>
          <li className="flex gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{siteConfig.bookTrustPhotos}</span>
          </li>
          <li className="flex gap-2 text-sm text-muted-foreground">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{siteConfig.bookTrustInsurance}</span>
          </li>
        </ul>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/15 p-4">
        <Checkbox
          id="booking-terms"
          checked={acceptedTerms}
          onCheckedChange={(v) => setAcceptedTerms(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="booking-terms"
          className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground"
        >
          {siteConfig.bookingAgreeLead}{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {siteConfig.legalTermsLink}
          </Link>{" "}
          {siteConfig.bookingAgreeMid}{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {siteConfig.legalPrivacyLink}
          </Link>
          . {siteConfig.bookingAgreeTail}
        </Label>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={loading || !acceptedTerms}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Redirecting to secure checkout…
          </>
        ) : bookingType === "once" ? (
          siteConfig.bookingCtaOnce
        ) : (
          siteConfig.bookingCtaRecurring
        )}
      </Button>
    </form>
  );
}
