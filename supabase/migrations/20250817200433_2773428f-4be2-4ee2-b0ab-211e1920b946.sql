-- Fix type mismatch in get_qualifying_entities function by casting bigint to numeric
CREATE OR REPLACE FUNCTION public.get_qualifying_entities(limit_count integer DEFAULT 10)
 RETURNS TABLE(id uuid, name text, entity_type text, country text, image_url text, additional_info text, fan_count bigint, comment_count bigint, grid_count bigint, trending_score numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  -- Trending Drivers
  SELECT 
    d.id,
    d.name,
    'driver'::text as entity_type,
    d.country,
    d.headshot_url as image_url,
    COALESCE(t.name, 'Independent') as additional_info,
    COALESCE(fan_counts.fan_count, 0) as fan_count,
    COALESCE(comment_counts.comment_count, 0) as comment_count,
    COALESCE(grid_counts.grid_count, 0) as grid_count,
    -- Calculate trending score: recent activity (comments + grids) + fans + grid appearances
    (COALESCE(comment_counts.comment_count, 0) * 3 + 
     COALESCE(grid_counts.grid_count, 0) * 2 + 
     COALESCE(fan_counts.fan_count, 0))::numeric as trending_score
  FROM public.drivers d
  LEFT JOIN public.teams t ON d.team_id = t.id
  LEFT JOIN (
    -- Fan counts for drivers
    SELECT 
      favorite_driver_id as driver_id,
      COUNT(*) as fan_count
    FROM public.profiles 
    WHERE favorite_driver_id IS NOT NULL
    GROUP BY favorite_driver_id
  ) fan_counts ON d.id = fan_counts.driver_id
  LEFT JOIN (
    -- Recent comment counts for drivers (last 30 days)
    SELECT 
      driver_id,
      COUNT(*) as comment_count
    FROM public.driver_comments 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    AND status = 'approved'
    GROUP BY driver_id
  ) comment_counts ON d.id = comment_counts.driver_id
  LEFT JOIN (
    -- Grid appearances for drivers (last 30 days)
    SELECT 
      driver_id,
      COUNT(*) as grid_count
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
  ) grid_counts ON d.id = grid_counts.driver_id

  UNION ALL

  -- Trending Teams
  SELECT 
    tm.id,
    tm.name,
    'team'::text as entity_type,
    tm.country,
    tm.logo_url as image_url,
    CASE 
      WHEN tm.championship_standing IS NOT NULL 
      THEN 'P' || tm.championship_standing::text
      ELSE ''
    END as additional_info,
    COALESCE(team_fan_counts.fan_count, 0) as fan_count,
    COALESCE(team_comment_counts.comment_count, 0) as comment_count,
    COALESCE(team_grid_counts.grid_count, 0) as grid_count,
    (COALESCE(team_comment_counts.comment_count, 0) * 3 + 
     COALESCE(team_grid_counts.grid_count, 0) * 2 + 
     COALESCE(team_fan_counts.fan_count, 0))::numeric as trending_score
  FROM public.teams tm
  LEFT JOIN (
    -- Fan counts for teams
    SELECT 
      favorite_team_id as team_id,
      COUNT(*) as fan_count
    FROM public.profiles 
    WHERE favorite_team_id IS NOT NULL
    GROUP BY favorite_team_id
  ) team_fan_counts ON tm.id = team_fan_counts.team_id
  LEFT JOIN (
    -- Recent comment counts for teams
    SELECT 
      team_id,
      COUNT(*) as comment_count
    FROM public.team_comments 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    AND status = 'approved'
    GROUP BY team_id
  ) team_comment_counts ON tm.id = team_comment_counts.team_id
  LEFT JOIN (
    -- Grid inclusions via drivers
    SELECT 
      d.team_id,
      COUNT(*) as grid_count
    FROM public.drivers d
    INNER JOIN (
      SELECT DISTINCT
        (item_data->>'driver_id')::UUID as driver_id
      FROM public.grids g
      CROSS JOIN LATERAL jsonb_array_elements(g.items) AS item_data
      WHERE g.created_at >= NOW() - INTERVAL '30 days'
      AND jsonb_array_length(g.items) > 0
      AND item_data->>'driver_id' IS NOT NULL
    ) recent_grids ON d.id = recent_grids.driver_id
    WHERE d.team_id IS NOT NULL
    GROUP BY d.team_id
  ) team_grid_counts ON tm.id = team_grid_counts.team_id

  UNION ALL

  -- Trending Tracks
  SELECT 
    tr.id,
    tr.name,
    'track'::text as entity_type,
    tr.country,
    tr.image_url,
    CASE 
      WHEN tr.length_km IS NOT NULL 
      THEN tr.length_km || ' km'
      ELSE ''
    END as additional_info,
    COALESCE(track_fan_counts.fan_count, 0) as fan_count,
    COALESCE(track_comment_counts.comment_count, 0) as comment_count,
    0 as grid_count, -- Tracks don't appear in grids directly
    (COALESCE(track_comment_counts.comment_count, 0) * 3 + 
     COALESCE(track_fan_counts.fan_count, 0))::numeric as trending_score
  FROM public.tracks tr
  LEFT JOIN (
    -- Fan counts for tracks (from favorite_track_ids JSONB array)
    SELECT 
      track_id,
      COUNT(*) as fan_count
    FROM (
      SELECT jsonb_array_elements_text(favorite_track_ids)::UUID as track_id
      FROM public.profiles 
      WHERE favorite_track_ids IS NOT NULL 
      AND jsonb_array_length(favorite_track_ids) > 0
    ) track_favorites
    GROUP BY track_id
  ) track_fan_counts ON tr.id = track_fan_counts.track_id
  LEFT JOIN (
    -- Recent comment counts for tracks
    SELECT 
      track_id,
      COUNT(*) as comment_count
    FROM public.track_comments 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    AND status = 'approved'
    GROUP BY track_id
  ) track_comment_counts ON tr.id = track_comment_comments.track_id

  UNION ALL

  -- Trending Team Principals
  SELECT 
    tp.id,
    tp.name,
    'team_principal'::text as entity_type,
    tp.country,
    tp.photo_url as image_url,
    COALESCE(tpt.name, '') as additional_info,
    0 as fan_count, -- Team principals don't have direct fans
    COALESCE(tp_comment_counts.comment_count, 0) as comment_count,
    0 as grid_count, -- Team principals don't appear in grids
    (COALESCE(tp_comment_counts.comment_count, 0) * 3)::numeric as trending_score
  FROM public.team_principals tp
  LEFT JOIN public.teams tpt ON tp.team_id = tpt.id
  LEFT JOIN (
    -- Recent comment counts for team principals
    SELECT 
      team_principal_id,
      COUNT(*) as comment_count
    FROM public.team_principal_comments 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    AND status = 'approved'
    GROUP BY team_principal_id
  ) tp_comment_counts ON tp.id = tp_comment_counts.team_principal_id

  ORDER BY trending_score DESC, name ASC
  LIMIT limit_count;
END;
$function$