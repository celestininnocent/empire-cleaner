"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { friendlyFetchFailureMessage, sameOriginJsonPatch, sameOriginJsonPost } from "@/lib/network-error";

type TemplateRow = {
  id: string;
  template_key: string;
  title: string;
  body: string;
  is_active: boolean;
  updated_at: string;
};

export function SmsTemplateManager({ initial }: { initial: TemplateRow[] }) {
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save(row: TemplateRow) {
    setErr(null);
    setMsg(null);
    setBusy(row.id);
    try {
      const res = await fetch("/api/admin/sms-templates", {
        ...sameOriginJsonPatch,
        body: JSON.stringify({
          id: row.id,
          title: row.title,
          body: row.body,
          is_active: row.is_active,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Could not save template");
        return;
      }
      setMsg(`Saved ${row.template_key}`);
    } catch (e) {
      setErr(friendlyFetchFailureMessage(e));
    } finally {
      setBusy(null);
    }
  }

  async function processQueue() {
    setErr(null);
    setMsg(null);
    setBusy("queue");
    try {
      const res = await fetch("/api/sms/process-queue", {
        ...sameOriginJsonPost,
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        error?: string;
        processed?: number;
        sent?: number;
        failed?: number;
      };
      if (!res.ok) {
        setErr(data.error ?? "Queue processing failed");
        return;
      }
      setMsg(
        `Queue run complete: processed ${data.processed ?? 0}, sent ${data.sent ?? 0}, failed ${data.failed ?? 0}.`
      );
    } catch (e) {
      setErr(friendlyFetchFailureMessage(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>SMS operations</CardTitle>
          <CardDescription>Run queue retries and edit message templates used by automations.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={processQueue} disabled={busy === "queue"}>
            {busy === "queue" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Process queued SMS now
          </Button>
          {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </CardContent>
      </Card>

      {rows.map((row, idx) => (
        <Card key={row.id} className="border-border/80">
          <CardHeader>
            <CardTitle className="text-lg">{row.template_key}</CardTitle>
            <CardDescription>Updated {new Date(row.updated_at).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={row.title}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r))
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                rows={3}
                value={row.body}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, body: e.target.value } : r))
                  )
                }
              />
              <p className="text-xs text-muted-foreground">
                Supports variables like {"{{brand}}"}, {"{{when}}"}, {"{{address}}"} when used.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={row.is_active}
                onCheckedChange={(v) =>
                  setRows((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, is_active: v === true } : r))
                  )
                }
                id={`active-${row.id}`}
              />
              <Label htmlFor={`active-${row.id}`}>Template active</Label>
            </div>
            <Button type="button" onClick={() => save(row)} disabled={busy === row.id}>
              {busy === row.id ? <Loader2 className="size-4 animate-spin" /> : "Save template"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
