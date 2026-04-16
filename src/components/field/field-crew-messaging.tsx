"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type MsgRow = {
  id: string;
  body: string;
  created_at: string;
  profile_id: string;
};

export function FieldCrewMessaging({ teamId }: { teamId: string | null }) {
  const router = useRouter();
  const [rows, setRows] = useState<MsgRow[]>([]);
  const [body, setBody] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(() => Boolean(teamId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error: e } = await supabase
      .from("crew_dispatch_messages")
      .select("id, body, created_at, profile_id")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true })
      .limit(80);

    if (e) {
      const msg = e.message ?? "";
      const code = "code" in e && typeof (e as { code?: string }).code === "string"
        ? (e as { code: string }).code
        : "";
      const missingTableOrCache =
        /schema cache/i.test(msg) ||
        /crew_dispatch_messages.*does not exist/i.test(msg) ||
        /relation ["']public\.crew_dispatch_messages["'] does not exist/i.test(msg) ||
        (/42P01/i.test(code) && /crew_dispatch_messages/i.test(msg));
      setError(
        missingTableOrCache
          ? "Crew team chat needs the `crew_dispatch_messages` table in the same Supabase project your app uses. Run the SQL from `supabase/migrations/009_crew_dispatch_messages.sql` in Supabase → SQL Editor, confirm `public.teams` and `public.cleaners` already exist, then wait 1–2 minutes (or restart the project under Settings) so the API schema cache refreshes."
          : msg
      );
      setRows([]);
    } else {
      setError(null);
      setRows((data ?? []) as MsgRow[]);
    }
    setLoading(false);
  }, [teamId]);

  useEffect(() => {
    void createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setMyId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!teamId) {
      return;
    }
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load, teamId]);

  async function send() {
    const t = body.trim();
    if (!teamId || !t || !myId || sending) return;
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error: e } = await supabase.from("crew_dispatch_messages").insert({
      team_id: teamId,
      profile_id: myId,
      body: t,
    });
    setSending(false);
    if (e) {
      setError(e.message);
      return;
    }
    setBody("");
    await load();
    router.refresh();
  }

  if (!teamId) {
    return (
      <Card className="border-dashed border-border/80 bg-muted/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="size-5 text-muted-foreground" />
            {siteConfig.fieldMessagingTitle}
          </CardTitle>
          <CardDescription>{siteConfig.fieldMessagingNoTeamPlaceholder}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="size-5 text-primary" />
          {siteConfig.fieldMessagingTitle}
        </CardTitle>
        <CardDescription>{siteConfig.fieldMessagingSub}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
            {rows.length === 0 ? (
              <p className="text-muted-foreground">
                No messages yet — use this thread for quick updates everyone on your crew (and owners)
                can see.
              </p>
            ) : (
              rows.map((m) => (
                <div key={m.id} className="rounded-md bg-card px-3 py-2 shadow-sm">
                  <div className="flex justify-between gap-2 text-[11px] text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {m.profile_id === myId ? "You" : "Teammate"}
                    </span>
                    <time dateTime={m.created_at}>
                      {new Date(m.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                </div>
              ))
            )}
          </div>
        )}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <Textarea
          placeholder={siteConfig.fieldMessagingPlaceholder}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button type="button" onClick={() => void send()} disabled={sending || !body.trim()}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : siteConfig.fieldMessagingSend}
        </Button>
      </CardContent>
    </Card>
  );
}
