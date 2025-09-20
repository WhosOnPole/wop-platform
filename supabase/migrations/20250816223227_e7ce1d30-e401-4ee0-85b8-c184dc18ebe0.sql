-- Fix fan post comments to require moderation
ALTER TABLE public.fan_post_comments 
ALTER COLUMN status SET DEFAULT 'pending';