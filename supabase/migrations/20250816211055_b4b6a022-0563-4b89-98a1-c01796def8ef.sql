-- Add new columns to teams table
ALTER TABLE public.teams 
ADD COLUMN bio TEXT,
ADD COLUMN championship_standing INTEGER;

-- Update the search vector trigger to include bio in search
CREATE OR REPLACE FUNCTION public.update_teams_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for teams search vector updates
DROP TRIGGER IF EXISTS update_teams_search_vector_trigger ON public.teams;
CREATE TRIGGER update_teams_search_vector_trigger
  BEFORE INSERT OR UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teams_search_vector();