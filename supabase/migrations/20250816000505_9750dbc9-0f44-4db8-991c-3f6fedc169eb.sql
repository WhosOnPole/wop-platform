-- Update the search_all function to use prefix matching and fallback fuzzy search
CREATE OR REPLACE FUNCTION public.search_all(search_query text)
 RETURNS TABLE(id uuid, name text, type text, country text, additional_info text, rank real)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  tsquery_text text;
  words text[];
  word text;
BEGIN
  -- Clean and prepare the search query
  search_query := trim(lower(search_query));
  
  -- Split into words and create prefix matching tsquery
  words := string_to_array(search_query, ' ');
  tsquery_text := '';
  
  FOREACH word IN ARRAY words
  LOOP
    IF word != '' THEN
      IF tsquery_text != '' THEN
        tsquery_text := tsquery_text || ' & ';
      END IF;
      -- Add prefix matching with :*
      tsquery_text := tsquery_text || word || ':*';
    END IF;
  END LOOP;
  
  -- If no valid tsquery could be built, use the original query for ILIKE fallback
  IF tsquery_text = '' THEN
    tsquery_text := search_query;
  END IF;

  RETURN QUERY
  -- First, try full-text search with prefix matching
  SELECT 
    d.id,
    d.name,
    'driver'::text as type,
    d.country,
    COALESCE(t.name, 'Independent') as additional_info,
    ts_rank(d.search_vector, to_tsquery('english', tsquery_text)) as rank
  FROM public.drivers d
  LEFT JOIN public.teams t ON d.team_id = t.id
  WHERE d.search_vector @@ to_tsquery('english', tsquery_text)
  
  UNION ALL
  
  SELECT 
    t.id,
    t.name,
    'team'::text as type,
    t.country,
    ''::text as additional_info,
    ts_rank(t.search_vector, to_tsquery('english', tsquery_text)) as rank
  FROM public.teams t
  WHERE t.search_vector @@ to_tsquery('english', tsquery_text)
  
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
    ts_rank(tr.search_vector, to_tsquery('english', tsquery_text)) as rank
  FROM public.tracks tr
  WHERE tr.search_vector @@ to_tsquery('english', tsquery_text)
  
  UNION ALL
  
  -- Fallback fuzzy search with ILIKE for partial matches
  SELECT 
    d.id,
    d.name,
    'driver'::text as type,
    d.country,
    COALESCE(t.name, 'Independent') as additional_info,
    0.1 as rank  -- Lower rank for fuzzy matches
  FROM public.drivers d
  LEFT JOIN public.teams t ON d.team_id = t.id
  WHERE lower(d.name) ILIKE '%' || search_query || '%'
  AND NOT d.search_vector @@ to_tsquery('english', tsquery_text)
  
  UNION ALL
  
  SELECT 
    t.id,
    t.name,
    'team'::text as type,
    t.country,
    ''::text as additional_info,
    0.1 as rank
  FROM public.teams t
  WHERE lower(t.name) ILIKE '%' || search_query || '%'
  AND NOT t.search_vector @@ to_tsquery('english', tsquery_text)
  
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
    0.1 as rank
  FROM public.tracks tr
  WHERE lower(tr.name) ILIKE '%' || search_query || '%'
  AND NOT tr.search_vector @@ to_tsquery('english', tsquery_text)
  
  ORDER BY rank DESC, name ASC
  LIMIT 20;
END;
$function$