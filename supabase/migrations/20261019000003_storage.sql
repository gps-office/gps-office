-- GPS Office – private document storage
--
-- Files live in the private bucket "case-documents" at
--   cases/<case id>/<document id>/<version id>
-- Paths contain no client names. Files are only ever served through
-- short-lived signed URLs created by the server for signed-in staff.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents',
  'case-documents',
  false,
  52428800, -- 50 MB per file
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'message/rfc822',
    'application/vnd.ms-outlook'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "Staff can read case documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'case-documents' and (select public.is_active_staff()));

create policy "Staff can upload case documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'case-documents' and (select public.is_active_staff()));

-- Uploaded versions are never overwritten; a new version is a new file.
create policy "Admins can delete case documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'case-documents' and (select public.is_admin()));
