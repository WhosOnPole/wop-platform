-- Migration: Create Storage bucket "tracks" for track circuit SVGs
-- Path convention: tracks/<track_slug>/track.svg
-- Public read; admin-only write (profiles.role = 'admin').

-- Create the bucket (public so anonymous read works for serving SVGs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks',
  'tracks',
  true,
  524288,
  ARRAY['image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read: anyone can read objects in the tracks bucket
DROP POLICY IF EXISTS "Public read tracks bucket" ON storage.objects;
CREATE POLICY "Public read tracks bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'tracks');

-- Admin insert: only users with profiles.role = 'admin' can upload
-- Optional: restrict to path shape <track_slug>/track.svg
DROP POLICY IF EXISTS "Admin insert tracks bucket" ON storage.objects;
CREATE POLICY "Admin insert tracks bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tracks'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  AND name ~ '^[a-z0-9_]+/track\.svg$'
);

-- Admin update: only admins can update objects in tracks bucket
DROP POLICY IF EXISTS "Admin update tracks bucket" ON storage.objects;
CREATE POLICY "Admin update tracks bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tracks'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (bucket_id = 'tracks');

-- Admin delete: only admins can delete objects in tracks bucket
DROP POLICY IF EXISTS "Admin delete tracks bucket" ON storage.objects;
CREATE POLICY "Admin delete tracks bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tracks'
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
