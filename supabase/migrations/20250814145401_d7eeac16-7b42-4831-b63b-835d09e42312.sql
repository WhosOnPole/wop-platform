-- Create teams table first (referenced by drivers)
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id),
  number INTEGER,
  headshot_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tracks table
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  length_km NUMERIC,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Teams are viewable by everyone" 
ON public.teams 
FOR SELECT 
USING (true);

CREATE POLICY "Drivers are viewable by everyone" 
ON public.drivers 
FOR SELECT 
USING (true);

CREATE POLICY "Tracks are viewable by everyone" 
ON public.tracks 
FOR SELECT 
USING (true);

-- Create admin-only policies for modifications
CREATE POLICY "Only admins can modify teams" 
ON public.teams 
FOR ALL 
USING (auth.email() IN ('admin@whosonfan.com', 'motorsport@admin.com'))
WITH CHECK (auth.email() IN ('admin@whosonfan.com', 'motorsport@admin.com'));

CREATE POLICY "Only admins can modify drivers" 
ON public.drivers 
FOR ALL 
USING (auth.email() IN ('admin@whosonfan.com', 'motorsport@admin.com'))
WITH CHECK (auth.email() IN ('admin@whosonfan.com', 'motorsport@admin.com'));

CREATE POLICY "Only admins can modify tracks" 
ON public.tracks 
FOR ALL 
USING (auth.email() IN ('admin@whosonfan.com', 'motorsport@admin.com'))
WITH CHECK (auth.email() IN ('admin@whosonfan.com', 'motorsport@admin.com'));

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at
BEFORE UPDATE ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();