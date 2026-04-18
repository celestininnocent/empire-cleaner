/**
 * One-off: grant Owner (/admin) access for an email (same as Hiring → Grant owner access).
 *
 * Usage (from repo root, requires SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL):
 *   node --env-file=.env.local scripts/grant-owner.cjs <email> "<full name>" <phone>
 *
 * Example:
 *   node --env-file=.env.local scripts/grant-owner.cjs riceytjr@gmail.com "Thomas Rice" 5033673887
 */

const { createClient } = require("@supabase/supabase-js");

function authUserMatchesEmail(user, normalizedEmail) {
  const target = normalizedEmail.trim().toLowerCase();
  if (user.email?.trim().toLowerCase() === target) return true;
  for (const row of user.identities ?? []) {
    const raw = row.identity_data;
    if (raw && typeof raw === "object" && "email" in raw) {
      const em = raw.email;
      if (typeof em === "string" && em.trim().toLowerCase() === target) return true;
    }
  }
  return false;
}

async function findAuthUserByEmail(sb, email) {
  const target = email.trim().toLowerCase();
  if (!target) return null;
  const perPage = 1000;
  let page = 1;
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);
    const users = data.users ?? [];
    const found = users.find((u) => authUserMatchesEmail(u, target));
    if (found) return found;
    if (users.length === 0 || users.length < perPage) break;
    page += 1;
    if (page > 500) break;
  }
  return null;
}

async function main() {
  const email = process.argv[2]?.trim();
  const fullName = process.argv[3]?.trim();
  const phone = process.argv[4]?.trim() || null;

  if (!email || !fullName) {
    console.error(
      "Usage: node --env-file=.env.local scripts/grant-owner.cjs <email> \"<full name>\" [phone]"
    );
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
    process.exit(1);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.empirecleaner.us").replace(
    /\/$/,
    ""
  );
  const callbackUrl = `${appUrl}/auth/callback?next=${encodeURIComponent("/admin")}`;

  const sb = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: applicants } = await sb.from("applicants").select("id, email");
  if (applicants) {
    const match = applicants.find((a) => a.email?.trim().toLowerCase() === email.toLowerCase());
    if (match) {
      const { error: upErr } = await sb
        .from("applicants")
        .update({
          full_name: fullName,
          phone,
          status: "onboarded",
          crew_team_id: null,
          app_access_role: "admin",
        })
        .eq("id", match.id);
      if (upErr) throw new Error(upErr.message);
      console.log("Updated existing applicant row:", match.id);
    } else {
      const { error: insErr } = await sb.from("applicants").insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone,
        status: "onboarded",
        crew_team_id: null,
        app_access_role: "admin",
      });
      if (insErr) throw new Error(insErr.message);
      console.log("Inserted new applicant row (owner).");
    }
  }

  const existing = await findAuthUserByEmail(sb, email);

  async function ensureOwnerProfile(userId) {
    const { error: upsertErr } = await sb.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        phone: phone ?? undefined,
        role: "admin",
      },
      { onConflict: "id" }
    );
    if (upsertErr) throw new Error(upsertErr.message);
  }

  if (existing) {
    await ensureOwnerProfile(existing.id);
    await sb.from("cleaners").delete().eq("profile_id", existing.id);
    console.log("OK: Existing user promoted to owner (admin). They can sign in and open /admin");
    return;
  }

  const { error: invErr } = await sb.auth.admin.inviteUserByEmail(email.toLowerCase(), {
    redirectTo: callbackUrl,
    data: { full_name: fullName, ...(phone ? { phone } : {}) },
  });

  if (invErr) {
    const late = await findAuthUserByEmail(sb, email);
    if (late) {
      await ensureOwnerProfile(late.id);
      await sb.from("cleaners").delete().eq("profile_id", late.id);
      console.log(
        "OK: User appeared during invite — promoted to owner (admin). They can open /admin"
      );
      return;
    }
    throw new Error(invErr.message);
  }

  console.log(
    "OK: Invite email sent. When they accept the invite and set a password, they land on /admin."
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
