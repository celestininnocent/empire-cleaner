import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { ensureDefaultTeamExists } from "@/lib/crew-sync";
import { buildProfileZipByEmailMap } from "@/lib/hiring-profile-zips";
import { HiringPipeline } from "@/components/admin/hiring-pipeline";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HiringPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/hiring");
  }

  const role = await getProfileRoleForUser(user.id);

  if (role !== "admin") {
    redirect("/admin");
  }

  const svc = createServiceRoleClient();
  if (svc) {
    await ensureDefaultTeamExists(svc);
  }
  const { data: applicants } = svc
    ? await svc.from("applicants").select("*").order("created_at", { ascending: false })
    : { data: [] as Record<string, unknown>[] };

  const { data: teams } = svc
    ? await svc.from("teams").select("id, name, zip_code").order("name")
    : { data: [] as { id: string; name: string; zip_code: string }[] };

  const applicantEmails = (applicants ?? []).map((a) =>
    String((a as { email?: string }).email ?? "")
  );
  const profileZipByEmail =
    svc && applicantEmails.length > 0
      ? await buildProfileZipByEmailMap(svc, applicantEmails)
      : {};

  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          href="/admin"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-6 gap-2 px-0"
          )}
        >
          <ArrowLeft className="size-4" />
          {siteConfig.adminHeadline}
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.hiringHeadline}</h1>
          <p className="mt-1 text-muted-foreground">{siteConfig.hiringSub}</p>
        </div>
        <HiringPipeline
          initial={applicants ?? []}
          teams={teams ?? []}
          profileZipByEmail={profileZipByEmail}
        />
      </div>
    </SiteShell>
  );
}
