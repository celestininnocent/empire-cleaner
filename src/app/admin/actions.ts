"use server";

import { requireAdminUser } from "@/lib/auth/require-admin";
import { assignUnassignedJobs } from "@/lib/dispatch-server";

export async function runDispatchAction() {
  await requireAdminUser();
  return assignUnassignedJobs();
}
