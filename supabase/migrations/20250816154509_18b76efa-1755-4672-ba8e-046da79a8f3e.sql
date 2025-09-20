-- Create fan post likes table
CREATE TABLE public.fan_post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fan_post_id, user_id)
);

-- Create driver comment likes table
CREATE TABLE public.driver_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create fan post comments table
CREATE TABLE public.fan_post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver comment replies table
CREATE TABLE public.driver_comment_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_comment_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fan_post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_comment_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for fan_post_likes
CREATE POLICY "Users can view all fan post likes" 
ON public.fan_post_likes FOR SELECT USING (true);

CREATE POLICY "Users can create their own fan post likes" 
ON public.fan_post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fan post likes" 
ON public.fan_post_likes FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for driver_comment_likes
CREATE POLICY "Users can view all driver comment likes" 
ON public.driver_comment_likes FOR SELECT USING (true);

CREATE POLICY "Users can create their own comment likes" 
ON public.driver_comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comment likes" 
ON public.driver_comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for fan_post_comments
CREATE POLICY "Users can view approved fan post comments" 
ON public.fan_post_comments FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own fan post comments" 
ON public.fan_post_comments FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own fan post comments" 
ON public.fan_post_comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own fan post comments" 
ON public.fan_post_comments FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all fan post comments" 
ON public.fan_post_comments FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all fan post comments" 
ON public.fan_post_comments FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for driver_comment_replies
CREATE POLICY "Users can view approved comment replies" 
ON public.driver_comment_replies FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own comment replies" 
ON public.driver_comment_replies FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own comment replies" 
ON public.driver_comment_replies FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comment replies" 
ON public.driver_comment_replies FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all comment replies" 
ON public.driver_comment_replies FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all comment replies" 
ON public.driver_comment_replies FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_fan_post_comments_updated_at
  BEFORE UPDATE ON public.fan_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_comment_replies_updated_at
  BEFORE UPDATE ON public.driver_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add database functions for like counts
CREATE OR REPLACE FUNCTION public.get_fan_post_like_count(target_post_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.fan_post_likes 
    WHERE fan_post_id = target_post_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_driver_comment_like_count(target_comment_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.driver_comment_likes 
    WHERE comment_id = target_comment_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_fan_post_comment_count(target_post_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.fan_post_comments 
    WHERE fan_post_id = target_post_id AND status = 'approved'
  );
END;
$function$;