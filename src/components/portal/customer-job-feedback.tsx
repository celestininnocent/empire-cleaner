"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type JobFeedbackJob = {
  id: string;
  status: string;
  scheduled_start: string;
  customer_approved_at: string | null;
  customer_rating: number | null;
  customer_review: string | null;
};

export function CustomerJobFeedback({ job }: { job: JobFeedbackJob }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(job.customer_rating ?? 0);
  const [note, setNote] = useState(job.customer_review ?? "");
  /** Snapshot at mount — sufficient for “visit time has passed” gating on the portal. */
  const [pageLoadedAt] = useState(() => Date.now());

  const saved = Boolean(job.customer_approved_at && job.customer_rating != null);
  const visitStartedOrPast = pageLoadedAt >= new Date(job.scheduled_start).getTime();
  const crewMarkedDone = job.status === "completed";
  const canSubmit = !saved && (crewMarkedDone || visitStartedOrPast);

  async function submit() {
    if (rating < 1 || rating > 5) return;
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("jobs")
      .update({
        customer_rating: rating,
        customer_review: note.trim() || null,
        customer_approved_at: new Date().toISOString(),
      })
      .eq("id", job.id);
    setBusy(false);
    if (upErr) {
      const msg = upErr.message ?? "";
      setError(
        /customer_rating|customer_approved|schema|column/i.test(msg)
          ? "Rating isn’t available until the latest database migration is applied (see `012_job_customer_rating.sql` in the repo). Ask your admin to run it in Supabase."
          : msg
      );
      return;
    }
    router.refresh();
  }

  if (saved) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
          {siteConfig.portalRateSaved}
        </p>
        <div className="mt-2 flex items-center gap-0.5" aria-label={`Rated ${job.customer_rating} out of 5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "size-5",
                i < (job.customer_rating ?? 0)
                  ? "fill-amber-400 text-amber-500"
                  : "text-muted-foreground/40"
              )}
            />
          ))}
        </div>
        {job.customer_review?.trim() ? (
          <p className="mt-2 text-sm text-muted-foreground">&ldquo;{job.customer_review.trim()}&rdquo;</p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          Confirmed{" "}
          {job.customer_approved_at
            ? new Date(job.customer_approved_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : ""}
        </p>
      </div>
    );
  }

  if (!canSubmit) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {siteConfig.portalRateWait}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{siteConfig.portalRateTitle}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{siteConfig.portalRateSubtitle}</p>
      </div>
      <div className="space-y-2">
        <Label>{siteConfig.portalRateStarsLabel}</Label>
        <div className="flex gap-1" role="group" aria-label="Rating 1 to 5 stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="rounded-md p-1 transition-colors hover:bg-muted"
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              aria-pressed={rating === n}
            >
              <Star
                className={cn(
                  "size-9",
                  n <= rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/50"
                )}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`review-${job.id}`}>{siteConfig.portalRateNoteLabel}</Label>
        <Textarea
          id={`review-${job.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder={siteConfig.portalRateNotePlaceholder}
          rows={3}
          className="resize-none"
          maxLength={500}
        />
      </div>
      <p className="text-xs text-muted-foreground">{siteConfig.portalRateConfirmHint}</p>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="button" disabled={busy || rating < 1} onClick={() => void submit()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : siteConfig.portalRateSubmit}
      </Button>
    </div>
  );
}
