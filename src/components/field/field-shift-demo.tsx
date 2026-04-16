"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Camera,
  Clock3,
  Loader2,
  Map as MapIcon,
  Navigation,
  Sparkles,
} from "lucide-react";
import {
  commissionPerCleanerCents,
  getCommissionPoolPercent,
  getCrewSplitWays,
} from "@/lib/commission";
import {
  buildDemoChecklist,
  buildDemoJobsForToday,
  type DemoCheckRow,
} from "@/lib/field-demo-data";
import { formatUsd } from "@/lib/pricing";
import { siteConfig } from "@/config/site";
import { getPropertyTypeLabel } from "@/lib/property-types";
import { getServiceTierShortLabel } from "@/lib/service-tiers";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { APIProvider, Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";

export function FieldShiftDemo() {
  const jobs = useMemo(() => buildDemoJobsForToday(), []);
  const initialChecklist = useMemo(() => buildDemoChecklist(), []);

  const [checklist, setChecklist] = useState<DemoCheckRow[]>(() => [...initialChecklist]);
  const [jobStatus, setJobStatus] = useState<Record<string, string>>(() =>
    Object.fromEntries(jobs.map((j) => [j.id, j.status]))
  );

  const [activeJobId, setActiveJobId] = useState(jobs[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [clock, setClock] = useState<{
    jobId: string | null;
    startedAt: string | null;
  }>({ jobId: null, startedAt: null });

  const items = checklist.filter((c) => c.job_id === activeJobId);
  const activeJob = jobs.find((j) => j.id === activeJobId);
  const activeClockStartedAt = clock.jobId === activeJobId ? clock.startedAt : null;

  const photoRooms = items.filter((i) => i.requires_photo);
  const photoRequiredOk =
    photoRooms.length === 0 ||
    photoRooms.every((i) => Boolean(i.photo_url && i.completed_at));

  const allDone =
    items.length > 0 &&
    items.every((i) => Boolean(i.completed_at && (!i.requires_photo || i.photo_url)));

  const progress =
    items.length === 0
      ? 0
      : Math.round((items.filter((i) => i.completed_at).length / items.length) * 100);

  function toggleRoom(row: DemoCheckRow, checked: boolean) {
    setBusy(row.id);
    setChecklist((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              completed_at: checked ? new Date().toISOString() : null,
              photo_url: checked ? r.photo_url : null,
            }
          : r
      )
    );
    setTimeout(() => setBusy(null), 120);
  }

  async function onPhoto(row: DemoCheckRow, file: File | null) {
    if (!file) return;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = reject;
      r.readAsDataURL(file);
    });
    setBusy(row.id);
    setChecklist((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, photo_url: dataUrl, completed_at: new Date().toISOString() } : r
      )
    );
    setBusy(null);
  }

  function clockIn() {
    if (!activeJobId) return;
    setClock({ jobId: activeJobId, startedAt: new Date().toISOString() });
  }

  function clockOut() {
    setClock({ jobId: null, startedAt: null });
  }

  function completeJob() {
    if (!activeJobId || !allDone || !photoRequiredOk) return;
    setBusy("done");
    setJobStatus((s) => ({ ...s, [activeJobId]: "completed" }));
    setTimeout(() => setBusy(null), 400);
  }

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
        <div className="flex items-center gap-2 font-medium text-amber-950 dark:text-amber-100">
          <Sparkles className="size-4 shrink-0" />
          Interactive demo — nothing is saved. Your real route is on{" "}
          <span className="font-semibold">/field</span> after you&apos;re on a crew.
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {siteConfig.fieldRouteStripLabel}
        </p>
        <div className="flex min-h-11 flex-wrap items-center gap-2 overflow-x-auto rounded-xl border border-border/80 bg-card/40 px-3 py-2">
          {jobs.map((j) => (
            <Button
              key={j.id}
              type="button"
              size="sm"
              variant={j.id === activeJobId ? "default" : "outline"}
              onClick={() => setActiveJobId(j.id)}
            >
              {new Date(j.scheduled_start).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
              {jobStatus[j.id] === "completed" ? " · Done" : ""}
            </Button>
          ))}
        </div>
      </div>

      {activeJob ? (
        <>
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                <Navigation className="size-5 text-primary" />
                {activeJob.address_line}
                <Badge variant="secondary" className="font-normal">
                  {getServiceTierShortLabel(activeJob.service_tier ?? undefined)}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {getPropertyTypeLabel(activeJob.property_type ?? undefined)}
                </Badge>
                {jobStatus[activeJob.id] === "completed" ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">Completed</Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                {activeJob.city}, {activeJob.state} {activeJob.zip} ·{" "}
                {formatUsd(activeJob.price_cents)} job total
              </CardDescription>
              {activeJob.customer_notes?.trim() ? (
                <div className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/[0.08] px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-950 dark:text-amber-100">
                    {siteConfig.fieldJobNotesHeading}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {activeJob.customer_notes.trim()}
                  </p>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {mapKey && activeJob.lat != null && activeJob.lng != null ? (
                <APIProvider apiKey={mapKey}>
                  <div className="h-48 overflow-hidden rounded-xl border border-border/80">
                    <GoogleMap
                      defaultCenter={{ lat: activeJob.lat, lng: activeJob.lng }}
                      defaultZoom={14}
                      mapId="empire-cleaner-field-demo"
                      gestureHandling="greedy"
                    >
                      <AdvancedMarker position={{ lat: activeJob.lat, lng: activeJob.lng }}>
                        <div className="size-3 rounded-full border-2 border-white bg-amber-500 shadow-md" />
                      </AdvancedMarker>
                    </GoogleMap>
                  </div>
                </APIProvider>
              ) : (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
                  <MapIcon className="mr-2 size-4" />
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to see the map (optional).
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {activeJob.lat != null && activeJob.lng != null ? (
                  <a
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.lat},${activeJob.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open in Google Maps
                  </a>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div
            className="flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/[0.08] px-3 py-3 text-sm text-foreground"
            role="note"
          >
            <AlertTriangle
              className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400"
              aria-hidden
            />
            <p className="leading-relaxed">
              {siteConfig.fieldScopeMismatchBannerLead}
              <Link
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {siteConfig.legalTermsLink}
              </Link>
              .
            </p>
          </div>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock3 className="size-5 text-primary" />
                Clock-in / Clock-out
              </CardTitle>
              <CardDescription>
                Crew pool is {getCommissionPoolPercent()}% of the job total, split{" "}
                {getCrewSplitWays()} way{getCrewSplitWays() === 1 ? "" : "s"} — about{" "}
                {formatUsd(commissionPerCleanerCents(activeJob.price_cents))} per person on this stop
                when you clock out (demo only).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {clock.jobId !== activeJobId ? (
                <Button type="button" onClick={clockIn} disabled={busy === "in" || jobStatus[activeJob.id] === "completed"}>
                  {busy === "in" ? <Loader2 className="size-4 animate-spin" /> : "Clock in"}
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={clockOut} disabled={busy === "out"}>
                  {busy === "out" ? <Loader2 className="size-4 animate-spin" /> : "Clock out"}
                </Button>
              )}
              {activeClockStartedAt ? (
                <p className="text-sm text-muted-foreground">
                  Started {new Date(activeClockStartedAt).toLocaleTimeString()}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Room-by-room checklist</CardTitle>
              <CardDescription>
                Photo proof where marked — same rules as the live crew app.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={progress} />
              {items.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border/70 bg-card/60 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!!row.completed_at}
                      disabled={
                        jobStatus[activeJob.id] === "completed" ||
                        (row.requires_photo && !row.photo_url)
                      }
                      onCheckedChange={(v) => toggleRoom(row, v === true)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium leading-tight">{row.label}</p>
                        {row.requires_photo ? (
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                            Photo required
                          </span>
                        ) : null}
                      </div>
                      {row.requires_photo ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                            <Camera className="size-4" />
                            Upload
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => onPhoto(row, e.target.files?.[0] ?? null)}
                            />
                          </Label>
                          {row.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.photo_url}
                              alt=""
                              className="h-16 w-24 rounded-md object-cover"
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {busy === row.id ? (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <Button
                type="button"
                disabled={
                  jobStatus[activeJob.id] === "completed" ||
                  !allDone ||
                  !photoRequiredOk ||
                  busy === "done"
                }
                onClick={completeJob}
              >
                {busy === "done" ? <Loader2 className="size-4 animate-spin" /> : "Mark job complete"}
              </Button>
              {!photoRequiredOk ? (
                <p className="text-xs text-destructive">
                  Complete required photo rooms before marking done.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
