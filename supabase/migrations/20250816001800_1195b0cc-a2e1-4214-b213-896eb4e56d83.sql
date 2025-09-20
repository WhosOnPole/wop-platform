-- Add unique constraint to enforce one grid per user
ALTER TABLE public.grids ADD CONSTRAINT grids_user_id_unique UNIQUE (user_id);

-- For existing users with multiple grids, keep only the most recent one
DELETE FROM public.grids 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.grids 
  ORDER BY user_id, created_at DESC
);