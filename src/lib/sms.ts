/**
 * Optional Twilio SMS. Set TWILIO_* env vars on the server; otherwise helpers no-op safely.
 */

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim()
  );
}

/** Best-effort US numbers: 10 digits → +1…; 11 starting with 1 → +… */
export function normalizeUsPhoneToE164(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (t.startsWith("+")) {
    const d = t.replace(/\D/g, "");
    return d.length >= 10 ? `+${d}` : null;
  }
  const d = t.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return null;
}

export async function sendSms(
  toE164: string,
  body: string
): Promise<{ ok: boolean; error?: string; sid?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM_NUMBER?.trim();
  if (!sid || !token || !from) {
    return { ok: false, error: "SMS not configured" };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams();
  params.set("To", toE164);
  params.set("From", from);
  params.set("Body", body);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false, error: text.slice(0, 200) };
  }
  try {
    const json = JSON.parse(text) as { sid?: string };
    return { ok: true, sid: json.sid };
  } catch {
    return { ok: true };
  }
}
