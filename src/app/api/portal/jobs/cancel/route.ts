import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

type Body = { jobId?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CANCELLATION_CUTOFF_MS = 24 * 60 * 60 * 1000;

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
      return NextResponse.json({ error: "Valid jobId required." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    if (!customer?.id) {
      return NextResponse.json({ error: "Customer profile not found." }, { status: 403 });
    }

    const { data: job } = await supabase
      .from("jobs")
      .select("id, customer_id, status, scheduled_start")
      .eq("id", jobId)
      .maybeSingle();
    if (!job?.id) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (job.customer_id !== customer.id) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
    if (!["scheduled", "assigned"].includes(job.status)) {
      return NextResponse.json(
        { error: "Only upcoming scheduled visits can be cancelled." },
        { status: 409 }
      );
    }

    const startMs = new Date(job.scheduled_start).getTime();
    const nowMs = Date.now();
    if (!Number.isFinite(startMs)) {
      return NextResponse.json({ error: "Invalid visit time on record." }, { status: 400 });
    }
    if (startMs <= nowMs) {
      return NextResponse.json(
        { error: "This visit has already started. Please contact support for help." },
        { status: 409 }
      );
    }
    if (startMs - nowMs < CANCELLATION_CUTOFF_MS) {
      return NextResponse.json(
        {
          error:
            "Self-cancel is only available at least 24 hours before the visit. Please contact support.",
        },
        { status: 409 }
      );
    }

    const { error: updateErr } = await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", job.id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not cancel booking.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
