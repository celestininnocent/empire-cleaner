"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";
import { runDispatchAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function DispatchControls() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await runDispatchAction();
        setLoading(false);
        router.refresh();
      }}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Zap className="size-4" />
      )}
      Run dispatch
    </Button>
  );
}
