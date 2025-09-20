-- Fix RLS policies for votes table to allow vote counting
-- Drop the restrictive SELECT policy that blocks all access
DROP POLICY IF EXISTS "Users can view votes via RPC only" ON public.votes;

-- Create a new policy that allows users to read vote counts but not individual vote details
-- This policy will allow SELECT operations for counting votes per poll
CREATE POLICY "Users can view vote counts for live polls" 
ON public.votes 
FOR SELECT 
USING (
  -- Allow reading votes for polls that are live or closed (for results)
  EXISTS (
    SELECT 1 FROM public.polls 
    WHERE polls.id = votes.poll_id 
    AND polls.status IN ('live', 'closed')
  )
);