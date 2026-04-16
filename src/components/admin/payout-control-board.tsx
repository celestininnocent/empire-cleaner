"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatUsd } from "@/lib/pricing";
import { friendlyFetchFailureMessage, sameOriginJsonPost } from "@/lib/network-error";

type PayoutRow = {
  id: string;
  time_entry_id: string;
  status: "pending" | "processing" | "paid" | "failed" | "awaiting_destination";
  amount_cents: number;
  base_cents?: number | null;
  quality_bonus_cents?: number | null;
  on_time_bonus_cents?: number | null;
  created_at: string;
  paid_at: string | null;
  failure_reason: string | null;
  cleaner_name: string;
  job_label: string;
};

export function PayoutControlBoard({ initialRows }: { initialRows: PayoutRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function retry(row: PayoutRow) {
    setError(null);
    setSuccess(null);
    setBusy(row.id);
    try {
      const res = await fetch("/api/crew/payouts/process", {
        ...sameOriginJsonPost,
        body: JSON.stringify({ timeEntryId: row.time_entry_id }),
      });
      const data = (await res.json()) as {
        error?: string;
        status?: PayoutRow["status"];
        transferId?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Retry failed");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                status: (data.status as PayoutRow["status"]) ?? r.status,
                paid_at:
                  data.status === "paid" ? new Date().toISOString() : r.paid_at,
                failure_reason:
                  data.status === "failed" ? r.failure_reason : null,
              }
            : r
        )
      );
      setSuccess(
        data.status === "paid"
          ? "Payout transfer sent."
          : data.status === "awaiting_destination"
            ? "Still waiting for contractor payout account."
            : "Payout retry submitted."
      );
    } catch (e) {
      setError(friendlyFetchFailureMessage(e));
    } finally {
      setBusy(null);
    }
  }

  function badgeVariant(status: PayoutRow["status"]) {
    if (status === "paid") return "secondary" as const;
    if (status === "failed") return "destructive" as const;
    if (status === "awaiting_destination") return "outline" as const;
    return "outline" as const;
  }

  return (
    <Card className="mb-8 border-border/80">
      <CardHeader>
        <CardTitle>Payout control board</CardTitle>
        <CardDescription>
          Review and retry failed or blocked contractor payouts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cleaner</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Amount</TableHead>
                  <TableHead>Breakdown</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  No payout rows yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.cleaner_name}</TableCell>
                  <TableCell className="max-w-[220px] truncate">{r.job_label}</TableCell>
                  <TableCell>{formatUsd(r.amount_cents)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    Base {formatUsd(r.base_cents ?? r.amount_cents)}
                    {" · "}Q {formatUsd(r.quality_bonus_cents ?? 0)}
                    {" · "}On-time {formatUsd(r.on_time_bonus_cents ?? 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariant(r.status)}>{r.status}</Badge>
                    {r.failure_reason ? (
                      <p className="mt-1 max-w-[220px] truncate text-xs text-destructive">
                        {r.failure_reason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(r.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {r.status === "paid" ? (
                      <span className="text-xs text-muted-foreground">Paid</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void retry(r)}
                        disabled={busy === r.id}
                      >
                        {busy === r.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Retry payout"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

