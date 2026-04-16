import Link from "next/link";
import { redirect } from "next/navigation";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { LoginForm } from "@/components/auth/login-form";
import { createClient } from "@/lib/supabase/server";
import { sanitizeInternalPath } from "@/lib/utils";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const nextPath = sanitizeInternalPath(sp.next, "/portal");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(nextPath);
  }

  return (
    <SiteShell>
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="mb-8 space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{siteConfig.loginTitle}</h1>
          <p className="text-sm text-muted-foreground">{siteConfig.loginSub}</p>
        </div>
        <LoginForm redirectTo={nextPath} />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/book" className="font-medium text-primary underline-offset-4 hover:underline">
            Start a booking
          </Link>
        </p>
      </div>
    </SiteShell>
  );
}
