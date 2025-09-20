-- Create function to get trending drivers based on user activity
CREATE OR REPLACE FUNCTION get_trending_drivers(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  country TEXT,
  number INTEGER,
  headshot_url TEXT,
  team_name TEXT,
  fan_count BIGINT,
  recent_grids BIGINT,
  avg_stars NUMERIC,
  trending_score NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.country,
    d.number,
    d.headshot_url,
    COALESCE(t.name, 'Independent') as team_name,
    -- Count fans who have this driver as favorite
    COALESCE(fan_counts.fan_count, 0) as fan_count,
    -- Count recent grid appearances (last 30 days)
    COALESCE(recent_activity.recent_grids, 0) as recent_grids,
    -- Average stars from grid items
    COALESCE(star_ratings.avg_stars, 0) as avg_stars,
    -- Calculate trending score (recent activity + fan count + stars)
    (COALESCE(recent_activity.recent_grids, 0) * 2 + 
     COALESCE(fan_counts.fan_count, 0) + 
     COALESCE(star_ratings.avg_stars, 0) * 10) as trending_score
  FROM drivers d
  LEFT JOIN teams t ON d.team_id = t.id
  LEFT JOIN (
    -- Subquery for fan counts
    SELECT 
      favorite_driver_id as driver_id,
      COUNT(*) as fan_count
    FROM profiles 
    WHERE favorite_driver_id IS NOT NULL
    GROUP BY favorite_driver_id
  ) fan_counts ON d.id = fan_counts.driver_id
  LEFT JOIN (
    -- Subquery for recent grid activity
    SELECT 
      (jsonb_array_elements(g.items)->>'driver_id')::UUID as driver_id,
      COUNT(*) as recent_grids
    FROM grids g
    WHERE g.created_at >= NOW() - INTERVAL '30 days'
    AND jsonb_array_length(g.items) > 0
    GROUP BY (jsonb_array_elements(g.items)->>'driver_id')::UUID
  ) recent_activity ON d.id = recent_activity.driver_id
  LEFT JOIN (
    -- Subquery for star ratings
    SELECT 
      (jsonb_array_elements(g.items)->>'driver_id')::UUID as driver_id,
      AVG((jsonb_array_elements(g.items)->>'stars')::INTEGER) as avg_stars
    FROM grids g
    WHERE jsonb_array_length(g.items) > 0
    AND jsonb_array_elements(g.items)->>'stars' IS NOT NULL
    GROUP BY (jsonb_array_elements(g.items)->>'driver_id')::UUID
  ) star_ratings ON d.id = star_ratings.driver_id
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$;

-- Create function to get driver fan growth (last 7 days vs previous 7 days)
CREATE OR REPLACE FUNCTION get_driver_fan_growth(driver_uuid UUID)
RETURNS TABLE (
  recent_fans BIGINT,
  previous_fans BIGINT,
  growth_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_count BIGINT;
  previous_count BIGINT;
  growth NUMERIC;
BEGIN
  -- Count fans added in last 7 days
  SELECT COUNT(*) INTO recent_count
  FROM profiles 
  WHERE favorite_driver_id = driver_uuid
  AND updated_at >= NOW() - INTERVAL '7 days';
  
  -- Count fans added in previous 7 days (8-14 days ago)
  SELECT COUNT(*) INTO previous_count
  FROM profiles 
  WHERE favorite_driver_id = driver_uuid
  AND updated_at >= NOW() - INTERVAL '14 days'
  AND updated_at < NOW() - INTERVAL '7 days';
  
  -- Calculate growth percentage
  IF previous_count > 0 THEN
    growth := ((recent_count::NUMERIC - previous_count::NUMERIC) / previous_count::NUMERIC) * 100;
  ELSE
    growth := CASE WHEN recent_count > 0 THEN 100 ELSE 0 END;
  END IF;
  
  RETURN QUERY SELECT recent_count, previous_count, growth;
END;
$$;