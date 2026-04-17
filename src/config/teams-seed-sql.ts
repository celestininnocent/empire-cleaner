/**
 * Minimum data for `public.teams` so Hiring → “Grant crew app access” can run.
 * Paste into Supabase Dashboard → SQL Editor → Run. Adjust name / ZIP / lat / lng for your area.
 *
 * Uses Portland-area example values (edit to your actual service area).
 */
export const TEAMS_SEED_SQL = `insert into public.teams (name, zip_code, base_lat, base_lng, is_available)
values
  ('Team North', '97209', 45.5290, -122.6828, true),
  ('Team Central', '97214', 45.5155, -122.6587, true),
  ('Team East', '97232', 45.5244, -122.6387, true);`;
