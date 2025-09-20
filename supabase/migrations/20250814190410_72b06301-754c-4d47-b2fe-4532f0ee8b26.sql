-- Fix the handle_new_user function to not use email as fallback for display_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    NEW.raw_user_meta_data->>'display_name'  -- Remove email fallback
  );
  RETURN NEW;
END;
$function$;

-- Clean up existing profiles that have email addresses as display names
UPDATE profiles 
SET display_name = NULL 
WHERE display_name LIKE '%@%' AND display_name ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';