-- Create function to get regional top fans for a driver
CREATE OR REPLACE FUNCTION public.get_regional_top_fans_for_driver(
  target_driver_id uuid, 
  target_region text, 
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  user_id uuid, 
  username text, 
  display_name text, 
  avatar_url text, 
  region text, 
  total_points integer, 
  rank_position bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  AND p.region = target_region
  AND dfp.total_points > 0
  ORDER BY dfp.total_points DESC
  LIMIT limit_count;
END;
$function$;

-- Create function to get user's regional rank for a driver
CREATE OR REPLACE FUNCTION public.get_user_regional_rank_for_driver(
  target_driver_id uuid, 
  target_user_id uuid
)
RETURNS TABLE(
  rank_position bigint, 
  total_points integer, 
  region text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_region text;
BEGIN
  -- Get user's region
  SELECT region INTO user_region
  FROM public.profiles 
  WHERE user_id = target_user_id;
  
  IF user_region IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    rank_pos,
    points,
    user_region as region
  FROM (
    SELECT 
      dfp.total_points as points,
      RANK() OVER (ORDER BY dfp.total_points DESC) as rank_pos
    FROM public.driver_fan_points dfp
    JOIN public.profiles p ON dfp.user_id = p.user_id
    WHERE dfp.driver_id = target_driver_id
    AND p.region = user_region
    AND dfp.total_points > 0
  ) ranked_fans
  WHERE EXISTS (
    SELECT 1 FROM public.driver_fan_points dfp2 
    WHERE dfp2.user_id = target_user_id 
    AND dfp2.driver_id = target_driver_id
    AND dfp2.total_points = points
  );
END;
$function$;

-- Create function to get available regions with fan counts for a driver
CREATE OR REPLACE FUNCTION public.get_driver_regions_with_fans(target_driver_id uuid)
RETURNS TABLE(
  region text, 
  fan_count bigint, 
  top_fan_points integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.region,
    COUNT(*) as fan_count,
    MAX(dfp.total_points)::integer as top_fan_points
  FROM public.driver_fan_points dfp
  JOIN public.profiles p ON dfp.user_id = p.user_id
  WHERE dfp.driver_id = target_driver_id
  AND dfp.total_points > 0
  AND p.region IS NOT NULL
  GROUP BY p.region
  ORDER BY fan_count DESC, top_fan_points DESC;
END;
$function$;

-- Create function to get regional fan leaders (users who are #1 in their region for any driver)
CREATE OR REPLACE FUNCTION public.get_regional_fan_leaders(target_user_id uuid)
RETURNS TABLE(
  driver_id uuid,
  driver_name text,
  region text,
  total_points integer,
  is_tied boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  WITH regional_leaders AS (
    SELECT 
      dfp.driver_id,
      p.region,
      dfp.user_id,
      dfp.total_points,
      RANK() OVER (PARTITION BY dfp.driver_id, p.region ORDER BY dfp.total_points DESC) as regional_rank,
      COUNT(*) OVER (PARTITION BY dfp.driver_id, p.region, dfp.total_points) as tied_count
    FROM public.driver_fan_points dfp
    JOIN public.profiles p ON dfp.user_id = p.user_id
    WHERE dfp.total_points > 0
    AND p.region IS NOT NULL
  )
  SELECT 
    rl.driver_id,
    d.name as driver_name,
    rl.region,
    rl.total_points,
    (rl.tied_count > 1) as is_tied
  FROM regional_leaders rl
  JOIN public.drivers d ON rl.driver_id = d.id
  WHERE rl.user_id = target_user_id
  AND rl.regional_rank = 1;
END;
$function$;

-- Add indexes for better regional query performance
CREATE INDEX IF NOT EXISTS idx_driver_fan_points_driver_region 
ON public.driver_fan_points (driver_id, total_points DESC)
WHERE total_points > 0;

CREATE INDEX IF NOT EXISTS idx_profiles_region 
ON public.profiles (region)
WHERE region IS NOT NULL;