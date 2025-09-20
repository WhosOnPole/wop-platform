-- Fix function search path
CREATE OR REPLACE FUNCTION public.check_single_level_reply()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
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
$$;