-- Add favorite_track_ids to profiles table
ALTER TABLE public.profiles 
ADD COLUMN favorite_track_ids JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries on favorite_track_ids
CREATE INDEX idx_profiles_favorite_track_ids ON public.profiles USING GIN (favorite_track_ids);

-- Add check constraint to limit to 5 tracks maximum
ALTER TABLE public.profiles 
ADD CONSTRAINT check_max_favorite_tracks 
CHECK (jsonb_array_length(favorite_track_ids) <= 5);