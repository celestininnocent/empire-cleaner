import type { SupabaseClient, User } from "@supabase/supabase-js";

export type ClaimCrewRpcResult = {
  ok?: boolean;
  linked?: boolean;
  reason?: string;
  error?: string;
};

export type FieldCrewBlockedExplained = {
  headline: string;
  body: string;
  sub?: string;
};

type ApplicantPeek = {
  status: string;
  app_access_role: string | null;
  crew_team_id: string | null;
};

async function fetchApplicantForLoginEmail(
  svc: SupabaseClient,
  loginEmail: string
): Promise<ApplicantPeek | null> {
  const em = loginEmail.trim().toLowerCase();
  if (!em) return null;
  const { data, error } = await svc
    .from("applicants")
    .select("status, app_access_role, crew_team_id")
    .ilike("email", em)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as ApplicantPeek;
}

/**
 * Human-readable reasons when `/field` cannot load crew tools (no `cleaners.team_id` yet).
 */
export async function explainFieldCrewBlocked(opts: {
  user: User;
  svc: SupabaseClient | null;
  claim: ClaimCrewRpcResult | null;
  claimErr: { message: string } | null;
  cleaner: { team_id: string | null } | null;
  profileRole: string | null;
  supportPhoneDisplay: string;
}): Promise<FieldCrewBlockedExplained> {
  const loginEmail = opts.user.email?.trim() ?? "";
  const loginEmailLower = loginEmail.toLowerCase();
  const support = opts.supportPhoneDisplay?.trim();

  const applicant =
    opts.svc && loginEmailLower
      ? await fetchApplicantForLoginEmail(opts.svc, loginEmailLower)
      : null;

  const msg = opts.claimErr?.message ?? "";
  if (msg.includes("Could not find the function") || msg.includes("schema cache")) {
    return {
      headline: "Database setup incomplete",
      body: "The crew-link function is missing in Supabase. Ask your owner to run the migration SQL for `claim_crew_access_for_me` (see repo `supabase/migrations/010` / `014`), then refresh this page.",
    };
  }
  if (opts.claimErr && msg) {
    return {
      headline: "Could not verify crew access",
      body: `Something went wrong while checking crew access: ${msg.slice(0, 200)}`,
      sub: support ? `If this keeps happening, call ${support}.` : undefined,
    };
  }

  if (!opts.svc) {
    return {
      headline: "Server configuration issue",
      body: "Automatic crew linking cannot run because the app server is missing `SUPABASE_SERVICE_ROLE_KEY`. Ask your owner to add it in Vercel env vars and redeploy.",
    };
  }

  if (opts.claim?.error === "no_email") {
    return {
      headline: "This login has no email on file",
      body: "Crew access is matched using the email on your Supabase account. Sign in with an email/password account, or add an email to your provider account, then try again.",
      sub: support ? `Questions? ${support}` : undefined,
    };
  }

  if (opts.claim?.error === "no_team" || opts.claim?.error === "no_team_resolved") {
    return {
      headline: "No crews configured yet",
      body: "There are no teams in the database, so we cannot attach you to a crew. Ask your owner to add at least one crew (or run the teams seed SQL), then grant access again from Hiring.",
    };
  }

  if (opts.cleaner && opts.cleaner.team_id == null) {
    return {
      headline: "Crew account is not fully linked",
      body: "You have a crew profile row, but it is missing a team assignment. Ask your owner to grant crew access again from Hiring (pick the right crew if needed).",
      sub: support ? `Urgent? ${support}` : undefined,
    };
  }

  if (opts.claim?.ok === true && opts.claim?.linked === true) {
    return {
      headline: "Almost there — refresh once",
      body: "The server just linked your crew access, but this page loaded before the crew row was visible. Refresh the page or sign out and back in.",
    };
  }

  if (opts.claim?.error === "no_eligible_applicant" || opts.claim?.reason === "not_onboarded_or_hired") {
    if (applicant && !["onboarded", "hired"].includes(String(applicant.status))) {
      return {
        headline: "Hiring is not finished for this email",
        body: `We found a hiring record for ${loginEmail || "this account"}, but the stage is still “${applicant.status}”. Your owner needs to move you to Hired or Onboarded, then tap “Grant crew app access” again.`,
      };
    }
    if (applicant?.app_access_role === "admin") {
      return {
        headline: "This email is set up as Owner, not crew",
        body: "Your hiring record is marked for owner (admin) access, not the crew app. Use the Owner dashboard at /admin, or ask your owner to grant crew access instead.",
      };
    }
    return {
      headline: "No crew access for this login email",
      body: loginEmail
        ? `We could not find an onboarded/hired hiring record that matches ${loginEmail}. Make sure you sign in with the same email your owner used in Hiring, or ask them to add/update your row.`
        : "We could not find an onboarded/hired hiring record for this account. Sign in with the email your owner used in Hiring.",
      sub: support ? `Still stuck? ${support}` : undefined,
    };
  }

  if (opts.profileRole === "cleaner" && !opts.cleaner) {
    return {
      headline: "Profile says crew, but data is incomplete",
      body: "Your account is marked as cleaner, but the crew row is missing. Ask your owner to grant crew access again from Hiring, or contact support to repair the account.",
      sub: support ? support : undefined,
    };
  }

  return {
    headline: "Crew app not available yet",
    body:
      "This account is not attached to a crew team yet. Ask your owner to open Hiring → Grant crew app access for your email, or accept the invite email first if you were just invited.",
    sub: support ? `Questions? ${support}` : undefined,
  };
}
