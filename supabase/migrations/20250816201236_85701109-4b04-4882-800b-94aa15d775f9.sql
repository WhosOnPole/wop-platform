-- Fix storage policies for admin driver image uploads
-- Allow admins to upload driver images to the drivers/ folder

-- Drop existing restrictive policies that might conflict
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;

-- Create policies that allow user uploads to their own folder
CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add new policy for admin driver uploads
CREATE POLICY "Admins can upload driver images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'drivers'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add policy for admin driver image updates
CREATE POLICY "Admins can update driver images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'drivers'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add policy for admin driver image deletion
CREATE POLICY "Admins can delete driver images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'drivers'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);