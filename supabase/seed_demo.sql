-- Demo teams for dispatch (Portland-area example). Run after migrations.
insert into public.teams (name, zip_code, base_lat, base_lng, is_available)
values
  ('Team North', '97209', 45.5290, -122.6828, true),
  ('Team Central', '97214', 45.5155, -122.6587, true),
  ('Team East', '97232', 45.5244, -122.6387, true);

-- Promote a user to admin (replace UUID with your auth.users id):
-- update public.profiles set role = 'admin' where id = 'YOUR-USER-UUID';
