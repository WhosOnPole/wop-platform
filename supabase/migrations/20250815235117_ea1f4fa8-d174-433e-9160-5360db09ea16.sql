-- Add full-text search columns to drivers table
ALTER TABLE public.drivers 
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(country, '') || ' ' || coalesce(bio, ''))
) STORED;

-- Add full-text search columns to teams table  
ALTER TABLE public.teams
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(country, ''))
) STORED;

-- Add full-text search columns to tracks table
ALTER TABLE public.tracks
ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(country, '') || ' ' || coalesce(description, ''))
) STORED;

-- Create indexes for better search performance
CREATE INDEX idx_drivers_search ON public.drivers USING GIN(search_vector);
CREATE INDEX idx_teams_search ON public.teams USING GIN(search_vector);
CREATE INDEX idx_tracks_search ON public.tracks USING GIN(search_vector);

-- Create a unified search function
CREATE OR REPLACE FUNCTION public.search_all(search_query text)
RETURNS TABLE(
  id uuid,
  name text,
  type text,
  country text,
  additional_info text,
  rank real
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    'driver'::text as type,
    d.country,
    COALESCE(t.name, 'Independent') as additional_info,
    ts_rank(d.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.drivers d
  LEFT JOIN public.teams t ON d.team_id = t.id
  WHERE d.search_vector @@ plainto_tsquery('english', search_query)
  
  UNION ALL
  
  SELECT 
    t.id,
    t.name,
    'team'::text as type,
    t.country,
    ''::text as additional_info,
    ts_rank(t.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.teams t
  WHERE t.search_vector @@ plainto_tsquery('english', search_query)
  
  UNION ALL
  
  SELECT 
    tr.id,
    tr.name,
    'track'::text as type,
    tr.country,
    CASE 
      WHEN tr.length_km IS NOT NULL 
      THEN tr.length_km || ' km'
      ELSE ''
    END as additional_info,
    ts_rank(tr.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM public.tracks tr
  WHERE tr.search_vector @@ plainto_tsquery('english', search_query)
  
  ORDER BY rank DESC, name ASC;
END;
$$;