import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { processSmsQueueBatch } from "@/lib/sms-queue";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

export async function POST(request: Request) {
  const originBlock = assertBrowserSameOriginPost(request);
  if (originBlock) return originBlock;

  await requireAdminUser();
  const result = await processSmsQueueBatch(40);
  return NextResponse.json({ ok: true, ...result });
}
