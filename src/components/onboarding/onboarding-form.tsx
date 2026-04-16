"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { friendlyFetchFailureMessage, sameOriginJsonPost } from "@/lib/network-error";

export function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("session_id") ?? "", [searchParams]);

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("Portland");
  const [state, setState] = useState("OR");
  const [zip, setZip] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [petsNotes, setPetsNotes] = useState("");
  const [parkingNotes, setParkingNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!sessionId) {
      setError("Missing checkout session. Please use your booking confirmation link.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/onboarding", {
        ...sameOriginJsonPost,
        body: JSON.stringify({
          sessionId,
          addressLine,
          city,
          state,
          zip,
          accessNotes,
          petsNotes,
          parkingNotes,
          customerNotes,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save onboarding details yet.");
        return;
      }
      router.push("/portal?onboarding=1");
    } catch (err) {
      setError(friendlyFetchFailureMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Service address</Label>
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
          <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
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
            <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} required />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="access">Access instructions</Label>
          <Textarea
            id="access"
            value={accessNotes}
            onChange={(e) => setAccessNotes(e.target.value.slice(0, 500))}
            placeholder="Gate code, entry door, alarm notes..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pets">Pets</Label>
          <Textarea
            id="pets"
            value={petsNotes}
            onChange={(e) => setPetsNotes(e.target.value.slice(0, 500))}
            placeholder="Any pets home? Friendly, crated, or areas to avoid."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="parking">Parking</Label>
          <Textarea
            id="parking"
            value={parkingNotes}
            onChange={(e) => setParkingNotes(e.target.value.slice(0, 500))}
            placeholder="Best parking spot, permit details, building access."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Anything to prioritize</Label>
          <Textarea
            id="notes"
            value={customerNotes}
            onChange={(e) => setCustomerNotes(e.target.value.slice(0, 500))}
            placeholder={siteConfig.bookingNotesDescription}
            rows={3}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving details...
            </>
          ) : (
            "Finish setup"
          )}
        </Button>
        <Link href="/portal" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Skip for now
        </Link>
      </div>
    </form>
  );
}
