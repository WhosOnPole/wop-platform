-- Add constraint to prevent infinite comment nesting
-- Ensure driver comment replies can only reply to top-level comments
ALTER TABLE public.driver_comment_replies 
ADD CONSTRAINT driver_comment_replies_single_level_only 
CHECK (
  (SELECT parent_comment_id FROM public.driver_comment_replies WHERE id = parent_comment_id) IS NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_driver_comment_replies_parent ON public.driver_comment_replies(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_fan_post_comments_post ON public.fan_post_comments(fan_post_id);
CREATE INDEX IF NOT EXISTS idx_driver_comment_likes_comment ON public.driver_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_fan_post_likes_post ON public.fan_post_likes(fan_post_id);