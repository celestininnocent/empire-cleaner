"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  Clock3,
  Loader2,
  Map as MapIcon,
  Landmark,
  Navigation,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  calculateCrewPayoutBreakdown,
  getCommissionPoolPercent,
  getCrewSplitWays,
  getOnTimeBonusCents,
  getOnTimeWindowMinutes,
  getQualityBonusCents,
} from "@/lib/commission";
import { formatUsd } from "@/lib/pricing";
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
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from "@vis.gl/react-google-maps";
import { siteConfig } from "@/config/site";
import type { RouteOptimizationResult } from "@/lib/route-optimization";
import { friendlyFetchFailureMessage, sameOriginJsonPost } from "@/lib/network-error";
import { defaultServiceMapCenter, haversineMiles } from "@/lib/geo";
import { compressImageForUpload } from "@/lib/image-compress";

/** Manual “Share GPS” — accurate enough for dispatch + customer ETA geofence. */
const PING_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 20_000,
  timeout: 35_000,
};

/** Background pings while clocked in — slightly softer to save battery. */
const BACKGROUND_GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 120_000,
  timeout: 45_000,
};

/** Used when loading the field map pin (slightly more accurate than dispatch ping). */
const MAP_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 45_000,
  timeout: 20_000,
};

function getCurrentPositionAsync(options: PositionOptions = PING_GEOLOCATION_OPTIONS): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/** Fits the map to two points, or centers a single point; must render inside `<GoogleMap>`. */
function FieldMapCamera({
  a,
  b,
  fallbackCenter,
  fallbackZoom,
}: {
  a: { lat: number; lng: number } | null;
  b: { lat: number; lng: number } | null;
  fallbackCenter: { lat: number; lng: number };
  fallbackZoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || typeof google === "undefined") return;
    const pts = [a, b].filter(
      (p): p is { lat: number; lng: number } =>
        p != null && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    );
    if (pts.length >= 2) {
      const bounds = new google.maps.LatLngBounds();
      for (const p of pts) bounds.extend(p);
      map.fitBounds(bounds, 40);
    } else if (pts.length === 1) {
      map.panTo(pts[0]!);
      map.setZoom(fallbackZoom);
    } else {
      map.panTo(fallbackCenter);
      map.setZoom(fallbackZoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scalar lat/lng deps track marker moves without object identity churn
  }, [map, a?.lat, a?.lng, b?.lat, b?.lng, fallbackCenter.lat, fallbackCenter.lng, fallbackZoom]);
  return null;
}

function geolocationErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) {
      return "Location permission denied. Allow location for this site in your browser settings and try again.";
    }
    if (code === 2) {
      return "Location unavailable (GPS or network issue). Move to an area with better signal or try again.";
    }
    if (code === 3) {
      return "Location request timed out. Try again, or check that location services are on.";
    }
  }
  if (err instanceof Error) return err.message;
  return "Could not read your location.";
}

type JobRow = {
  id: string;
  scheduled_start: string;
  address_line: string;
  city: string | null;
  state: string | null;
  zip: string;
  status: string;
  price_cents: number;
  lat: number | null;
  lng: number | null;
  property_type?: string | null;
  service_tier?: string | null;
  customer_notes?: string | null;
};

function jobStopMapCenter(
  job: JobRow,
  teamBase: { lat: number; lng: number } | null
): { lat: number; lng: number } {
  const maxStopDistanceMiles = Number.parseFloat(
    process.env.NEXT_PUBLIC_MAX_MAP_DISTANCE_MILES ?? "180"
  );
  const origin = teamBase ?? defaultServiceMapCenter();
  if (
    job.lat != null &&
    job.lng != null &&
    Number.isFinite(Number(job.lat)) &&
    Number.isFinite(Number(job.lng))
  ) {
    const lat = Number(job.lat);
    const lng = Number(job.lng);
    const dist = haversineMiles(origin.lat, origin.lng, lat, lng);
    if (dist <= (Number.isFinite(maxStopDistanceMiles) ? maxStopDistanceMiles : 180)) {
      return { lat, lng };
    }
  }
  if (teamBase) return teamBase;
  return defaultServiceMapCenter();
}

type ClaimableJobRow = {
  id: string;
  scheduled_start: string;
  address_line: string;
  city: string | null;
  state: string | null;
  zip: string;
  status: string;
  price_cents: number;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
};

type CheckRow = {
  id: string;
  job_id: string;
  room_key: string;
  label: string;
  requires_photo: boolean;
  completed_at: string | null;
  photo_url: string | null;
};

type PayoutRow = {
  id: string;
  time_entry_id: string;
  amount_cents: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "failed" | "awaiting_destination";
  paid_at: string | null;
  created_at: string;
  failure_reason: string | null;
};

export function FieldShift({
  cleanerId,
  jobs,
  claimableJobs,
  checklist,
  payouts,
  teamBase,
  crewAssignmentReady = true,
  routeOptimization,
}: {
  cleanerId: string | null;
  jobs: JobRow[];
  claimableJobs: ClaimableJobRow[];
  checklist: CheckRow[];
  payouts: PayoutRow[];
  teamBase?: { lat: number; lng: number } | null;
  /** When false, empty state explains crew link instead of “nothing scheduled today.” */
  crewAssignmentReady?: boolean;
  /** When set, crew can switch between appointment time order and shorter-drive order. */
  routeOptimization?: RouteOptimizationResult<JobRow> | null;
}) {
  const router = useRouter();
  const [routeMode, setRouteMode] = useState<"appointment" | "drive">(
    () => routeOptimization?.defaultMode ?? "appointment"
  );

  const routeJobs = useMemo(() => {
    if (!routeOptimization?.optimizerAvailable) return jobs;
    return routeMode === "drive"
      ? routeOptimization.driveOrder
      : routeOptimization.appointmentOrder;
  }, [jobs, routeOptimization, routeMode]);

  const jobIdsKey = routeJobs.map((j) => j.id).join(",");
  useEffect(() => {
    if (routeOptimization) {
      setRouteMode(routeOptimization.defaultMode);
    }
  }, [jobIdsKey, routeOptimization, routeOptimization?.defaultMode]);

  const [activeJobId, setActiveJobId] = useState(routeJobs[0]?.id ?? "");
  const [busy, setBusy] = useState<string | null>(null);
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);
  const [gpsShareError, setGpsShareError] = useState<string | null>(null);
  const [gpsShareSuccess, setGpsShareSuccess] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const backgroundGpsRef = useRef<number | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimNotice, setClaimNotice] = useState<string | null>(null);
  const [clock, setClock] = useState<{
    jobId: string | null;
    entryId: string | null;
    startedAt: string | null;
  }>({ jobId: null, entryId: null, startedAt: null });
  const [deviceLocation, setDeviceLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    getCurrentPositionAsync(MAP_GEOLOCATION_OPTIONS)
      .then((pos) => {
        if (cancelled) return;
        setDeviceLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      })
      .catch(() => {
        /* Map still shows the stop / crew base if GPS is denied or unavailable. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!routeJobs.length) {
      setActiveJobId("");
      setClock({ jobId: null, entryId: null, startedAt: null });
      return;
    }
    setActiveJobId((prev) => (routeJobs.some((j) => j.id === prev) ? prev : routeJobs[0]!.id));
  }, [routeJobs]);

  const items = checklist.filter((c) => c.job_id === activeJobId);
  const activeJob = routeJobs.find((j) => j.id === activeJobId);

  const stopMapCenter = useMemo(
    () => (activeJob ? jobStopMapCenter(activeJob, teamBase ?? null) : null),
    [activeJob, teamBase]
  );

  const baseMapCenter = useMemo(() => teamBase ?? defaultServiceMapCenter(), [teamBase]);

  const approxMiles =
    routeOptimization?.optimizerAvailable && routeOptimization
      ? routeMode === "drive"
        ? routeOptimization.milesDrive
        : routeOptimization.milesAppointment
      : null;
  const milesCaption =
    approxMiles != null ? siteConfig.fieldRouteMilesApprox(String(approxMiles)) : null;

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
      : Math.round(
          (items.filter((i) => i.completed_at).length / items.length) * 100
        );

  const shareLocation = useCallback(
    async (opts?: { background?: boolean; silent?: boolean }) => {
      if (!cleanerId) return;
      if (!navigator.geolocation) {
        if (!opts?.silent) {
          setGpsShareError("This browser does not support sharing location.");
        }
        return;
      }
      const background = opts?.background === true;
      const silent = opts?.silent === true;
      if (!silent) {
        setGpsShareError(null);
        setGpsShareSuccess(null);
      }
      if (!background) {
        setBusy("gps");
      }
      try {
        const pos = await getCurrentPositionAsync(
          background ? BACKGROUND_GEO_OPTIONS : PING_GEOLOCATION_OPTIONS
        );
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDeviceLocation({ lat, lng });

        const controller = new AbortController();
        const fetchTimeout = window.setTimeout(() => controller.abort(), 40_000);
        let res: Response;
        try {
          res = await fetch("/api/crew/location/ping", {
            ...sameOriginJsonPost,
            body: JSON.stringify({ lat, lng, background }),
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(fetchTimeout);
        }

        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          ok?: boolean;
          reason?: string;
          queued?: number;
        };

        if (!res.ok) {
          if (!silent) {
            setGpsShareError(data.error ?? `Server returned ${res.status}.`);
          }
          return;
        }

        if (silent) return;

        if (data.reason === "no_team") {
          setGpsShareSuccess(
            "Location saved. You are not assigned to a crew team yet, so some dispatch features may be limited."
          );
        } else {
          setGpsShareSuccess(
            data.queued && data.queued > 0
              ? `Location shared. We notified a customer you may be nearby (${data.queued} update).`
              : "Location shared with dispatch."
          );
        }
      } catch (e) {
        if (silent) return;
        if (e instanceof Error && e.name === "AbortError") {
          setGpsShareError("Saving location took too long. Check your connection and try again.");
        } else if (
          e &&
          typeof e === "object" &&
          "code" in e &&
          (e as GeolocationPositionError).code !== undefined
        ) {
          setGpsShareError(geolocationErrorMessage(e));
        } else {
          setGpsShareError(friendlyFetchFailureMessage(e));
        }
      } finally {
        if (!background) {
          setBusy(null);
        }
      }
    },
    [cleanerId]
  );

  useEffect(() => {
    if (!clock.entryId || !cleanerId) {
      if (backgroundGpsRef.current != null) {
        window.clearInterval(backgroundGpsRef.current);
        backgroundGpsRef.current = null;
      }
      return;
    }
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void shareLocation({ background: true, silent: true });
    };
    backgroundGpsRef.current = window.setInterval(tick, 5 * 60 * 1000);
    return () => {
      if (backgroundGpsRef.current != null) {
        window.clearInterval(backgroundGpsRef.current);
        backgroundGpsRef.current = null;
      }
    };
  }, [clock.entryId, cleanerId, shareLocation]);

  async function clockIn() {
    if (!cleanerId || !activeJobId) return;
    setBusy("in");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("time_entries")
      .insert({
        job_id: activeJobId,
        cleaner_id: cleanerId,
        clock_in: new Date().toISOString(),
      })
      .select("id")
      .single();
    setBusy(null);
    if (!error && data) {
      setClock({
        jobId: activeJobId,
        entryId: data.id,
        startedAt: new Date().toISOString(),
      });
      void shareLocation({ background: true, silent: true });
    }
  }

  async function clockOut() {
    if (!clock.entryId || !activeJob) return;
    setBusy("out");
    setPayoutNotice(null);
    const supabase = createClient();
    const end = new Date().toISOString();
    const payout = calculateCrewPayoutBreakdown({
      jobTotalCents: activeJob.price_cents,
      qualityQualified: allDone && photoRequiredOk,
      scheduledStartIso: activeJob.scheduled_start,
      clockInIso: clock.startedAt,
    });
    const { error } = await supabase
      .from("time_entries")
      .update({
        clock_out: end,
        commission_cents: payout.total_cents,
        base_commission_cents: payout.base_cents,
        quality_bonus_cents: payout.quality_bonus_cents,
        on_time_bonus_cents: payout.on_time_bonus_cents,
      })
      .eq("id", clock.entryId);
    if (error) {
      setPayoutNotice(`Could not save clock-out: ${error.message}`);
      setBusy(null);
      return;
    }

    const entryId = clock.entryId;
    try {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        const res = await fetch("/api/crew/payouts/process", {
          ...sameOriginJsonPost,
          body: JSON.stringify({ timeEntryId: entryId }),
        });
        const data = (await res.json()) as {
          status?: string;
          error?: string;
          ok?: boolean;
        };
        if (data.status === "paid") {
          setPayoutNotice("Payout sent to your connected account.");
          break;
        }
        if (data.status === "awaiting_destination") {
          setPayoutNotice(
            "Payout is waiting for your Stripe Connect account to be linked."
          );
          break;
        }
        if (data.status === "failed") {
          setPayoutNotice(
            data.error?.trim()
              ? `Payout failed: ${data.error}`
              : "Payout failed. Dispatch can retry from the owner dashboard."
          );
          break;
        }
        if (res.ok) {
          setPayoutNotice("Payout queued and processing.");
          break;
        }
        if (res.status === 404 && attempt < 3) {
          await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
          continue;
        }
        setPayoutNotice(data.error ?? `Payout step returned ${res.status}.`);
        break;
      }
    } catch (e) {
      setPayoutNotice(friendlyFetchFailureMessage(e));
    }
    setBusy(null);
    setClock({ jobId: null, entryId: null, startedAt: null });
    router.refresh();
  }

  function payoutLabel(status: PayoutRow["status"]): string {
    switch (status) {
      case "paid":
        return "Paid";
      case "pending":
        return "Queued";
      case "processing":
        return "Processing";
      case "awaiting_destination":
        return "Need payout account";
      case "failed":
        return "Failed";
      default:
        return status;
    }
  }

  async function toggleRoom(row: CheckRow, checked: boolean) {
    setBusy(row.id);
    const supabase = createClient();
    await supabase
      .from("job_checklist_items")
      .update({
        completed_at: checked ? new Date().toISOString() : null,
        photo_url: checked ? row.photo_url : null,
      })
      .eq("id", row.id);
    setBusy(null);
    router.refresh();
  }

  async function onPhoto(row: CheckRow, file: File | null) {
    if (!file || !cleanerId) return;
    setPhotoError(null);
    setBusy(row.id);
    try {
      const prepared = await compressImageForUpload(file);
      const fd = new FormData();
      fd.append("checklistItemId", row.id);
      fd.append("file", prepared);

      const res = await fetch("/api/crew/checklist-photo", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok || !data.ok) {
        setPhotoError(data.error ?? "Could not upload photo.");
        return;
      }
    } catch (e) {
      setPhotoError(friendlyFetchFailureMessage(e));
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  async function completeJob() {
    if (!activeJobId || !allDone || !photoRequiredOk) return;
    setBusy("done");
    const supabase = createClient();
    await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", activeJobId);
    setBusy(null);
    router.refresh();
  }

  async function claimJob(jobId: string) {
    setClaimError(null);
    setClaimNotice(null);
    setBusy(`claim:${jobId}`);
    try {
      const res = await fetch("/api/crew/jobs/claim", {
        ...sameOriginJsonPost,
        body: JSON.stringify({ jobId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setClaimError(data.error ?? "Could not claim this job.");
        return;
      }
      setClaimNotice("Job claimed. Route updated.");
      router.refresh();
    } catch (e) {
      setClaimError(friendlyFetchFailureMessage(e));
    } finally {
      setBusy(null);
    }
  }

  const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <div className="mt-6 space-y-6">
      {gpsShareError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
          {gpsShareError}
        </p>
      ) : null}
      {gpsShareSuccess ? (
        <p
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200"
          role="status"
        >
          {gpsShareSuccess}
        </p>
      ) : null}
      {claimNotice ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          {claimNotice}
        </p>
      ) : null}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {siteConfig.fieldRouteStripLabel}
        </p>
        {routeOptimization?.optimizerAvailable ? (
          <div className="mb-3 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {siteConfig.fieldRouteOrderLabel}
                </span>
                <div className="inline-flex rounded-lg border border-border/80 bg-muted/20 p-0.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={routeMode === "appointment" ? "default" : "ghost"}
                    className="h-8 rounded-md px-3 text-xs"
                    onClick={() => setRouteMode("appointment")}
                  >
                    {siteConfig.fieldRouteByAppointment}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={routeMode === "drive" ? "default" : "ghost"}
                    className="h-8 rounded-md px-3 text-xs"
                    onClick={() => setRouteMode("drive")}
                  >
                    {siteConfig.fieldRouteByDrive}
                  </Button>
                </div>
              </div>
              {milesCaption ? (
                <p className="text-xs text-muted-foreground">{milesCaption}</p>
              ) : null}
            </div>
            {routeMode === "drive" && !routeOptimization.driveMatchesAppointments ? (
              <p className="text-xs text-amber-800 dark:text-amber-200/90">
                {siteConfig.fieldRouteDriveOrderWarning}
              </p>
            ) : null}
            <p className="text-[11px] leading-snug text-muted-foreground/90">
              {siteConfig.fieldRouteOrderHint}
            </p>
          </div>
        ) : null}
        <div
          className={cn(
            "flex min-h-11 flex-wrap items-center gap-2 overflow-x-auto rounded-xl border px-3 py-2",
            routeJobs.length
              ? "border-border/80 bg-card/40"
              : "border-dashed border-border/80 bg-muted/20"
          )}
        >
          {routeJobs.length ? (
            routeJobs.map((j) => (
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
              </Button>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">
              {crewAssignmentReady ? siteConfig.fieldRouteStripEmpty : siteConfig.fieldRouteStripPending}
            </span>
          )}
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
              </CardTitle>
              <CardDescription>
                {activeJob.city}, {activeJob.state} {activeJob.zip}
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
              {mapKey && stopMapCenter ? (
                <APIProvider apiKey={mapKey}>
                  <div className="h-48 overflow-hidden rounded-xl border border-border/80">
                    <GoogleMap
                      key={`job-${activeJob.id}-${stopMapCenter.lat.toFixed(4)}-${stopMapCenter.lng.toFixed(4)}`}
                      defaultCenter={deviceLocation ?? stopMapCenter}
                      defaultZoom={14}
                      mapId="empire-cleaner-field"
                      gestureHandling="greedy"
                    >
                      <FieldMapCamera
                        a={stopMapCenter}
                        b={deviceLocation}
                        fallbackCenter={stopMapCenter}
                        fallbackZoom={14}
                      />
                      <AdvancedMarker position={stopMapCenter} title="Job">
                        <div className="size-3 rounded-full border-2 border-white bg-amber-500 shadow-md" />
                      </AdvancedMarker>
                      {deviceLocation ? (
                        <AdvancedMarker position={deviceLocation} title="You">
                          <div className="size-3.5 rounded-full border-2 border-white bg-blue-600 shadow-md ring-2 ring-blue-400/40" />
                        </AdvancedMarker>
                      ) : null}
                    </GoogleMap>
                  </div>
                </APIProvider>
              ) : !mapKey ? (
                <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
                  <MapIcon className="mr-2 size-4" />
                  Add a Maps API key for turn-by-turn context.
                </div>
              ) : null}
              {activeJob.lat == null || activeJob.lng == null ? (
                <p className="text-xs text-muted-foreground">
                  If the pin looks rough, it is from the job ZIP until we store a street-level
                  coordinate (new bookings geocode when your Maps key allows it).
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!cleanerId || busy === "gps"}
                  onClick={() => void shareLocation()}
                >
                  {busy === "gps" ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Getting location…
                    </>
                  ) : (
                    "Share GPS with dispatch"
                  )}
                </Button>
                {stopMapCenter ? (
                  <a
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${stopMapCenter.lat},${stopMapCenter.lng}`}
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
                Crew pool is {getCommissionPoolPercent()}% of the booking, split{" "}
                {getCrewSplitWays()} way{getCrewSplitWays() === 1 ? "" : "s"}. Your share is
                calculated when you clock out—see payouts below. Bonuses:{" "}
                {formatUsd(getQualityBonusCents())} quality + {formatUsd(getOnTimeBonusCents())}{" "}
                on-time (within {getOnTimeWindowMinutes()} min of start).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {!clock.entryId ? (
                <Button type="button" onClick={clockIn} disabled={busy === "in"}>
                  {busy === "in" ? <Loader2 className="size-4 animate-spin" /> : "Clock in"}
                </Button>
              ) : (
                <Button type="button" variant="destructive" onClick={clockOut} disabled={busy === "out"}>
                  {busy === "out" ? <Loader2 className="size-4 animate-spin" /> : "Clock out"}
                </Button>
              )}
              {clock.startedAt ? (
                <p className="text-sm text-muted-foreground">
                  Started {new Date(clock.startedAt).toLocaleTimeString()}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Landmark className="size-5 text-primary" />
                Auto payouts
              </CardTitle>
              <CardDescription>
                Contractor payouts are created on clock-out and pushed to your connected payout
                account when available.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {payoutNotice ? (
                <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  {payoutNotice}
                </p>
              ) : null}
              {!payouts.length ? (
                <p className="text-sm text-muted-foreground">
                  No payout records yet. Clock out of a completed stop to generate one.
                </p>
              ) : (
                <div className="space-y-2">
                  {payouts.map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium">{formatUsd(p.amount_cents)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(p.created_at).toLocaleString()}
                        </p>
                        {p.failure_reason ? (
                          <p className="text-xs text-destructive">{p.failure_reason}</p>
                        ) : null}
                      </div>
                      <Badge variant={p.status === "paid" ? "secondary" : "outline"}>
                        {payoutLabel(p.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle>Room-by-room checklist</CardTitle>
              <CardDescription>
                Photo proof required for Kitchen and Master bath before completion.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {photoError ? (
                <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {photoError}
                </p>
              ) : null}
              <Progress value={progress} />
              {items.map((row) => (
                <div
                  key={row.id}
                  className="rounded-xl border border-border/70 bg-card/60 px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!!row.completed_at}
                      disabled={row.requires_photo && !row.photo_url}
                      onCheckedChange={(v) => toggleRoom(row, v === true)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium leading-tight">{row.label}</p>
                        {row.requires_photo ? (
                          <span className="text-xs font-medium text-amber-700">Photo required</span>
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
                disabled={!allDone || !photoRequiredOk || busy === "done"}
                onClick={completeJob}
              >
                {busy === "done" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Mark job complete"
                )}
              </Button>
              {!photoRequiredOk ? (
                <p className="text-xs text-destructive">
                  Complete required photo rooms (Kitchen &amp; Master bath) first.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}

      {!routeJobs.length ? (
        <Card className="border-dashed border-border/80 bg-muted/10">
          <CardHeader>
            <CardTitle className="text-lg">
              {crewAssignmentReady ? siteConfig.fieldNoRouteCardTitle : siteConfig.fieldPendingCrewCardTitle}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed">
              {crewAssignmentReady ? siteConfig.fieldNoRouteCardBody : siteConfig.fieldPendingCrewCardBody}
            </CardDescription>
          </CardHeader>
          {mapKey ? (
            <CardContent className="pt-0">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {deviceLocation
                    ? "Blue pin: your location. Sky pin: crew base when assigned."
                    : "Crew base map (no stops assigned yet). Allow location to see where you are."}
                </p>
                <APIProvider apiKey={mapKey}>
                  <div className="h-52 overflow-hidden rounded-xl border border-border/80">
                    <GoogleMap
                      key={`base-${baseMapCenter.lat.toFixed(4)}-${baseMapCenter.lng.toFixed(4)}`}
                      defaultCenter={deviceLocation ?? baseMapCenter}
                      defaultZoom={11}
                      mapId="empire-cleaner-field-empty"
                      gestureHandling="greedy"
                    >
                      <FieldMapCamera
                        a={teamBase ?? null}
                        b={deviceLocation}
                        fallbackCenter={baseMapCenter}
                        fallbackZoom={teamBase ? 11 : deviceLocation ? 12 : 11}
                      />
                      {teamBase ? (
                        <AdvancedMarker position={teamBase} title="Crew base">
                          <div className="size-3 rounded-full border-2 border-white bg-sky-500 shadow-md" />
                        </AdvancedMarker>
                      ) : null}
                      {deviceLocation ? (
                        <AdvancedMarker position={deviceLocation} title="You">
                          <div className="size-3.5 rounded-full border-2 border-white bg-blue-600 shadow-md ring-2 ring-blue-400/40" />
                        </AdvancedMarker>
                      ) : !teamBase ? (
                        <AdvancedMarker position={baseMapCenter} title="Area">
                          <div className="size-3 rounded-full border-2 border-white bg-muted-foreground shadow-md" />
                        </AdvancedMarker>
                      ) : null}
                    </GoogleMap>
                  </div>
                </APIProvider>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={!cleanerId || busy === "gps"}
                    onClick={() => void shareLocation()}
                  >
                    {busy === "gps" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Share location now"
                    )}
                  </Button>
                  {!cleanerId ? (
                    <p className="text-xs text-muted-foreground">
                      Location sharing becomes available after crew access is fully linked.
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          ) : null}
          {claimableJobs.length ? (
            <CardContent className={cn(mapKey && teamBase ? "pt-0" : undefined)}>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Available jobs to claim
                </p>
                {claimError ? (
                  <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {claimError}
                  </p>
                ) : null}
                <div className="space-y-2">
                  {claimableJobs.map((j) => (
                    <div
                      key={j.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{j.address_line}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(j.scheduled_start).toLocaleString()} · {j.city}, {j.state}{" "}
                          {j.zip} · {j.bedrooms}bd/{j.bathrooms}ba · {j.square_footage} sq ft
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => claimJob(j.id)}
                          disabled={busy === `claim:${j.id}`}
                        >
                          {busy === `claim:${j.id}` ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            "Claim"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
