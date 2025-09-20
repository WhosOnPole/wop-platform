-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);

-- Create grid_likes table for tracking likes on grids
CREATE TABLE public.grid_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grid_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint to prevent duplicate likes
  CONSTRAINT grid_likes_unique_pair UNIQUE (grid_id, user_id)
);

-- Enable RLS on grid_likes
ALTER TABLE public.grid_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for grid_likes
CREATE POLICY "Users can view all grid likes" 
ON public.grid_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.grid_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.grid_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for grid_likes
CREATE INDEX idx_grid_likes_grid_id ON public.grid_likes(grid_id);
CREATE INDEX idx_grid_likes_user_id ON public.grid_likes(user_id);

-- Function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_kind TEXT,
  notification_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, kind, payload)
  VALUES (target_user_id, notification_kind, notification_payload)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(target_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.notifications 
    WHERE user_id = target_user_id 
    AND read_at IS NULL
  );
END;
$$;

-- Function to get grid like count
CREATE OR REPLACE FUNCTION public.get_grid_like_count(target_grid_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.grid_likes 
    WHERE grid_id = target_grid_id
  );
END;
$$;

-- Trigger function for follow notifications
CREATE OR REPLACE FUNCTION public.notify_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  follower_profile RECORD;
BEGIN
  -- Get follower profile info
  SELECT username, display_name, avatar_url 
  INTO follower_profile
  FROM public.profiles 
  WHERE user_id = NEW.follower_id;
  
  -- Create notification for the followee
  PERFORM public.create_notification(
    NEW.followee_id,
    'follow',
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_username', follower_profile.username,
      'follower_display_name', follower_profile.display_name,
      'follower_avatar_url', follower_profile.avatar_url
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger function for fan post approval notifications
CREATE OR REPLACE FUNCTION public.notify_fan_post_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only notify when status changes to approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    PERFORM public.create_notification(
      NEW.author_id,
      'fan_post_approved',
      jsonb_build_object(
        'fan_post_id', NEW.id,
        'image_url', NEW.image_url,
        'caption', NEW.caption
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for grid like milestone notifications
CREATE OR REPLACE FUNCTION public.notify_grid_like_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  like_count BIGINT;
  grid_owner_id UUID;
BEGIN
  -- Get current like count and grid owner
  SELECT 
    COUNT(*) as total_likes,
    g.user_id
  INTO like_count, grid_owner_id
  FROM public.grid_likes gl
  JOIN public.grids g ON g.id = gl.grid_id
  WHERE gl.grid_id = NEW.grid_id
  GROUP BY g.user_id;
  
  -- Check if we hit the 25 like milestone
  IF like_count = 25 THEN
    PERFORM public.create_notification(
      grid_owner_id,
      'grid_likes_milestone',
      jsonb_build_object(
        'grid_id', NEW.grid_id,
        'like_count', like_count,
        'milestone', 25
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_notify_follow
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_follow();

CREATE TRIGGER trigger_notify_fan_post_approval
  AFTER UPDATE ON public.fan_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_fan_post_approval();

CREATE TRIGGER trigger_notify_grid_like_milestone
  AFTER INSERT ON public.grid_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_grid_like_milestone();