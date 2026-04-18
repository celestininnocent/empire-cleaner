"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { friendlyFetchFailureMessage, sameOriginJsonPost } from "@/lib/network-error";
import { createClient } from "@/lib/supabase/client";

export function ClubJoinButtons({ tier }: { tier: "basic" | "preferred" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?next=/club");
        return;
      }

      const res = await fetch("/api/stripe/club-checkout", {
        ...sameOriginJsonPost,
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start membership checkout.");
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setError(friendlyFetchFailureMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" disabled={busy} onClick={startCheckout} className="w-full sm:w-auto">
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Redirecting…
            </>
          ) : (
            "Join Empire Club"
          )}
        </Button>
        <Link
          href="/portal"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          My account
        </Link>
      </div>
    </div>
  );
}

