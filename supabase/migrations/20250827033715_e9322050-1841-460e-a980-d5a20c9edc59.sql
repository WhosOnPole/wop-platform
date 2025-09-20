-- Create driver fan points table
CREATE TABLE public.driver_fan_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  last_decay_applied TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, driver_id)
);

-- Create fan point activities audit table
CREATE TABLE public.fan_point_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('grid_ranking', 'favorite_selection', 'poll_vote', 'comment', 'fan_post')),
  points_awarded INTEGER NOT NULL,
  activity_reference_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add region column to profiles
ALTER TABLE public.profiles ADD COLUMN region TEXT;

-- Enable RLS
ALTER TABLE public.driver_fan_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_point_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_fan_points
CREATE POLICY "Fan points are viewable by everyone" 
ON public.driver_fan_points 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own fan points" 
ON public.driver_fan_points 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for fan_point_activities
CREATE POLICY "Fan activities are viewable by everyone" 
ON public.fan_point_activities 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own fan activities" 
ON public.fan_point_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger for driver_fan_points
CREATE TRIGGER update_driver_fan_points_updated_at
BEFORE UPDATE ON public.driver_fan_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate grid ranking points
CREATE OR REPLACE FUNCTION public.calculate_grid_ranking_points(grid_position INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Position 1 = 20 points, Position 20 = 1 point
  IF grid_position < 1 OR grid_position > 20 THEN
    RETURN 0;
  END IF;
  RETURN 21 - grid_position;
END;
$$;

-- Create function to update driver fan points
CREATE OR REPLACE FUNCTION public.update_driver_fan_points(
  target_user_id UUID,
  target_driver_id UUID,
  points_to_add INTEGER,
  activity_type TEXT,
  activity_ref_id UUID DEFAULT NULL,
  activity_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update fan points
  INSERT INTO public.driver_fan_points (user_id, driver_id, total_points)
  VALUES (target_user_id, target_driver_id, points_to_add)
  ON CONFLICT (user_id, driver_id)
  DO UPDATE SET 
    total_points = driver_fan_points.total_points + points_to_add,
    updated_at = now();
  
  -- Record the activity
  INSERT INTO public.fan_point_activities (
    user_id, 
    driver_id, 
    activity_type, 
    points_awarded, 
    activity_reference_id, 
    metadata
  )
  VALUES (
    target_user_id, 
    target_driver_id, 
    activity_type, 
    points_to_add, 
    activity_ref_id, 
    activity_metadata
  );
END;
$$;

-- Create function to get top fans for a driver
CREATE OR REPLACE FUNCTION public.get_top_fans_for_driver(
  target_driver_id UUID,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  region TEXT,
  total_points INTEGER,
  rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dfp.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.region,
    dfp.total_points,
    RANK() OVER (ORDER BY dfp.total_points DESC) as rank_position
  FROM public.driver_fan_points dfp
  JOIN public.profiles p ON dfp.user_id = p.user_id
  WHERE dfp.driver_id = target_driver_id
  AND dfp.total_points > 0
  ORDER BY dfp.total_points DESC
  LIMIT limit_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_driver_fan_points_driver_points ON public.driver_fan_points (driver_id, total_points DESC);
CREATE INDEX idx_driver_fan_points_user_driver ON public.driver_fan_points (user_id, driver_id);
CREATE INDEX idx_fan_point_activities_user_driver ON public.fan_point_activities (user_id, driver_id);
CREATE INDEX idx_fan_point_activities_created_at ON public.fan_point_activities (created_at DESC);