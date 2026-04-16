-- Demo teams for dispatch (San Francisco area). Run after migrations.
insert into public.teams (name, zip_code, base_lat, base_lng, is_available)
values
  ('Team Bay North', '94102', 37.7856, -122.4077, true),
  ('Team Bay Central', '94103', 37.7726, -122.4099, true),
  ('Team Bay East', '94105', 37.7894, -122.3942, true);

-- Promote a user to admin (replace UUID with your auth.users id):
-- update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
