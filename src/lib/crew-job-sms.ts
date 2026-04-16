import { siteConfig } from "@/config/site";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isSmsConfigured, normalizeUsPhoneToE164 } from "@/lib/sms";
import { queueOutboundSms, processSmsQueueBatch } from "@/lib/sms-queue";
import { getPropertyTypeLabel } from "@/lib/property-types";
import { getServiceTierShortLabel } from "@/lib/service-tiers";

/**
 * Texts everyone on the job’s crew who has a mobile on `profiles.phone`.
 * Safe to call when Twilio env is missing (no-op).
 */
export async function notifyCrewMembersJobAssigned(jobId: string): Promise<void> {
  if (!isSmsConfigured()) return;

  const admin = createServiceRoleClient();
  if (!admin) return;

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, scheduled_start, address_line, city, state, zip, team_id, property_type, service_tier, customer_notes")
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job?.team_id) return;

  const { data: cleaners } = await admin
    .from("cleaners")
    .select("profile_id")
    .eq("team_id", job.team_id);

  const profileIds = [...new Set((cleaners ?? []).map((c) => c.profile_id as string))];
  if (!profileIds.length) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("phone")
    .in("id", profileIds);

  const targets = new Set<string>();
  for (const p of profiles ?? []) {
    const ph = p.phone?.trim();
    if (!ph) continue;
    const e164 = normalizeUsPhoneToE164(ph);
    if (e164) targets.add(e164);
  }
  if (!targets.size) return;

  const when = new Date(job.scheduled_start as string).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const addr = [job.address_line, job.city, job.state, job.zip].filter(Boolean).join(", ");
  const serviceTier = getServiceTierShortLabel(job.service_tier ?? undefined);
  const propertyType = getPropertyTypeLabel(job.property_type ?? undefined);
  const notesRaw = job.customer_notes?.trim() ?? "";
  const notesSnippet = notesRaw
    ? `Customer notes: ${notesRaw.slice(0, 90)}${notesRaw.length > 90 ? "…" : ""}. `
    : "";

  for (const to of targets) {
    const r = await queueOutboundSms({
      toPhone: to,
      templateKey: "crew_job_assigned",
      routingKind: "crew",
      teamId: job.team_id,
      jobId: job.id,
      vars: {
        brand: siteConfig.businessName,
        when,
        address: addr,
        service_tier: serviceTier,
        property_type: propertyType,
        notes_snippet: notesSnippet,
      },
    });
    if (!r.ok) console.error("[crew-job-sms] queue failed:", to.slice(0, 6), r.error);
  }
  await processSmsQueueBatch(20);
}

/**
 * Alerts nearby/same-ZIP crews when a new unclaimed stop is created.
 * Safe to call when Twilio env is missing (no-op).
 */
export async function notifyCrewMembersJobUnclaimed(jobId: string): Promise<void> {
  if (!isSmsConfigured()) return;

  const admin = createServiceRoleClient();
  if (!admin) return;

  const { data: job, error: jobErr } = await admin
    .from("jobs")
    .select("id, scheduled_start, address_line, city, state, zip, team_id, property_type, service_tier")
    .eq("id", jobId)
    .maybeSingle();
  if (jobErr || !job?.id) return;
  if (job.team_id) return;

  const zip = String(job.zip ?? "").trim();
  if (!zip) return;

  const { data: teams } = await admin
    .from("teams")
    .select("id")
    .eq("zip_code", zip)
    .eq("is_available", true);
  const teamIds = [...new Set((teams ?? []).map((t) => t.id as string))];
  if (!teamIds.length) return;

  const { data: cleaners } = await admin
    .from("cleaners")
    .select("profile_id, team_id")
    .in("team_id", teamIds);
  const profileIds = [...new Set((cleaners ?? []).map((c) => c.profile_id as string))];
  if (!profileIds.length) return;

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, phone")
    .in("id", profileIds);

  const teamIdByProfile = new Map<string, string>();
  for (const c of cleaners ?? []) {
    if (!c.profile_id || !c.team_id) continue;
    if (!teamIdByProfile.has(c.profile_id as string)) {
      teamIdByProfile.set(c.profile_id as string, c.team_id as string);
    }
  }

  const when = new Date(job.scheduled_start as string).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const addr = [job.address_line, job.city, job.state, job.zip].filter(Boolean).join(", ");
  const serviceTier = getServiceTierShortLabel(job.service_tier ?? undefined);
  const propertyType = getPropertyTypeLabel(job.property_type ?? undefined);

  for (const p of profiles ?? []) {
    const raw = p.phone?.trim();
    if (!raw) continue;
    const to = normalizeUsPhoneToE164(raw);
    if (!to) continue;
    const teamId = teamIdByProfile.get(String(p.id)) ?? null;

    const r = await queueOutboundSms({
      toPhone: to,
      templateKey: "crew_job_unclaimed",
      routingKind: "crew",
      profileId: String(p.id),
      teamId,
      jobId: job.id,
      vars: {
        brand: siteConfig.businessName,
        when,
        address: addr,
        service_tier: serviceTier,
        property_type: propertyType,
      },
    });
    if (!r.ok) console.error("[crew-job-sms] unclaimed queue failed:", to.slice(0, 6), r.error);
  }

  await processSmsQueueBatch(20);
}
