-- Add is_hidden_from_profile column to all comment tables
ALTER TABLE public.driver_comments 
ADD COLUMN is_hidden_from_profile boolean DEFAULT false;

ALTER TABLE public.team_comments 
ADD COLUMN is_hidden_from_profile boolean DEFAULT false;

ALTER TABLE public.track_comments 
ADD COLUMN is_hidden_from_profile boolean DEFAULT false;

ALTER TABLE public.team_principal_comments 
ADD COLUMN is_hidden_from_profile boolean DEFAULT false;