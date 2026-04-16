import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { createClient } from "@/lib/supabase/server";
import { getProfileRoleForUser } from "@/lib/supabase/profile-role";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SmsTemplateManager } from "@/components/admin/sms-template-manager";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TemplateRow = {
  id: string;
  template_key: string;
  title: string;
  body: string;
  is_active: boolean;
  updated_at: string;
};

export default async function SmsTemplatesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/sms-templates");

  const role = await getProfileRoleForUser(user.id);
  if (role !== "admin") redirect("/admin");

  const svc = createServiceRoleClient();
  const { data: templates } = svc
    ? await svc
        .from("sms_templates")
        .select("id, template_key, title, body, is_active, updated_at")
        .order("template_key")
    : { data: [] };

  return (
    <SiteShell>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 gap-2 px-0")}
        >
          <ArrowLeft className="size-4" />
          Owner dashboard
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">SMS templates</h1>
          <p className="mt-1 text-muted-foreground">
            Manage outbound SMS copy, queue retries, and inbound acknowledgements.
          </p>
        </div>
        <SmsTemplateManager initial={(templates ?? []) as TemplateRow[]} />
      </div>
    </SiteShell>
  );
}
