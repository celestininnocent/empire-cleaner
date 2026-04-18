-- Public bucket for crew checklist proof images (URLs stored on job_checklist_items.photo_url).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'checklist-photos',
  'checklist-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone with the URL can render images in the portal and admin (same as typical CDN proof photos).
drop policy if exists "checklist_photos_public_read" on storage.objects;
create policy "checklist_photos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'checklist-photos');
