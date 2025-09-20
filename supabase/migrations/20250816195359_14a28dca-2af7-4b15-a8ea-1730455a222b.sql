-- Create team_principals table
CREATE TABLE public.team_principals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  photo_url TEXT,
  bio TEXT,
  years_with_team INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  search_vector TSVECTOR
);

-- Enable Row Level Security
ALTER TABLE public.team_principals ENABLE ROW LEVEL SECURITY;

-- Create policies for team principals
CREATE POLICY "Team principals are viewable by everyone" 
ON public.team_principals 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify team principals" 
ON public.team_principals 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_team_principals_updated_at
BEFORE UPDATE ON public.team_principals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_team_principals_search ON public.team_principals USING GIN(search_vector);
CREATE INDEX idx_team_principals_team_id ON public.team_principals(team_id);
CREATE INDEX idx_team_principals_country ON public.team_principals(country);

-- Update search vectors for team principals
CREATE OR REPLACE FUNCTION update_team_principals_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.bio, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_principals_search_vector_trigger
BEFORE INSERT OR UPDATE ON public.team_principals
FOR EACH ROW
EXECUTE FUNCTION update_team_principals_search_vector();