-- Fix the get_trending_drivers function to use LATERAL joins for JSONB array expansion
DROP FUNCTION IF EXISTS get_trending_drivers(INTEGER);

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
SET search_path = 'public'
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
  FROM public.drivers d
  LEFT JOIN public.teams t ON d.team_id = t.id
  LEFT JOIN (
    -- Subquery for fan counts
    SELECT 
      favorite_driver_id as driver_id,
      COUNT(*) as fan_count
    FROM public.profiles 
    WHERE favorite_driver_id IS NOT NULL
    GROUP BY favorite_driver_id
  ) fan_counts ON d.id = fan_counts.driver_id
  LEFT JOIN (
    -- Subquery for recent grid activity using LATERAL join
    SELECT 
      driver_id,
      COUNT(*) as recent_grids
    FROM (
      SELECT DISTINCT
        g.id as grid_id,
        (item_data->>'driver_id')::UUID as driver_id
      FROM public.grids g
      CROSS JOIN LATERAL jsonb_array_elements(g.items) AS item_data
      WHERE g.created_at >= NOW() - INTERVAL '30 days'
      AND jsonb_array_length(g.items) > 0
      AND item_data->>'driver_id' IS NOT NULL
    ) recent_grids_expanded
    GROUP BY driver_id
  ) recent_activity ON d.id = recent_activity.driver_id
  LEFT JOIN (
    -- Subquery for star ratings using LATERAL join
    SELECT 
      driver_id,
      AVG(stars) as avg_stars
    FROM (
      SELECT 
        (item_data->>'driver_id')::UUID as driver_id,
        (item_data->>'stars')::INTEGER as stars
      FROM public.grids g
      CROSS JOIN LATERAL jsonb_array_elements(g.items) AS item_data
      WHERE jsonb_array_length(g.items) > 0
      AND item_data->>'stars' IS NOT NULL
      AND item_data->>'driver_id' IS NOT NULL
    ) star_ratings_expanded
    GROUP BY driver_id
  ) star_ratings ON d.id = star_ratings.driver_id
  ORDER BY trending_score DESC
  LIMIT limit_count;
END;
$$;