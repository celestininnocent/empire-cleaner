"use client";

import { useMemo, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function PortfolioQuoteForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [units, setUnits] = useState("10");
  const [markets, setMarkets] = useState("Portland metro");
  const [cadence, setCadence] = useState("Turnovers + recurring common-area cleaning");
  const [notes, setNotes] = useState("");

  const mailtoHref = useMemo(() => {
    const body = [
      `Name: ${name.trim()}`,
      `Company: ${company.trim()}`,
      `Number of units: ${units.trim()}`,
      `Markets / neighborhoods: ${markets.trim()}`,
      `Desired cadence: ${cadence.trim()}`,
      `Notes: ${notes.trim()}`,
    ].join("\n");
    return `mailto:${siteConfig.partnershipsEmail}?subject=${encodeURIComponent(
      "Portfolio quote — Empire Cleaner"
    )}&body=${encodeURIComponent(body)}`;
  }, [name, company, units, markets, cadence, notes]);

  const validUnits = Number.isFinite(Number(units)) && Number(units) > 0;
  const canGenerate = Boolean(name.trim() && company.trim() && validUnits);

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pm-name">Your name</Label>
          <Input
            id="pm-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Johnson"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pm-company">Company</Label>
          <Input
            id="pm-company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="ABC Property Management"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="pm-units">Number of units</Label>
          <Input
            id="pm-units"
            inputMode="numeric"
            value={units}
            onChange={(e) => setUnits(e.target.value)}
            placeholder="10"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="pm-markets">Markets / neighborhoods</Label>
          <Input
            id="pm-markets"
            value={markets}
            onChange={(e) => setMarkets(e.target.value)}
            placeholder="Portland, Beaverton, Hillsboro"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pm-cadence">Desired cadence</Label>
        <Input
          id="pm-cadence"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
          placeholder="Turnovers + weekly common-area"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pm-notes">Notes</Label>
        <Textarea
          id="pm-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Access process, billing preferences, SLAs, after-hours coverage..."
          rows={4}
          maxLength={1000}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={canGenerate ? mailtoHref : undefined}
          aria-disabled={!canGenerate}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto",
            !canGenerate ? "pointer-events-none opacity-50" : ""
          )}
        >
          Email multi-unit quote request
        </a>
        <p className="self-center text-xs text-muted-foreground">
          Required: name, company, and number of units.
        </p>
      </div>
    </div>
  );
}
