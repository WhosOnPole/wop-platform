-- Create team_comments table
CREATE TABLE public.team_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_principal_comments table
CREATE TABLE public.team_principal_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_principal_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create track_comments table
CREATE TABLE public.track_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.team_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_principal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_comments
CREATE POLICY "Users can view approved team comments" 
ON public.team_comments 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own team comments" 
ON public.team_comments 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own team comments" 
ON public.team_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own pending team comments" 
ON public.team_comments 
FOR UPDATE 
USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins can view all team comments" 
ON public.team_comments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all team comments" 
ON public.team_comments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for team_principal_comments
CREATE POLICY "Users can view approved team principal comments" 
ON public.team_principal_comments 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own team principal comments" 
ON public.team_principal_comments 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own team principal comments" 
ON public.team_principal_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own pending team principal comments" 
ON public.team_principal_comments 
FOR UPDATE 
USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins can view all team principal comments" 
ON public.team_principal_comments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all team principal comments" 
ON public.team_principal_comments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for track_comments
CREATE POLICY "Users can view approved track comments" 
ON public.track_comments 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own track comments" 
ON public.track_comments 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own track comments" 
ON public.track_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own pending track comments" 
ON public.track_comments 
FOR UPDATE 
USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins can view all track comments" 
ON public.track_comments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all track comments" 
ON public.track_comments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_team_comments_updated_at
BEFORE UPDATE ON public.team_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_principal_comments_updated_at
BEFORE UPDATE ON public.team_principal_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_track_comments_updated_at
BEFORE UPDATE ON public.track_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();