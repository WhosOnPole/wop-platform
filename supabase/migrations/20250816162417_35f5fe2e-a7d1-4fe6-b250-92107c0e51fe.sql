-- Update fan_posts policies to allow moderators to update status
DROP POLICY IF EXISTS "Admins can update all posts" ON public.fan_posts;

CREATE POLICY "Moderators and admins can update all posts" 
ON public.fan_posts 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Update fan_posts admin view policy to include moderators
DROP POLICY IF EXISTS "Admins can view all posts" ON public.fan_posts;

CREATE POLICY "Moderators and admins can view all posts" 
ON public.fan_posts 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);

-- Ensure profiles table has correct policies (user can select all, update own)
-- These already exist but let's make sure they're correct

-- Verify grids policies (already correct - owner can manage, public can select)

-- Verify votes policies - currently allows select all, but user wants aggregated via RPC only
-- Update votes select policy to be more restrictive
DROP POLICY IF EXISTS "Users can view all votes" ON public.votes;

CREATE POLICY "Users can view votes via RPC only" 
ON public.votes 
FOR SELECT 
USING (false); -- Disable direct select, force use of RPC functions

-- Add a policy for admins/moderators to view votes for moderation
CREATE POLICY "Moderators and admins can view all votes" 
ON public.votes 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'moderator'::app_role)
);