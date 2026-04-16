/**
 * One-off: set profiles.role = 'admin' using the service role key.
 * Usage:
 *   node scripts/promote-admin.mjs
 *   TARGET_EMAIL=you@example.com node scripts/promote-admin.mjs
 *
 * Loads ../.env.local (no dotenv dependency).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const raw = readFileSync(path, "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    let v = trimmed.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

const env = loadEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.TARGET_EMAIL?.trim();

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
  perPage: 1000,
});
if (listErr) {
  console.error("listUsers:", listErr.message);
  process.exit(1);
}

const users = listData.users ?? [];
if (users.length === 0) {
  console.error("No auth users found. Sign up once in the app, then run again.");
  process.exit(1);
}

let chosen;
if (targetEmail) {
  chosen = users.find(
    (u) => (u.email ?? "").toLowerCase() === targetEmail.toLowerCase()
  );
  if (!chosen) {
    console.error(`No user with email: ${targetEmail}`);
    console.error(
      "Known emails:",
      users.map((u) => u.email).join(", ")
    );
    process.exit(1);
  }
} else if (users.length === 1) {
  chosen = users[0];
  console.log("Single account in project — using that user.");
} else {
  users.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  chosen = users[0];
  console.warn(
    `Multiple users (${users.length}); promoting most recently created: ${chosen.email ?? chosen.id}`
  );
  console.warn("Set TARGET_EMAIL=... to pick a specific account.");
}

const id = chosen.id;
const emailLocal = chosen.email
  ? String(chosen.email).split("@")[0]
  : "User";

const { data: updated, error: upErr } = await supabase
  .from("profiles")
  .upsert(
    { id, role: "admin", full_name: emailLocal },
    { onConflict: "id" }
  )
  .select("id, role")
  .maybeSingle();

if (upErr) {
  console.error("Upsert failed:", upErr.message);
  if (
    upErr.message?.includes("profiles") ||
    upErr.code === "PGRST205"
  ) {
    console.error(
      "\nApply the SQL migrations in Supabase (SQL Editor), in order:\n" +
        "  supabase/migrations/001_initial_schema.sql\n" +
        "  … then 002, 003, 004\n" +
        "Then run this script again.\n"
    );
  }
  console.error("\nYour user id (for manual SQL after migrations):", id);
  console.error(
    "  insert into public.profiles (id, role, full_name) values ('<id>', 'admin', 'Your name')\n" +
      "  on conflict (id) do update set role = 'admin';"
  );
  process.exit(1);
}

if (!updated) {
  console.error("Unexpected: upsert returned no row for id=" + id);
  process.exit(1);
}

console.log("OK — admin granted.");
console.log("  User:", chosen.email ?? "(no email)");
console.log("  id:", id);
console.log("  profiles:", updated);
