-- Create like tables for team, team principal, and track comments
CREATE TABLE public.team_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

CREATE TABLE public.team_principal_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

CREATE TABLE public.track_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Create reply tables for team, team principal, and track comments
CREATE TABLE public.team_comment_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  parent_comment_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.team_principal_comment_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  parent_comment_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.track_comment_replies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  parent_comment_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.team_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_principal_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_principal_comment_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comment_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for team comment likes
CREATE POLICY "Users can view all team comment likes" ON public.team_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own team comment likes" ON public.team_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own team comment likes" ON public.team_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for team principal comment likes
CREATE POLICY "Users can view all team principal comment likes" ON public.team_principal_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own team principal comment likes" ON public.team_principal_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own team principal comment likes" ON public.team_principal_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for track comment likes
CREATE POLICY "Users can view all track comment likes" ON public.track_comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can create their own track comment likes" ON public.track_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own track comment likes" ON public.track_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for team comment replies
CREATE POLICY "Users can view approved team comment replies" ON public.team_comment_replies FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own team comment replies" ON public.team_comment_replies FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Admins can view all team comment replies" ON public.team_comment_replies FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their own team comment replies" ON public.team_comment_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own team comment replies" ON public.team_comment_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can update all team comment replies" ON public.team_comment_replies FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for team principal comment replies
CREATE POLICY "Users can view approved team principal comment replies" ON public.team_principal_comment_replies FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own team principal comment replies" ON public.team_principal_comment_replies FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Admins can view all team principal comment replies" ON public.team_principal_comment_replies FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their own team principal comment replies" ON public.team_principal_comment_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own team principal comment replies" ON public.team_principal_comment_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can update all team principal comment replies" ON public.team_principal_comment_replies FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for track comment replies
CREATE POLICY "Users can view approved track comment replies" ON public.track_comment_replies FOR SELECT USING (status = 'approved');
CREATE POLICY "Users can view their own track comment replies" ON public.track_comment_replies FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Admins can view all track comment replies" ON public.track_comment_replies FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create their own track comment replies" ON public.track_comment_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own track comment replies" ON public.track_comment_replies FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can update all track comment replies" ON public.track_comment_replies FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create functions to get like counts
CREATE OR REPLACE FUNCTION public.get_team_comment_like_count(target_comment_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.team_comment_likes 
    WHERE comment_id = target_comment_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_team_principal_comment_like_count(target_comment_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.team_principal_comment_likes 
    WHERE comment_id = target_comment_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_track_comment_like_count(target_comment_id uuid)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.track_comment_likes 
    WHERE comment_id = target_comment_id
  );
END;
$function$;

-- Add triggers for updated_at columns
CREATE TRIGGER update_team_comment_replies_updated_at
  BEFORE UPDATE ON public.team_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_principal_comment_replies_updated_at
  BEFORE UPDATE ON public.team_principal_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_track_comment_replies_updated_at
  BEFORE UPDATE ON public.track_comment_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();