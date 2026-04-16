/**
 * Minimum data for `public.teams` so Hiring → “Grant crew app access” can run.
 * Paste into Supabase Dashboard → SQL Editor → Run. Adjust name / ZIP / lat / lng for your area.
 *
 * Same sample crews as `supabase/seed_demo.sql` (San Francisco–style zips).
 */
export const TEAMS_SEED_SQL = `insert into public.teams (name, zip_code, base_lat, base_lng, is_available)
values
  ('Team Bay North', '94102', 37.7856, -122.4077, true),
  ('Team Bay Central', '94103', 37.7726, -122.4099, true),
  ('Team Bay East', '94105', 37.7894, -122.3942, true);`;
