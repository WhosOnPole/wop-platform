-- Create storage policies for teams image uploads
CREATE POLICY "Admins can upload team images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'teams'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update team images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'teams'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete team images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'teams'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage policies for tracks image uploads
CREATE POLICY "Admins can upload track images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'tracks'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update track images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'tracks'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete track images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'tracks'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Create storage policies for team principals image uploads
CREATE POLICY "Admins can upload team principal images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team_principals'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update team principal images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team_principals'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete team principal images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team_principals'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow public access to view team, track, and team principal images
CREATE POLICY "Team images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'teams'
);

CREATE POLICY "Track images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'tracks'
);

CREATE POLICY "Team principal images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = 'team_principals'
);