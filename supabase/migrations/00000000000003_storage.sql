-- Storage bucket for vehicle photos/videos and other site media.
-- Public read (so <Image> can serve directly from the CDN URL); writes are
-- admin-only and go through the server (service role / RLS-checked session),
-- never directly from an unauthenticated browser.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  52428800, -- 50MB
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
on conflict (id) do nothing;

create policy "media bucket public read"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media bucket admin insert"
  on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

create policy "media bucket admin update"
  on storage.objects for update
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media bucket admin delete"
  on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());
