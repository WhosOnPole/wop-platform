-- Add foreign key constraints for proper relations
ALTER TABLE public.team_comments 
ADD CONSTRAINT team_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.team_principal_comments 
ADD CONSTRAINT team_principal_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

ALTER TABLE public.track_comments 
ADD CONSTRAINT track_comments_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;