import { NextResponse } from "next/server";
import { approveApplicantForCrewAction } from "@/app/admin/hiring/actions";
import { assertBrowserSameOriginPost } from "@/lib/security/same-origin";

/**
 * Same logic as the server action, but callable via `fetch` so the hiring UI always
 * gets a JSON response (some environments handle server actions poorly from the client).
 */
export async function POST(request: Request) {
  try {
    const originBlock = assertBrowserSameOriginPost(request);
    if (originBlock) return originBlock;

    const body = (await request.json()) as { applicantId?: string; teamId?: string };
    if (!body.applicantId?.trim()) {
      return NextResponse.json({ error: "Applicant id required" }, { status: 400 });
    }
    const result = await approveApplicantForCrewAction(
      body.applicantId.trim(),
      body.teamId ?? ""
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not grant crew access";
    const status =
      msg === "Sign in required." ? 401 : msg === "Owner access only." ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
