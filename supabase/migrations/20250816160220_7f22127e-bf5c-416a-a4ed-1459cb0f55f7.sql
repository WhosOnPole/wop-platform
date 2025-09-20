-- Create function to check single-level nesting for driver comment replies
CREATE OR REPLACE FUNCTION public.check_single_level_reply()
RETURNS trigger AS $$
BEGIN
  -- Check if the parent comment is already a reply itself
  IF EXISTS (
    SELECT 1 FROM public.driver_comment_replies 
    WHERE id = NEW.parent_comment_id
  ) THEN
    RAISE EXCEPTION 'Cannot reply to a reply - only single-level replies are allowed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to enforce single-level replies
DROP TRIGGER IF EXISTS enforce_single_level_replies ON public.driver_comment_replies;
CREATE TRIGGER enforce_single_level_replies
  BEFORE INSERT OR UPDATE ON public.driver_comment_replies
  FOR EACH ROW EXECUTE FUNCTION public.check_single_level_reply();

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_driver_comment_replies_parent ON public.driver_comment_replies(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_fan_post_comments_post ON public.fan_post_comments(fan_post_id);
CREATE INDEX IF NOT EXISTS idx_driver_comment_likes_comment ON public.driver_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_fan_post_likes_post ON public.fan_post_likes(fan_post_id);