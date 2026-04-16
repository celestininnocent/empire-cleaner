/** Shown when Supabase env is missing so routes like /portal /admin /field do not fail silently. */
export function SetupBanner() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-950 dark:text-amber-100">
      <strong className="font-semibold">Supabase not configured.</strong> Add{" "}
      <code className="rounded bg-background/60 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
      <code className="rounded bg-background/60 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
      <code className="rounded bg-background/60 px-1">.env.local</code>
      , restart <code className="rounded bg-background/60 px-1">npm run dev</code>, then My account / Owner /
      Crew will load.
    </div>
  );
}
