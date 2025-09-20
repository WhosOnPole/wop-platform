-- Fix security issue: set proper search_path for functions
CREATE OR REPLACE FUNCTION public.set_spotlight_post(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First, remove spotlight from all posts
  UPDATE public.fan_posts 
  SET is_spotlight = false 
  WHERE is_spotlight = true;
  
  -- Then set the new spotlight post
  UPDATE public.fan_posts 
  SET is_spotlight = true 
  WHERE id = post_id AND status = 'approved';
END;
$$;

-- Fix security issue: set proper search_path for functions
CREATE OR REPLACE FUNCTION public.remove_spotlight_post(post_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.fan_posts 
  SET is_spotlight = false 
  WHERE id = post_id;
END;
$$;