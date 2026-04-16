import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { isSmsConfigured, sendSms } from "@/lib/sms";
import { renderSmsTemplate } from "@/lib/sms-templates";
import { siteConfig } from "@/config/site";

export type SmsRoutingKind = "system" | "crew" | "customer";

export async function getActiveTemplateBody(
  templateKey: string
): Promise<string | null> {
  const sb = createServiceRoleClient();
  if (!sb) return null;
  const { data } = await sb
    .from("sms_templates")
    .select("body, is_active")
    .eq("template_key", templateKey)
    .maybeSingle();
  if (!data?.is_active) return null;
  return data.body;
}

export async function queueOutboundSms(input: {
  toPhone: string;
  body?: string;
  templateKey?: string;
  vars?: Record<string, string | number | null | undefined>;
  routingKind?: SmsRoutingKind;
  profileId?: string | null;
  teamId?: string | null;
  jobId?: string | null;
}) {
  const sb = createServiceRoleClient();
  if (!sb) return { ok: false as const, error: "Service role not configured" };

  let body = input.body?.trim() || "";
  if (!body && input.templateKey) {
    const template = await getActiveTemplateBody(input.templateKey);
    if (!template) {
      return { ok: false as const, error: `Template not found/active: ${input.templateKey}` };
    }
    body = renderSmsTemplate(template, {
      brand: siteConfig.businessName,
      ...(input.vars ?? {}),
    }).trim();
  }
  if (!body) {
    return { ok: false as const, error: "SMS body is empty" };
  }

  const { data, error } = await sb
    .from("sms_messages")
    .insert({
      direction: "outbound",
      routing_kind: input.routingKind ?? "system",
      template_key: input.templateKey ?? null,
      body,
      to_phone: input.toPhone,
      from_phone: process.env.TWILIO_FROM_NUMBER?.trim() ?? null,
      profile_id: input.profileId ?? null,
      team_id: input.teamId ?? null,
      job_id: input.jobId ?? null,
      status: "queued",
      retry_count: 0,
      next_attempt_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false as const, error: error?.message ?? "Queue insert failed" };
  }
  return { ok: true as const, id: data.id };
}

function nextRetryIso(retryCount: number): string {
  const minutes = retryCount <= 1 ? 1 : retryCount === 2 ? 5 : 15;
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export async function processSmsQueueBatch(limit = 25): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const sb = createServiceRoleClient();
  if (!sb) return { processed: 0, sent: 0, failed: 0 };

  const { data: rows } = await sb
    .from("sms_messages")
    .select("id, body, to_phone, retry_count")
    .eq("direction", "outbound")
    .eq("status", "queued")
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(limit);

  let processed = 0;
  let sent = 0;
  let failed = 0;

  if (!rows?.length) return { processed, sent, failed };

  const smsReady = isSmsConfigured();

  for (const row of rows) {
    processed += 1;

    const { data: claimed } = await sb
      .from("sms_messages")
      .update({ status: "processing" })
      .eq("id", row.id)
      .eq("status", "queued")
      .select("id")
      .maybeSingle();
    if (!claimed?.id) continue;

    if (!smsReady || !row.to_phone) {
      await sb
        .from("sms_messages")
        .update({
          status: "failed",
          last_error: "Twilio is not configured",
        })
        .eq("id", row.id);
      failed += 1;
      continue;
    }

    const result = await sendSms(row.to_phone, row.body);
    if (result.ok) {
      await sb
        .from("sms_messages")
        .update({
          status: "sent",
          twilio_message_sid: result.sid ?? null,
          last_error: null,
        })
        .eq("id", row.id);
      sent += 1;
      continue;
    }

    const retryCount = (row.retry_count ?? 0) + 1;
    if (retryCount >= 4) {
      await sb
        .from("sms_messages")
        .update({
          status: "failed",
          retry_count: retryCount,
          last_error: result.error ?? "SMS send failed",
        })
        .eq("id", row.id);
      failed += 1;
    } else {
      await sb
        .from("sms_messages")
        .update({
          status: "queued",
          retry_count: retryCount,
          next_attempt_at: nextRetryIso(retryCount),
          last_error: result.error ?? "SMS send failed",
        })
        .eq("id", row.id);
    }
  }

  return { processed, sent, failed };
}
