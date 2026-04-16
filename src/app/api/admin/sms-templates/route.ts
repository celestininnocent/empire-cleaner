import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

export async function GET() {
  await requireAdminUser();
  const sb = createServiceRoleClient();
  if (!sb) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  const { data, error } = await sb
    .from("sms_templates")
    .select("id, template_key, title, body, is_active, updated_at")
    .order("template_key");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ templates: data ?? [] });
}

export async function PATCH(request: Request) {
  const originBlock = assertBrowserSameOriginPost(request);
  if (originBlock) return originBlock;
  await requireAdminUser();
  const sb = createServiceRoleClient();
  if (!sb) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const body = (await request.json()) as {
    id?: string;
    title?: string;
    body?: string;
    is_active?: boolean;
  };

  const id = body.id?.trim();
  if (!id) return NextResponse.json({ error: "Template id required" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.body === "string") updates.body = body.body;
  if (typeof body.is_active === "boolean") updates.is_active = body.is_active;

  if (!Object.keys(updates).length) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }

  const { error } = await sb.from("sms_templates").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
