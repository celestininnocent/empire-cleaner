import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

function mapStatus(raw: string): "sent" | "delivered" | "failed" {
  const s = raw.toLowerCase();
  if (["delivered", "read"].includes(s)) return "delivered";
  if (["failed", "undelivered", "canceled"].includes(s)) return "failed";
  return "sent";
}

export async function POST(request: Request) {
  const sb = createServiceRoleClient();
  if (!sb) return new NextResponse("Server misconfigured", { status: 500 });

  const contentType = request.headers.get("content-type") || "";
  let messageSid = "";
  let messageStatus = "";
  let accountSid = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    messageSid = params.get("MessageSid") || "";
    messageStatus = params.get("MessageStatus") || "";
    accountSid = params.get("AccountSid") || "";
  } else {
    const json = (await request.json()) as Record<string, unknown>;
    messageSid = String(json.MessageSid ?? "");
    messageStatus = String(json.MessageStatus ?? "");
    accountSid = String(json.AccountSid ?? "");
  }

  const expectedAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  if (expectedAccountSid && accountSid && accountSid !== expectedAccountSid) {
    return new NextResponse("Unauthorized", { status: 403 });
  }

  if (!messageSid) return new NextResponse("OK", { status: 200 });

  const status = mapStatus(messageStatus || "sent");
  const updates: Record<string, string | null> = {
    status,
    last_error: status === "failed" ? `Twilio status: ${messageStatus}` : null,
  };

  await sb.from("sms_messages").update(updates).eq("twilio_message_sid", messageSid);

  return new NextResponse("OK", { status: 200 });
}
