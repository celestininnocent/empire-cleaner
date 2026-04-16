"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import { friendlyFetchFailureMessage } from "@/lib/network-error";
import { TEAMS_SEED_SQL } from "@/config/teams-seed-sql";
import {
  matchTeamIdByApplicantZip,
  normalizeZipKey,
  resolveCrewTeamIdForGrant,
} from "@/lib/hiring-team";
import { cn } from "@/lib/utils";
import {
  approveApplicantAsOwnerAction,
  insertApplicantAction,
  revokeApplicantAccessAction,
  updateApplicantNotesAction,
  updateApplicantStatusAction,
} from "@/app/admin/hiring/actions";

const stages = [
  "applied",
  "interview",
  "background_checked",
  "offered",
  "onboarded",
  "hired",
  "rejected",
] as const;

function stageLabel(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

type Applicant = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  zip_code: string | null;
  status: (typeof stages)[number];
  notes: string | null;
  created_at: string;
  crew_team_id?: string | null;
  app_access_role?: string | null;
};

type TeamOption = { id: string; name: string; zip_code: string };

function effectiveApplicantZip(
  a: Applicant,
  profileZipByEmail: Record<string, string>
): string | null {
  const direct = a.zip_code?.trim();
  if (direct) return direct;
  const key = a.email.trim().toLowerCase();
  return profileZipByEmail[key]?.trim() || null;
}

function CrewAccessBadge({ a, teams }: { a: Applicant; teams: TeamOption[] }) {
  if (a.app_access_role === "admin") {
    return (
      <Badge variant="outline" className="w-fit">
        Owner access
      </Badge>
    );
  }
  if (a.crew_team_id) {
    const name = teams.find((t) => t.id === a.crew_team_id)?.name ?? "Team";
    return (
      <Badge className="w-fit border-primary/30 bg-primary/10 font-medium text-primary hover:bg-primary/10">
        Crew app · {name}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="w-fit font-normal text-muted-foreground">
      Crew app not granted
    </Badge>
  );
}

export function HiringPipeline({
  initial,
  teams,
  profileZipByEmail = {},
}: {
  initial: Applicant[];
  teams: TeamOption[];
  /** ZIP from `profiles` when the applicant row has none — same email as signup. */
  profileZipByEmail?: Record<string, string>;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /** applicant id → team id for "Approve for crew" */
  const [crewTeamPick, setCrewTeamPick] = useState<Record<string, string>>({});
  /** Last status under the Grant button (secondary to the fixed banner). */
  const [crewGrantLine, setCrewGrantLine] = useState<Record<string, string>>({});
  /** Fixed banner — portaled to document.body so overflow/transform can’t hide it. */
  const [grantBanner, setGrantBanner] = useState<{
    text: string;
    tone: "info" | "success" | "error";
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useLayoutEffect(() => {
    setPortalReady(true);
  }, []);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    zip_code: "",
  });

  async function addApplicant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy("new");
    try {
      const data = await insertApplicantAction({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        zip_code: form.zip_code || null,
      });
      setRows((r) => [data as Applicant, ...r]);
      setForm({ full_name: "", email: "", phone: "", zip_code: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save applicant.");
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(id: string, status: Applicant["status"]) {
    setError(null);
    setSuccess(null);
    setBusy(id);
    const prev = rows.find((row) => row.id === id);
    try {
      await updateApplicantStatusAction(id, status);
      setRows((r) => r.map((row) => (row.id === id ? { ...row, status } : row)));
      router.refresh();
      if (
        (status === "onboarded" || status === "hired") &&
        prev &&
        !prev.crew_team_id &&
        prev.app_access_role !== "admin"
      ) {
        setSuccess(
          "Stage updated — pick a crew below and click “Grant crew app access” so they can open the crew app (/field)."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update stage.");
    } finally {
      setBusy(null);
    }
  }

  async function saveNotes(id: string, notes: string) {
    setError(null);
    setSuccess(null);
    setBusy(id);
    try {
      await updateApplicantNotesAction(id, notes);
      setRows((r) => r.map((row) => (row.id === id ? { ...row, notes } : row)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save notes.");
    } finally {
      setBusy(null);
    }
  }

  async function approveForCrew(a: Applicant) {
    try {
      const picked =
        resolveCrewTeamIdForGrant({
          applicantId: a.id,
          manualPick: crewTeamPick,
          storedCrewTeamId: a.crew_team_id,
          applicantZip: effectiveApplicantZip(a, profileZipByEmail),
          teams,
        }) ?? "";

      const res = await fetch("/api/admin/hiring/grant-crew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ applicantId: a.id, teamId: picked }),
      });
      const raw = await res.text();
      let data: {
        mode?: string;
        message?: string;
        crewTeamId?: string | null;
        error?: string;
      } = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as typeof data;
        } catch {
          throw new Error(`Server returned non-JSON (${res.status}). Check the terminal / Network tab.`);
        }
      }
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      if (data.error) {
        throw new Error(data.error);
      }
      if (!data.message) {
        throw new Error("Unexpected response from server.");
      }

      setSuccess(data.message);
      setGrantBanner({ text: data.message, tone: "success" });
      setCrewGrantLine((m) => ({ ...m, [a.id]: data.message ?? "" }));
      setRows((r) =>
        r.map((row) =>
          row.id === a.id
            ? {
                ...row,
                status: "onboarded",
                crew_team_id: data.crewTeamId ?? picked,
              }
            : row
        )
      );
      router.refresh();
    } catch (err) {
      const msg = friendlyFetchFailureMessage(err);
      setError(msg);
      setGrantBanner({ text: msg, tone: "error" });
      setCrewGrantLine((m) => ({ ...m, [a.id]: msg }));
    } finally {
      setBusy(null);
    }
  }

  async function approveForOwner(a: Applicant) {
    setError(null);
    setSuccess(null);
    setBusy(`owner-${a.id}`);
    try {
      const result = await approveApplicantAsOwnerAction(a.id);
      setSuccess(result.message);
      setRows((r) =>
        r.map((row) =>
          row.id === a.id
            ? {
                ...row,
                status: "onboarded",
                crew_team_id: null,
                app_access_role: "admin",
              }
            : row
        )
      );
      setCrewTeamPick((p) => {
        const next = { ...p };
        delete next[a.id];
        return next;
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve as owner.");
    } finally {
      setBusy(null);
    }
  }

  async function revokeAccess(a: Applicant) {
    if (
      !window.confirm(
        "Remove crew and owner app access for this email? Their login stays active as a customer."
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    setBusy(`revoke-${a.id}`);
    try {
      const result = await revokeApplicantAccessAction(a.id);
      setSuccess(result.message);
      setRows((r) =>
        r.map((row) =>
          row.id === a.id
            ? { ...row, crew_team_id: null, app_access_role: null }
            : row
        )
      );
      setCrewTeamPick((p) => {
        const next = { ...p };
        delete next[a.id];
        return next;
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove access.");
    } finally {
      setBusy(null);
    }
  }

  const rowBusy = (id: string) =>
    busy === `crew-${id}` || busy === `owner-${id}` || busy === `revoke-${id}`;

  const grantPortal =
    portalReady && grantBanner
      ? createPortal(
          <div
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
            role="status"
            aria-live="assertive"
          >
            <div
              className={cn(
                "pointer-events-auto max-w-lg rounded-xl border-2 px-5 py-4 text-center text-base font-semibold shadow-2xl",
                grantBanner.tone === "info" &&
                  "border-primary bg-primary text-primary-foreground",
                grantBanner.tone === "success" &&
                  "border-emerald-600/50 bg-emerald-950/95 text-emerald-50 dark:bg-emerald-950/90",
                grantBanner.tone === "error" &&
                  "border-destructive bg-destructive/15 text-destructive dark:bg-destructive/25"
              )}
            >
              {grantBanner.text}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-8">
      {grantPortal}
      {success ? (
        <p className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-foreground" role="status">
          {success}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {teams.length === 0 ? (
        <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <p className="font-medium">
            No crews in the database yet — granting access can’t run until Supabase has at least one
            row in <code className="rounded bg-background/60 px-1 py-0.5 text-xs">public.teams</code>.
            This isn’t automatic: routes need a base ZIP and map coordinates for dispatch.
          </p>
          <p className="text-xs leading-relaxed opacity-90">
            In{" "}
            <strong className="font-medium">Supabase Dashboard → SQL Editor</strong>, paste the
            script below and click <strong>Run</strong>. Then refresh this page.
          </p>
          <pre className="max-h-48 overflow-auto rounded-md border border-amber-500/30 bg-background/90 p-3 text-left text-[11px] leading-snug font-mono text-foreground shadow-inner">
            {TEAMS_SEED_SQL}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-amber-600/40 bg-background/80 text-amber-950 hover:bg-amber-500/20 dark:text-amber-50"
              onClick={() => {
                void navigator.clipboard.writeText(TEAMS_SEED_SQL);
              }}
            >
              Copy SQL
            </Button>
            <span className="text-[11px] text-muted-foreground self-center">
              Repo file: <code className="rounded bg-muted px-1">supabase/seed_demo.sql</code> (same
              inserts)
            </span>
          </div>
        </div>
      ) : null}
      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{siteConfig.hiringAddTitle}</CardTitle>
          <CardDescription>{siteConfig.hiringAddDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={addApplicant} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP</Label>
              <Input
                id="zip"
                value={form.zip_code}
                onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={busy === "new"}>
                {busy === "new" ? <Loader2 className="size-4 animate-spin" /> : "Save applicant"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle>{siteConfig.hiringBoardTitle}</CardTitle>
          <CardDescription>{siteConfig.hiringBoardDesc}</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ZIP</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="min-w-[300px]">
                  <span className="block">Crew app</span>
                  <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                    Grant access for each email below
                  </span>
                </TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => {
                const zipForCrew = effectiveApplicantZip(a, profileZipByEmail);
                return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.full_name}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    {zipForCrew ?? "—"}
                    {!a.zip_code?.trim() && zipForCrew ? (
                      <span className="ml-1 text-[10px] text-muted-foreground">(account)</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={a.status}
                      onValueChange={(v) =>
                        updateStatus(a.id, v as Applicant["status"])
                      }
                    >
                      <SelectTrigger className="w-[min(100%,240px)]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {!(stages as readonly string[]).includes(a.status) ? (
                          <SelectItem value={a.status}>
                            {stageLabel(String(a.status))} (from database)
                          </SelectItem>
                        ) : null}
                        {stages.map((s) => (
                          <SelectItem key={s} value={s}>
                            {stageLabel(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {busy === a.id ? (
                      <Loader2 className="ml-2 inline size-4 animate-spin" />
                    ) : null}
                  </TableCell>
                  <TableCell className="align-top whitespace-normal max-w-[min(100vw,360px)]">
                    <div
                      className={cn(
                        "relative z-10 flex min-w-[260px] max-w-[320px] flex-col gap-3 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] to-transparent p-3 shadow-sm"
                      )}
                    >
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                          Crew app — grant access for this email
                        </p>
                        <p className="break-all text-sm font-medium leading-snug text-foreground">
                          {a.email}
                        </p>
                        <CrewAccessBadge a={a} teams={teams} />
                      </div>
                      {/* Plain styles (no shared Button): avoids Tailwind `disabled:pointer-events-none` and server-action quirks. */}
                      <button
                        type="button"
                        disabled={busy === `crew-${a.id}`}
                        className={cn(
                          "inline-flex w-full min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm outline-none transition-colors",
                          "hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          "disabled:cursor-wait disabled:opacity-80",
                          "touch-manipulation select-none",
                          teams.length === 0 && busy !== `crew-${a.id}`
                            ? "cursor-pointer opacity-95 ring-2 ring-amber-500/50"
                            : null
                        )}
                        aria-label={`Grant crew app access for ${a.email}`}
                        title={
                          teams.length === 0
                            ? "Click for instructions — add a crew in Supabase first."
                            : "Grants /field for this email. Crew follows ZIP when it matches a route; otherwise the default crew."
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (teams.length === 0) {
                            const msg =
                              "No crews yet — paste the SQL from the yellow box above into Supabase SQL Editor, Run, then refresh.";
                            flushSync(() => {
                              setGrantBanner({ text: msg, tone: "error" });
                              setError(msg);
                              setSuccess(null);
                              setCrewGrantLine((m) => ({ ...m, [a.id]: msg }));
                            });
                            return;
                          }
                          flushSync(() => {
                            setError(null);
                            setSuccess(null);
                            setBusy(`crew-${a.id}`);
                            setGrantBanner({
                              text: "Working… sending request to server.",
                              tone: "info",
                            });
                            setCrewGrantLine((m) => ({
                              ...m,
                              [a.id]: "Working… sending request to server.",
                            }));
                          });
                          void approveForCrew(a);
                        }}
                      >
                        {busy === `crew-${a.id}` ? (
                          <>
                            <Loader2 className="size-4 animate-spin shrink-0" />
                            Granting…
                          </>
                        ) : (
                          "Grant crew app access"
                        )}
                      </button>
                      {crewGrantLine[a.id] ? (
                        <p
                          className="rounded-md border border-border bg-muted/50 px-2 py-2 text-xs leading-snug text-foreground"
                          role="status"
                          aria-live="polite"
                        >
                          {crewGrantLine[a.id]}
                        </p>
                      ) : null}
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        After you click, this address can use the crew app at{" "}
                        <span className="font-medium text-foreground">/field</span> (invite email if
                        they don&apos;t have an account yet).
                      </p>
                      <div className="space-y-1.5 border-t border-border/60 pt-2">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Crew (ZIP match if possible, otherwise default)
                        </p>
                        <select
                          className={cn(
                            "h-8 w-full rounded-[min(var(--radius-md),12px)] border border-input bg-background px-2 text-[0.8rem] outline-none",
                            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 dark:bg-input/30"
                          )}
                          aria-label={`Override crew team for ${a.email}`}
                          value={
                            resolveCrewTeamIdForGrant({
                              applicantId: a.id,
                              manualPick: crewTeamPick,
                              storedCrewTeamId: a.crew_team_id,
                              applicantZip: zipForCrew,
                              teams,
                            }) ?? ""
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            if (!v) {
                              setCrewTeamPick((p) => {
                                const next = { ...p };
                                delete next[a.id];
                                return next;
                              });
                              return;
                            }
                            setCrewTeamPick((p) => ({ ...p, [a.id]: v }));
                          }}
                        >
                          {teams.length > 1 ? (
                            <option value="">Auto: ZIP match or default crew (or pick to override)…</option>
                          ) : null}
                          {teams.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name} ({t.zip_code})
                            </option>
                          ))}
                        </select>
                        {teams.length === 1 ? (
                          <p className="text-[11px] text-muted-foreground">
                            Only one crew — it’s used automatically.
                          </p>
                        ) : null}
                        {teams.length > 1 &&
                        matchTeamIdByApplicantZip(zipForCrew, teams) &&
                        normalizeZipKey(zipForCrew) ? (
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-200/90">
                            ZIP {normalizeZipKey(zipForCrew)} matches a crew — used unless you override.
                          </p>
                        ) : null}
                        {teams.length > 1 &&
                        !matchTeamIdByApplicantZip(zipForCrew, teams) ? (
                          <p className="text-[11px] text-muted-foreground">
                            No ZIP match to a route — default crew is used unless you pick another above.
                          </p>
                        ) : null}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={rowBusy(a.id)}
                        onClick={() => approveForOwner(a)}
                      >
                        {busy === `owner-${a.id}` ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Grant owner access"
                        )}
                      </Button>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Trusted admins only — access to /admin (separate from crew app).
                      </p>
                      {a.app_access_role === "admin" || a.crew_team_id ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={rowBusy(a.id)}
                          onClick={() => revokeAccess(a)}
                        >
                          {busy === `revoke-${a.id}` ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            "Revoke app access"
                          )}
                        </Button>
                      ) : null}
                      {a.app_access_role === "admin" || a.crew_team_id ? (
                        <p className="text-[11px] text-muted-foreground leading-snug">
                          Sets their profile to customer and removes crew/owner tools. Hiring stage is
                          unchanged — move it to Rejected if they left.
                        </p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <Textarea
                      defaultValue={a.notes ?? ""}
                      onBlur={(e) => saveNotes(a.id, e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {stages.map((s) => (
          <Badge key={s} variant="secondary">
            {stageLabel(s)} · {rows.filter((r) => r.status === s).length}
          </Badge>
        ))}
      </div>
    </div>
  );
}
