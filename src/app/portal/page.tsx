import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import {
  computeNextCleaningIso,
  formatBillingFrequencyLabel,
} from "@/lib/portal-schedule";
import { CustomerPortal } from "@/components/portal/customer-portal";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortalPage({
  searchParams,
}: {
  searchParams: Promise<{ tip_paid?: string; onboarding?: string }>;
}) {
  const sp = await searchParams;
  const tipPaidSuccess = sp.tip_paid === "1";
  const onboardingSavedSuccess = sp.onboarding === "1";

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return (
      <SiteShell>
        <p className="mx-auto max-w-lg px-4 py-20 text-center text-muted-foreground">
          Set <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          in <code className="rounded bg-muted px-1">.env.local</code>.
        </p>
      </SiteShell>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/portal");
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, address_line, city, state, zip, access_notes, pets_notes, parking_notes, onboarding_completed_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: club } = await supabase
    .from("club_memberships")
    .select("tier, status, current_period_end")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!customer) {
    return (
      <SiteShell>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">No bookings yet</h1>
          <p className="mt-2 text-muted-foreground">
            Complete a subscription checkout to create your customer profile and first job.
          </p>
          <Link href="/book" className={cn(buttonVariants({ className: "mt-6" }))}>
            Book now
          </Link>
        </div>
      </SiteShell>
    );
  }

  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", customer.id)
    .order("scheduled_start", { ascending: true });

  const { data: recurringSchedules } = await supabase
    .from("recurring_schedules")
    .select("frequency, next_service_at")
    .eq("customer_id", customer.id)
    .eq("is_active", true);

  const schedules = recurringSchedules ?? [];
  const hasActiveSubscription = schedules.length > 0;
  const subscriptionPlanLabel = formatBillingFrequencyLabel(schedules[0]?.frequency);
  const nextCleaningIso = computeNextCleaningIso({
    jobs: jobs ?? [],
    recurringSchedules: schedules,
  });

  const teamIds = [...new Set((jobs ?? []).map((j) => j.team_id).filter(Boolean))] as string[];
  const jobIds = (jobs ?? []).map((j) => j.id);

  let cleanersByTeam: Record<
    string,
    {
      id: string;
      bio: string | null;
      photo_url: string | null;
      profiles: { full_name: string | null; avatar_url: string | null } | null;
    }[]
  > = {};

  let photoProofByJob: Record<
    string,
    { id: string; label: string; photo_url: string; completed_at: string | null }[]
  > = {};

  if (teamIds.length) {
    const { data: cleaners } = await supabase
      .from("cleaners")
      .select("id, team_id, bio, photo_url, profile_id")
      .in("team_id", teamIds);

    const profileIds = [...new Set((cleaners ?? []).map((c) => c.profile_id))];
    const { data: profiles } = profileIds.length
      ? await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", profileIds)
      : { data: [] as { id: string; full_name: string | null; avatar_url: string | null }[] };

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p])
    );

    cleanersByTeam = (cleaners ?? []).reduce(
      (acc, row) => {
        const tid = row.team_id as string | null;
        if (!tid) return acc;
        if (!acc[tid]) acc[tid] = [];
        const p = profileMap[row.profile_id];
        acc[tid].push({
          id: row.id,
          bio: row.bio,
          photo_url: row.photo_url,
          profiles: p
            ? { full_name: p.full_name, avatar_url: p.avatar_url }
            : null,
        });
        return acc;
      },
      {} as typeof cleanersByTeam
    );
  }

  if (jobIds.length) {
    const { data: photos } = await supabase
      .from("job_checklist_items")
      .select("id, job_id, label, photo_url, completed_at")
      .in("job_id", jobIds)
      .not("photo_url", "is", null);

    photoProofByJob = (photos ?? []).reduce(
      (acc, row) => {
        if (!row.job_id || !row.photo_url) return acc;
        if (!acc[row.job_id]) acc[row.job_id] = [];
        acc[row.job_id].push({
          id: row.id,
          label: row.label,
          photo_url: row.photo_url,
          completed_at: row.completed_at,
        });
        return acc;
      },
      {} as typeof photoProofByJob
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {siteConfig.portalHeadline}
            </h1>
            <p className="mt-1 text-muted-foreground">{siteConfig.portalSub}</p>
            {hasActiveSubscription ? (
              <p className="mt-2 text-sm text-primary/90">{siteConfig.portalSubscribedHint}</p>
            ) : null}
          </div>
          <Link href="/book" className={cn(buttonVariants({ variant: "outline" }))}>
            {hasActiveSubscription ? "Manage plan" : "Book a visit"}
          </Link>
        </div>
        <CustomerPortal
          initialJobs={jobs ?? []}
          cleanersByTeam={cleanersByTeam}
          photoProofByJob={photoProofByJob}
          hasActiveSubscription={hasActiveSubscription}
          nextCleaningIso={nextCleaningIso}
          subscriptionPlanLabel={subscriptionPlanLabel}
          tipPaidSuccess={tipPaidSuccess}
          onboardingSavedSuccess={onboardingSavedSuccess}
          clubMembership={
            club?.status === "active"
              ? {
                  tier: club.tier as string,
                  currentPeriodEnd: club.current_period_end ?? null,
                }
              : null
          }
          onboardingProfile={
            customer
              ? {
                  addressLine: customer.address_line,
                  city: customer.city,
                  state: customer.state,
                  zip: customer.zip,
                  accessNotes: customer.access_notes,
                  petsNotes: customer.pets_notes,
                  parkingNotes: customer.parking_notes,
                  completedAt: customer.onboarding_completed_at,
                }
              : null
          }
        />
      </div>
    </SiteShell>
  );
}
