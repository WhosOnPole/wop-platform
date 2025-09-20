-- Create follows table for social following functionality
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  followee_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent users from following themselves
  CONSTRAINT follows_no_self_follow CHECK (follower_id != followee_id),
  
  -- Unique composite index to prevent duplicate follows
  CONSTRAINT follows_unique_pair UNIQUE (follower_id, followee_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create policies for follows table
CREATE POLICY "Users can view all follows" 
ON public.follows 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own follows" 
ON public.follows 
FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows" 
ON public.follows 
FOR DELETE 
USING (auth.uid() = follower_id);

-- Create indexes for better performance
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_followee_id ON public.follows(followee_id);

-- Create function to get follow counts
CREATE OR REPLACE FUNCTION public.get_follow_counts(user_uuid UUID)
RETURNS TABLE(follower_count BIGINT, following_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.follows WHERE followee_id = user_uuid) as follower_count,
    (SELECT COUNT(*) FROM public.follows WHERE follower_id = user_uuid) as following_count;
END;
$$;