import type { SupabaseClient } from "@supabase/supabase-js";

/** Normalize email for lookup / create. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Digits only, min length checked by caller. */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * For paid checkout without a prior session: find auth user by email or create one.
 * Service role only — call from Stripe webhook.
 */
export async function resolveOrCreateUserForPaidBooking(
  admin: SupabaseClient,
  params: { email: string; phone: string; fullName: string }
): Promise<{ userId: string } | { error: string }> {
  const email = normalizeEmail(params.email);
  const phone = digitsOnly(params.phone);
  const fullName = params.fullName.trim().slice(0, 120);
  if (!email.includes("@")) {
    return { error: "Invalid guest email" };
  }
  if (phone.length < 10) {
    return { error: "Invalid guest phone" };
  }
  if (fullName.length < 2) {
    return { error: "Invalid guest name" };
  }

  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (listErr) {
    console.error("[checkout] listUsers", listErr);
    return { error: listErr.message };
  }

  const found = listData.users.find((u) => u.email?.toLowerCase() === email);
  if (found?.id) {
    await admin
      .from("profiles")
      .update({ phone, full_name: fullName })
      .eq("id", found.id);
    return { userId: found.id };
  }

  const { randomBytes } = await import("crypto");
  const password = randomBytes(32).toString("base64url");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });

  if (createErr || !created.user?.id) {
    console.error("[checkout] createUser", createErr);
    return { error: createErr?.message ?? "Could not create account for guest checkout" };
  }

  await admin
    .from("profiles")
    .update({ phone, full_name: fullName })
    .eq("id", created.user.id);

  return { userId: created.user.id };
}
