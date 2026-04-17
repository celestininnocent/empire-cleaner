"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { findAuthUserByEmail } from "@/lib/supabase/find-auth-user-by-email";
import { resolveCrewTeamAssignment } from "@/lib/crew-team-matching";
import {
  ensureDefaultTeamExists,
  linkUserToCrewTeam,
  linkUserToCrewTeamWhenReady,
} from "@/lib/crew-sync";
import { isSmsConfigured, normalizeUsPhoneToE164, sendSms } from "@/lib/sms";

async function zipForCrewResolution(
  sb: SupabaseClient,
  app: { zip_code: string | null; email: string }
): Promise<string | null> {
  const fromApplicant = app.zip_code?.trim();
  if (fromApplicant) return fromApplicant;
  const email = app.email.trim().toLowerCase();
  const u = await findAuthUserByEmail(sb, email);
  if (!u) return null;
  const { data: prof } = await sb
    .from("profiles")
    .select("zip_code")
    .eq("id", u.id)
    .maybeSingle();
  return prof?.zip_code?.trim() || null;
}

function serviceDb() {
  const sb = createServiceRoleClient();
  if (!sb) {
    throw new Error("Server misconfigured: missing Supabase URL or service role key.");
  }
  return sb;
}

async function requireAdmin() {
  const { user } = await requireAdminUser();
  return user;
}

async function notifyApplicantAccessGranted(input: {
  phone: string | null | undefined;
  fullName: string;
  role: "cleaner" | "admin";
  mode: "linked" | "invited";
}) {
  if (!isSmsConfigured()) return;
  const to = input.phone?.trim() ? normalizeUsPhoneToE164(input.phone) : null;
  if (!to) return;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const targetPath = input.role === "admin" ? "/admin" : "/field";
  const roleLabel = input.role === "admin" ? "owner" : "crew";
  const actionText =
    input.mode === "invited"
      ? "Check your invite email, then sign in"
      : "Sign in";
  const body = `${input.fullName}, your ${roleLabel} app access is ready. ${actionText}: ${appUrl}${targetPath}`;
  const result = await sendSms(to, body);
  if (!result.ok) {
    console.error("[hiring] access-granted SMS failed:", result.error);
  }
}

export async function insertApplicantAction(input: {
  full_name: string;
  email: string;
  phone: string | null;
  zip_code: string | null;
}) {
  await requireAdmin();
  const sb = serviceDb();
  const { data, error } = await sb
    .from("applicants")
    .insert({
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      phone: input.phone?.trim() || null,
      zip_code: input.zip_code?.trim() || null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  let row = data;
  if (!row.zip_code?.trim()) {
    const u = await findAuthUserByEmail(sb, input.email.trim().toLowerCase());
    if (u) {
      const { data: prof } = await sb
        .from("profiles")
        .select("zip_code")
        .eq("id", u.id)
        .maybeSingle();
      const z = prof?.zip_code?.trim();
      if (z) {
        const { data: updated, error: upErr } = await sb
          .from("applicants")
          .update({ zip_code: z })
          .eq("id", row.id)
          .select("*")
          .single();
        if (!upErr && updated) row = updated;
      }
    }
  }

  revalidatePath("/admin/hiring");
  return row;
}

export async function updateApplicantStatusAction(id: string, status: string) {
  await requireAdmin();
  const sb = serviceDb();
  const { error } = await sb.from("applicants").update({ status }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/hiring");
}

export async function updateApplicantNotesAction(id: string, notes: string) {
  await requireAdmin();
  const sb = serviceDb();
  const { error } = await sb.from("applicants").update({ notes: notes || null }).eq("id", id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath("/admin/hiring");
}

export type ApproveCrewResult = {
  mode: "linked" | "invited";
  message: string;
  /** Set for crew grants; null for owner-only approval */
  crewTeamId: string | null;
};

/**
 * Marks applicant onboarded + crew team, then either links an existing Auth user
 * or sends Supabase invite email. New signups get `cleaners` via `handle_new_user` (migration 005).
 */
export async function approveApplicantForCrewAction(
  applicantId: string,
  teamId: string
): Promise<ApproveCrewResult> {
  await requireAdmin();

  const sb = serviceDb();
  const { data: app, error: fetchErr } = await sb
    .from("applicants")
    .select("id, email, full_name, zip_code, phone")
    .eq("id", applicantId)
    .single();

  if (fetchErr || !app) {
    throw new Error(fetchErr?.message ?? "Applicant not found.");
  }

  const zipForMatch = await zipForCrewResolution(sb, app);
  await ensureDefaultTeamExists(sb, {
    preferredZip: zipForMatch,
    preferredName: zipForMatch?.trim() ? `Crew ${zipForMatch.trim()}` : "Main crew",
  });
  const { data: teamRows } = await sb.from("teams").select("id, zip_code");
  const teams = teamRows ?? [];

  const explicitRaw = teamId?.trim() ?? "";
  const explicitValid =
    explicitRaw && teams.some((t) => t.id === explicitRaw) ? explicitRaw : "";

  const { teamId: resolvedTeamId } = resolveCrewTeamAssignment({
    teams,
    manualPickTeamId: explicitValid || null,
    storedTeamId: null,
    serviceZip: zipForMatch,
  });

  if (!resolvedTeamId) {
    throw new Error(
      "Could not assign a crew. Try again — if it keeps happening, check that the app server has SUPABASE_SERVICE_ROLE_KEY set."
    );
  }

  const email = app.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Applicant has no email.");
  }

  const { error: upErr } = await sb
    .from("applicants")
    .update({
      status: "onboarded",
      crew_team_id: resolvedTeamId,
      app_access_role: "cleaner",
      ...(zipForMatch && !app.zip_code?.trim() ? { zip_code: zipForMatch } : {}),
    })
    .eq("id", applicantId);

  if (upErr) {
    throw new Error(upErr.message);
  }

  const existing = await findAuthUserByEmail(sb, email);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent("/field")}`;

  async function syncProfileFromApplicant(
    userId: string,
    applicantPhone: string | null | undefined
  ) {
    const { data: prof } = await sb
      .from("profiles")
      .select("zip_code, phone")
      .eq("id", userId)
      .maybeSingle();
    const updates: Record<string, string> = {};
    if (applicantPhone?.trim()) updates.phone = applicantPhone.trim();
    if (zipForMatch && !prof?.zip_code?.trim()) updates.zip_code = zipForMatch;
    if (Object.keys(updates).length) {
      await sb.from("profiles").update(updates).eq("id", userId);
    }
  }

  if (existing) {
    await linkUserToCrewTeam(existing.id, resolvedTeamId);
    await syncProfileFromApplicant(existing.id, app.phone);
    await notifyApplicantAccessGranted({
      phone: app.phone,
      fullName: app.full_name,
      role: "cleaner",
      mode: "linked",
    });

    revalidatePath("/admin/hiring");
    return {
      mode: "linked",
      message:
        "They already have an account — we set them as cleaner and assigned the crew. They can open the Crew app (/field).",
      crewTeamId: resolvedTeamId,
    };
  }

  const inviteMeta: Record<string, string> = { full_name: app.full_name };
  if (app.phone?.trim()) inviteMeta.phone = app.phone.trim();
  if (zipForMatch?.trim()) inviteMeta.zip_code = zipForMatch.trim();

  const { data: inviteData, error: invErr } = await sb.auth.admin.inviteUserByEmail(email, {
    redirectTo: callbackUrl,
    data: inviteMeta,
  });

  if (invErr) {
    const late = await findAuthUserByEmail(sb, email);
    if (late) {
      await linkUserToCrewTeam(late.id, resolvedTeamId);
      await syncProfileFromApplicant(late.id, app.phone);
      await notifyApplicantAccessGranted({
        phone: app.phone,
        fullName: app.full_name,
        role: "cleaner",
        mode: "linked",
      });
      revalidatePath("/admin/hiring");
      return {
        mode: "linked",
        message:
          "They already have an account (invite was not needed) — linked to the crew. They can use /field.",
        crewTeamId: resolvedTeamId,
      };
    }
    throw new Error(invErr.message);
  }

  // Invite creates the Auth user immediately; wait for `profiles` then link (trigger race-safe).
  const invitedId = inviteData?.user?.id;
  if (invitedId) {
    try {
      await linkUserToCrewTeamWhenReady(invitedId, resolvedTeamId);
      await syncProfileFromApplicant(invitedId, app.phone);
    } catch (e) {
      console.error("[hiring] post-invite crew link:", e);
    }
  }
  await notifyApplicantAccessGranted({
    phone: app.phone,
    fullName: app.full_name,
    role: "cleaner",
    mode: "invited",
  });

  revalidatePath("/admin/hiring");
  return {
    mode: "invited",
    message:
      "Invite email sent. When they accept and set a password, they will land on the crew app.",
    crewTeamId: resolvedTeamId,
  };
}

/**
 * Grant owner (admin) access by email — no crew assignment. Clears any prior crew approval on this applicant row.
 */
export async function approveApplicantAsOwnerAction(
  applicantId: string
): Promise<ApproveCrewResult> {
  await requireAdmin();
  const sb = serviceDb();
  const { data: app, error: fetchErr } = await sb
    .from("applicants")
    .select("id, email, full_name, phone")
    .eq("id", applicantId)
    .single();

  if (fetchErr || !app) {
    throw new Error(fetchErr?.message ?? "Applicant not found.");
  }

  const email = app.email.trim().toLowerCase();
  const fullName = app.full_name;
  if (!email) {
    throw new Error("Applicant has no email.");
  }

  const { error: upErr } = await sb
    .from("applicants")
    .update({
      status: "onboarded",
      crew_team_id: null,
      app_access_role: "admin",
    })
    .eq("id", applicantId);

  if (upErr) {
    throw new Error(upErr.message);
  }

  const existing = await findAuthUserByEmail(sb, email);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const callbackUrl = `${appUrl.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent("/admin")}`;

  async function ensureOwnerProfile(userId: string) {
    const { error: upsertErr } = await sb.from("profiles").upsert(
      {
        id: userId,
        full_name: fullName,
        role: "admin",
      },
      { onConflict: "id" }
    );
    if (upsertErr) {
      throw new Error(upsertErr.message);
    }
  }

  if (existing) {
    await ensureOwnerProfile(existing.id);

    await sb.from("cleaners").delete().eq("profile_id", existing.id);
    await notifyApplicantAccessGranted({
      phone: app.phone,
      fullName,
      role: "admin",
      mode: "linked",
    });

    revalidatePath("/admin/hiring");
    return {
      mode: "linked",
      message:
        "They already have an account — promoted to owner (admin). They can open Owner (/admin).",
      crewTeamId: null,
    };
  }

  const { error: invErr } = await sb.auth.admin.inviteUserByEmail(email, {
    redirectTo: callbackUrl,
    data: { full_name: app.full_name },
  });

  if (invErr) {
    const late = await findAuthUserByEmail(sb, email);
    if (late) {
      await ensureOwnerProfile(late.id);
      await sb.from("cleaners").delete().eq("profile_id", late.id);
      await notifyApplicantAccessGranted({
        phone: app.phone,
        fullName,
        role: "admin",
        mode: "linked",
      });
      revalidatePath("/admin/hiring");
        return {
          mode: "linked",
          message:
            "They already have an account (invite was not needed) — promoted to owner (admin). They can use /admin.",
          crewTeamId: null,
        };
      }
    throw new Error(invErr.message);
  }

  await notifyApplicantAccessGranted({
    phone: app.phone,
    fullName,
    role: "admin",
    mode: "invited",
  });

  revalidatePath("/admin/hiring");
  return {
    mode: "invited",
    message:
      "Invite email sent. When they accept, they will land on the owner dashboard.",
    crewTeamId: null,
  };
}

/**
 * Removes crew/owner app access: profile → customer, delete cleaners row, clear hiring flags.
 * Does not delete the Auth user.
 */
export async function revokeApplicantAccessAction(
  applicantId: string
): Promise<{ message: string }> {
  await requireAdmin();
  const sb = serviceDb();

  const { data: app, error: fetchErr } = await sb
    .from("applicants")
    .select("id, email")
    .eq("id", applicantId)
    .single();

  if (fetchErr || !app) {
    throw new Error(fetchErr?.message ?? "Applicant not found.");
  }

  const email = app.email.trim().toLowerCase();
  if (!email) {
    throw new Error("Applicant has no email.");
  }

  const user = await findAuthUserByEmail(sb, email);
  if (user) {
    const { error: pErr } = await sb
      .from("profiles")
      .update({ role: "customer" })
      .eq("id", user.id);
    if (pErr) {
      throw new Error(pErr.message);
    }
    await sb.from("cleaners").delete().eq("profile_id", user.id);
  }

  const { error: upErr } = await sb
    .from("applicants")
    .update({
      crew_team_id: null,
      app_access_role: null,
    })
    .eq("id", applicantId);

  if (upErr) {
    throw new Error(upErr.message);
  }

  revalidatePath("/admin/hiring");
  return {
    message: user
      ? "App access removed. Their account stays signed up as a customer until you grant access again."
      : "Hiring flags cleared. No account matched this email yet — they won’t get crew or owner access from this row until you grant again.",
  };
}
