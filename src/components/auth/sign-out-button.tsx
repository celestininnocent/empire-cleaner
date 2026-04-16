"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<typeof Button>, "onClick"> & {
  label?: string;
  /** Icon only (still has screen-reader text). Good for tight headers on small screens. */
  iconOnly?: boolean;
  /** Runs after sign-out succeeds (e.g. close a mobile sheet). */
  afterSignOut?: () => void;
};

export function SignOutButton({
  className,
  variant = "ghost",
  size = "sm",
  label = "Sign out",
  iconOnly = false,
  afterSignOut,
  ...rest
}: Props) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    afterSignOut?.();
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon-sm" : size}
      className={cn(iconOnly ? "shrink-0" : "gap-2", className)}
      onClick={handleSignOut}
      aria-label={iconOnly ? "Sign out" : undefined}
      {...rest}
    >
      <LogOut className="size-4" aria-hidden />
      {!iconOnly ? label : null}
    </Button>
  );
}
