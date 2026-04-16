import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

type Body = { jobId?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const originBlock = assertBrowserSameOriginPost(request);
    if (originBlock) return originBlock;

    let body: Body = {};
    try {
      body = (await request.json()) as Body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const jobId = body.jobId?.trim() ?? "";
    if (!UUID_RE.test(jobId)) {
      return NextResponse.json({ error: "Valid jobId required" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const svc = createServiceRoleClient();
    if (!svc) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const { data: cleaner } = await svc
      .from("cleaners")
      .select("id, team_id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!cleaner?.id || !cleaner.team_id) {
      return NextResponse.json({ error: "Cleaner team is required" }, { status: 403 });
    }

    const { data: job } = await svc
      .from("jobs")
      .select("id, team_id, status")
      .eq("id", jobId)
      .maybeSingle();
    if (!job?.id) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.team_id === cleaner.team_id) {
      return NextResponse.json({ ok: true, claimed: false, reason: "already_claimed" });
    }
    if (job.team_id) {
      return NextResponse.json(
        { error: "This job was already claimed by another crew." },
        { status: 409 }
      );
    }
    if (job.status !== "scheduled") {
      return NextResponse.json(
        { error: "Only scheduled jobs can be claimed." },
        { status: 409 }
      );
    }

    const { data: updated, error: updateErr } = await svc
      .from("jobs")
      .update({ team_id: cleaner.team_id, status: "assigned" })
      .eq("id", job.id)
      .is("team_id", null)
      .eq("status", "scheduled")
      .select("id")
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }
    if (!updated?.id) {
      return NextResponse.json(
        { error: "Job was claimed by another crew. Refresh and try another." },
        { status: 409 }
      );
    }

    await svc.from("job_claim_events").insert({
      job_id: updated.id,
      team_id: cleaner.team_id,
      cleaner_id: cleaner.id,
    });

    return NextResponse.json({ ok: true, claimed: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not claim job";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
