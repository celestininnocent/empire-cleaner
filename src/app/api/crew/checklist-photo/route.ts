import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const originBlock = assertBrowserSameOriginPost(request);
  if (originBlock) return originBlock;

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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const checklistItemId = String(form.get("checklistItemId") ?? "").trim();
  const file = form.get("file");
  if (!checklistItemId || !(file instanceof File)) {
    return NextResponse.json({ error: "checklistItemId and file required" }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Use JPG, PNG, WebP, or GIF" }, { status: 400 });
  }

  const { data: cleaner } = await svc
    .from("cleaners")
    .select("id, team_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const role = await getProfileRoleForUser(user.id);
  const isAdmin = role === "admin";

  if (!cleaner?.id && !isAdmin) {
    return NextResponse.json({ error: "Crew account not linked" }, { status: 403 });
  }

  const { data: row } = await svc
    .from("job_checklist_items")
    .select("id, job_id")
    .eq("id", checklistItemId)
    .maybeSingle();

  if (!row?.job_id) {
    return NextResponse.json({ error: "Checklist item not found" }, { status: 404 });
  }

  const { data: job } = await svc
    .from("jobs")
    .select("id, team_id, status")
    .eq("id", row.job_id)
    .maybeSingle();

  if (!job?.id) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const allowedStatuses = new Set(["scheduled", "assigned", "in_progress"]);
  if (!allowedStatuses.has(job.status)) {
    return NextResponse.json({ error: "This visit cannot accept photos right now" }, { status: 409 });
  }

  const assignedOk =
    isAdmin ||
    Boolean(cleaner?.team_id && job.team_id && cleaner.team_id === job.team_id);
  if (!assignedOk) {
    return NextResponse.json({ error: "Not assigned to this job" }, { status: 403 });
  }

  const ext = EXT_BY_MIME[file.type] ?? "jpg";
  const path = `${job.id}/${row.id}-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await svc.storage.from("checklist-photos").upload(path, buf, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) {
    console.error("[checklist-photo] storage upload:", upErr.message);
    return NextResponse.json({ error: "Could not upload image. Try again." }, { status: 500 });
  }

  const { data: pub } = svc.storage.from("checklist-photos").getPublicUrl(path);
  const photoUrl = pub.publicUrl;
  const now = new Date().toISOString();

  const { error: dbErr } = await svc
    .from("job_checklist_items")
    .update({ photo_url: photoUrl, completed_at: now })
    .eq("id", row.id);

  if (dbErr) {
    console.error("[checklist-photo] checklist update:", dbErr.message);
    return NextResponse.json({ error: "Uploaded but could not save to job" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, photoUrl });
}
