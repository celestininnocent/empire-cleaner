"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Heart, Loader2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";
import { getPropertyTypeLabel } from "@/lib/property-types";
import { getServiceTierShortLabel } from "@/lib/service-tiers";
import { formatUsd } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CustomerJobFeedback } from "@/components/portal/customer-job-feedback";
import {
  formatNextCleaningLine,
} from "@/lib/portal-schedule";
import { friendlyFetchFailureMessage, sameOriginJsonPost } from "@/lib/network-error";

type JobRow = {
  id: string;
  team_id: string | null;
  status: string;
  scheduled_start: string;
  price_cents: number;
  address_line: string;
  zip: string;
  property_type?: string | null;
  service_tier?: string | null;
  customer_notes?: string | null;
  customer_approved_at?: string | null;
  customer_rating?: number | null;
  customer_review?: string | null;
};

type CleanerPreview = {
  id: string;
  bio: string | null;
  photo_url: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
};

type OnboardingProfile = {
  addressLine: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  accessNotes: string | null;
  petsNotes: string | null;
  parkingNotes: string | null;
  completedAt: string | null;
};

function formatOnboardingAddress(p: OnboardingProfile): string {
  const line = [
    p.addressLine?.trim(),
    [p.city?.trim(), p.state?.trim()].filter(Boolean).join(", "),
    p.zip?.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  return line || "Not on file yet.";
}

function NextCleaningHero({
  nextCleaningIso,
  hasActiveSubscription,
  subscriptionPlanLabel,
}: {
  nextCleaningIso: string | null;
  hasActiveSubscription: boolean;
  subscriptionPlanLabel: string | null;
}) {
  if (nextCleaningIso) {
    const line = formatNextCleaningLine(nextCleaningIso);
    const title = hasActiveSubscription
      ? siteConfig.portalNextCleaningLabel
      : siteConfig.portalNextVisitLabel;
    return (
      <Card className="border-primary/25 bg-gradient-to-br from-primary/[0.07] via-background to-background shadow-sm">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {hasActiveSubscription ? (
              <Badge variant="secondary" className="font-normal">
                {siteConfig.portalSubscriptionBadge}
              </Badge>
            ) : null}
            {hasActiveSubscription && subscriptionPlanLabel ? (
              <span className="text-xs text-muted-foreground">
                {siteConfig.portalPlanLabel}: {subscriptionPlanLabel}
              </span>
            ) : null}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {line}
            </p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (hasActiveSubscription) {
    return (
      <Card className="border-primary/20 bg-primary/[0.04] shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {siteConfig.portalSubscriptionBadge}
            </Badge>
            {subscriptionPlanLabel ? (
              <span className="text-xs text-muted-foreground">
                {siteConfig.portalPlanLabel}: {subscriptionPlanLabel}
              </span>
            ) : null}
          </div>
          <CardDescription className="text-base leading-relaxed">
            {siteConfig.portalSubscriptionActiveNoDate}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return null;
}

export function CustomerPortal({
  initialJobs,
  cleanersByTeam,
  photoProofByJob,
  hasActiveSubscription,
  nextCleaningIso,
  subscriptionPlanLabel,
  tipPaidSuccess = false,
  onboardingSavedSuccess = false,
  onboardingProfile = null,
}: {
  initialJobs: JobRow[];
  cleanersByTeam: Record<string, CleanerPreview[]>;
  photoProofByJob: Record<
    string,
    { id: string; label: string; photo_url: string; completed_at: string | null }[]
  >;
  hasActiveSubscription: boolean;
  nextCleaningIso: string | null;
  subscriptionPlanLabel: string | null;
  tipPaidSuccess?: boolean;
  onboardingSavedSuccess?: boolean;
  onboardingProfile?: OnboardingProfile | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  async function reschedule(job: JobRow, value: string) {
    if (!value) return;
    setActionError(null);
    setActionSuccess(null);
    setBusy(job.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("jobs")
      .update({ scheduled_start: new Date(value).toISOString() })
      .eq("id", job.id);
    setBusy(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    router.refresh();
  }

  async function tip(jobId: string, amountUsd: number) {
    if (!amountUsd || amountUsd <= 0) return;
    setActionError(null);
    setActionSuccess(null);
    setBusy(`tip-${jobId}`);
    const amountCents = Math.round(amountUsd * 100);
    try {
      const res = await fetch("/api/stripe/tip-checkout", {
        ...sameOriginJsonPost,
        body: JSON.stringify({ jobId, amountCents }),
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Could not start tip checkout.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setActionError("Could not start tip checkout.");
    } catch (err) {
      setActionError(friendlyFetchFailureMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function cancelJob(jobId: string) {
    const confirmed = window.confirm(
      "Cancel this booking? This cannot be undone from the portal."
    );
    if (!confirmed) return;

    setActionError(null);
    setActionSuccess(null);
    setBusy(`cancel-${jobId}`);
    try {
      const res = await fetch("/api/portal/jobs/cancel", {
        ...sameOriginJsonPost,
        body: JSON.stringify({ jobId }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error ?? "Could not cancel booking.");
        return;
      }
      setActionSuccess("Booking cancelled.");
      router.refresh();
    } catch (err) {
      setActionError(friendlyFetchFailureMessage(err));
    } finally {
      setBusy(null);
    }
  }

  if (!initialJobs.length) {
    const subscriptionWaiting = hasActiveSubscription && !nextCleaningIso;
    return (
      <div className="space-y-6">
        <NextCleaningHero
          nextCleaningIso={nextCleaningIso}
          hasActiveSubscription={hasActiveSubscription}
          subscriptionPlanLabel={subscriptionPlanLabel}
        />
        {!subscriptionWaiting ? (
          <Card>
            <CardHeader>
              <CardTitle>No visit details in your list yet</CardTitle>
              <CardDescription>
                {nextCleaningIso
                  ? "Your next time is shown above. Address, crew, and rescheduling appear here once that visit is linked in your account."
                  : "When you book a visit, it will show up here with crew details and rescheduling."}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <NextCleaningHero
        nextCleaningIso={nextCleaningIso}
        hasActiveSubscription={hasActiveSubscription}
        subscriptionPlanLabel={subscriptionPlanLabel}
      />
      {tipPaidSuccess ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          Tip payment successful. Thank you for supporting your crew.
        </p>
      ) : null}
      {onboardingSavedSuccess ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          Arrival details saved. Your crew now has your access, parking, and pet notes.
        </p>
      ) : null}
      {actionError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}
      {actionSuccess ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-900 dark:text-emerald-200">
          {actionSuccess}
        </p>
      ) : null}
      {onboardingProfile ? (
        <Card className="border-border/80 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Home access profile</CardTitle>
            <CardDescription>
              Dispatch and your assigned crew use these details to arrive prepared.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Service address</p>
              <p className="mt-1 text-sm text-foreground">
                {formatOnboardingAddress(onboardingProfile)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Last updated</p>
              <p className="mt-1 text-sm text-foreground">
                {onboardingProfile.completedAt
                  ? new Date(onboardingProfile.completedAt).toLocaleString()
                  : "Not completed yet"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Access instructions</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {onboardingProfile.accessNotes?.trim() || "No access notes yet."}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pets</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {onboardingProfile.petsNotes?.trim() || "No pet notes yet."}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Parking</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                {onboardingProfile.parkingNotes?.trim() || "No parking notes yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {initialJobs.map((job) => {
        const proofPhotos = photoProofByJob[job.id] ?? [];
        const cleaners =
          job.team_id && cleanersByTeam[job.team_id]
            ? cleanersByTeam[job.team_id]
            : [];
        const localStart = new Date(job.scheduled_start);
        const localValue = new Date(
          localStart.getTime() - localStart.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        const canSelfCancel =
          (job.status === "scheduled" || job.status === "assigned") &&
          localStart.getTime() - Date.now() >= 24 * 60 * 60 * 1000;

        return (
          <Card key={job.id} className="overflow-hidden border-border/80 shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border/60 bg-muted/20 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                  <CalendarClock className="size-5 text-primary" />
                  {localStart.toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  <Badge variant="secondary" className="font-normal">
                    {getServiceTierShortLabel(job.service_tier ?? undefined)}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {getPropertyTypeLabel(job.property_type ?? undefined)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {job.address_line} · {job.zip} · {job.status.replace("_", " ")}
                </CardDescription>
                {job.customer_notes?.trim() ? (
                  <div className="mt-3 max-w-2xl rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {siteConfig.portalJobNotesHeading}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                      {job.customer_notes.trim()}
                    </p>
                  </div>
                ) : null}
              </div>
              <p className="text-sm font-medium text-primary">
                {formatUsd(job.price_cents)} per visit
              </p>
            </CardHeader>
            <CardContent className="grid gap-8 pt-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {siteConfig.portalCrewHeading}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Two-person crews · vetted · photo ID on file.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  {cleaners.length ? (
                    cleaners.map((c) => (
                      <div key={c.id} className="flex min-w-[200px] items-start gap-3">
                        <Avatar className="size-14 border border-border/80">
                          <AvatarImage src={c.photo_url ?? undefined} alt="" />
                          <AvatarFallback>
                            {(c.profiles?.full_name ?? "?").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium leading-tight">
                            {c.profiles?.full_name ?? "Cleaner"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-3">
                            {c.bio ?? siteConfig.cleanerBioFallback}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Team assignment pending dispatch optimization.
                    </p>
                  )}
                </div>
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    Proof of clean photos
                  </h3>
                  {proofPhotos.length ? (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {proofPhotos.map((p) => (
                        <a
                          key={p.id}
                          href={p.photo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="group block overflow-hidden rounded-lg border border-border/70 bg-card"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.photo_url}
                            alt={p.label}
                            className="h-24 w-full object-cover transition-transform group-hover:scale-[1.02]"
                          />
                          <div className="px-2 py-1.5">
                            <p className="truncate text-[11px] font-medium">{p.label}</p>
                            {p.completed_at ? (
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(p.completed_at).toLocaleString()}
                              </p>
                            ) : null}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Photos appear here once the crew uploads checklist proof.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor={`reschedule-${job.id}`}>Reschedule</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id={`reschedule-${job.id}`}
                      type="datetime-local"
                      defaultValue={localValue}
                      className="max-w-xs"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy === job.id}
                      onClick={(e) => {
                        const input = (
                          e.currentTarget
                            .previousElementSibling as HTMLInputElement | null
                        );
                        if (input?.value) reschedule(job, input.value);
                      }}
                    >
                      {busy === job.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cancel booking</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={!canSelfCancel || busy === `cancel-${job.id}`}
                      onClick={() => cancelJob(job.id)}
                    >
                      {busy === `cancel-${job.id}` ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Cancel booking"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {canSelfCancel
                        ? "Available up to 24 hours before your visit."
                        : "Online cancel is locked within 24 hours. Please contact support."}
                    </p>
                  </div>
                </div>

                <Separator />

                <CustomerJobFeedback
                  job={{
                    id: job.id,
                    status: job.status,
                    scheduled_start: job.scheduled_start,
                    customer_approved_at: job.customer_approved_at ?? null,
                    customer_rating: job.customer_rating ?? null,
                    customer_review: job.customer_review ?? null,
                  }}
                />

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor={`tip-${job.id}`}>Tip the team</Label>
                  <div className="flex flex-wrap gap-2">
                    <Input
                      id={`tip-${job.id}`}
                      type="number"
                      min={1}
                      step={1}
                      placeholder="Amount (USD)"
                      className="max-w-[140px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy === `tip-${job.id}`}
                      onClick={(e) => {
                        const input = e.currentTarget
                          .previousElementSibling as HTMLInputElement | null;
                        const v = parseFloat(input?.value ?? "0");
                        tip(job.id, v);
                      }}
                    >
                      {busy === `tip-${job.id}` ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <Heart className="size-4" />
                          Send tip
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{siteConfig.tipNote}</p>
                </div>
              </div>
            </CardContent>
            <div className="flex items-center gap-2 border-t border-border/60 bg-primary/[0.03] px-6 py-3 text-xs text-primary">
              <Sparkles className="size-3.5 shrink-0" />
              {siteConfig.servicePromise}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
