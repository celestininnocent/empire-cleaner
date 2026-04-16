import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { normalizeUsPhoneToE164 } from "@/lib/sms";
import { queueOutboundSms, processSmsQueueBatch } from "@/lib/sms-queue";

export async function POST(request: Request) {
  const sb = createServiceRoleClient();
  if (!sb) {
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const contentType = request.headers.get("content-type") || "";
  let from = "";
  let body = "";
  let sid = "";
  let accountSid = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    from = params.get("From") || "";
    body = params.get("Body") || "";
    sid = params.get("MessageSid") || "";
    accountSid = params.get("AccountSid") || "";
  } else {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      from = String(json.From ?? "");
      body = String(json.Body ?? "");
      sid = String(json.MessageSid ?? "");
      accountSid = String(json.AccountSid ?? "");
    } catch {
      return new NextResponse("Bad payload", { status: 400 });
    }
  }

  const expectedAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  if (expectedAccountSid && accountSid && accountSid !== expectedAccountSid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  const fromE164 = normalizeUsPhoneToE164(from);
  const text = body.trim();
  if (!fromE164 || !text) {
    return new NextResponse("OK", { status: 200 });
  }

  const { data: profiles } = await sb.from("profiles").select("id, phone");
  const matchedProfile = (profiles ?? []).find(
    (p) => normalizeUsPhoneToE164(p.phone ?? "") === fromE164
  );

  let routingKind: "crew" | "customer" | "system" = "system";
  let teamId: string | null = null;
  const profileId: string | null = matchedProfile?.id ?? null;

  if (profileId) {
    const { data: cleaner } = await sb
      .from("cleaners")
      .select("team_id")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (cleaner?.team_id) {
      routingKind = "crew";
      teamId = cleaner.team_id;
    } else {
      const { data: customer } = await sb
        .from("customers")
        .select("id")
        .eq("profile_id", profileId)
        .maybeSingle();
      if (customer?.id) routingKind = "customer";
    }
  }

  const messageInsert = await sb.from("sms_messages").insert({
    direction: "inbound",
    routing_kind: routingKind,
    template_key: null,
    body: text,
    to_phone: process.env.TWILIO_FROM_NUMBER?.trim() ?? null,
    from_phone: fromE164,
    profile_id: profileId,
    team_id: teamId,
    status: "received",
    twilio_message_sid: sid || null,
  });
  if (messageInsert.error) {
    return new NextResponse("Insert failed", { status: 500 });
  }

  if (routingKind === "crew" && profileId && teamId) {
    await sb.from("crew_dispatch_messages").insert({
      team_id: teamId,
      profile_id: profileId,
      body: text,
    });

    await queueOutboundSms({
      toPhone: fromE164,
      templateKey: "inbound_crew_ack",
      routingKind: "crew",
      profileId,
      teamId,
    });
  } else {
    await queueOutboundSms({
      toPhone: fromE164,
      templateKey: "inbound_customer_ack",
      routingKind: routingKind === "customer" ? "customer" : "system",
      profileId,
      teamId,
    });
  }

  await processSmsQueueBatch(8);

  return new NextResponse("OK", { status: 200 });
}
