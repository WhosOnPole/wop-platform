-- Update profiles table to use foreign keys for teams and drivers
ALTER TABLE public.profiles 
ADD COLUMN favorite_team_id UUID REFERENCES public.teams(id),
ADD COLUMN favorite_driver_id UUID REFERENCES public.drivers(id);

-- Create index for better performance
CREATE INDEX idx_profiles_favorite_team_id ON public.profiles(favorite_team_id);
CREATE INDEX idx_profiles_favorite_driver_id ON public.profiles(favorite_driver_id);

-- Add a column to track if profile setup is complete
ALTER TABLE public.profiles 
ADD COLUMN setup_completed BOOLEAN DEFAULT FALSE;