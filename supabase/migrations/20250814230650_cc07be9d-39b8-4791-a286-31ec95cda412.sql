-- Create polls tables with proper constraints and RLS policies

-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('single', 'bracket')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id) -- One vote per user per poll
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Polls are viewable by everyone" 
ON public.polls 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify polls" 
ON public.polls 
FOR ALL 
USING (auth.email() = ANY (ARRAY['admin@whosonfan.com'::text, 'motorsport@admin.com'::text]))
WITH CHECK (auth.email() = ANY (ARRAY['admin@whosonfan.com'::text, 'motorsport@admin.com'::text]));

-- RLS Policies for poll_options
CREATE POLICY "Poll options are viewable by everyone" 
ON public.poll_options 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can modify poll options" 
ON public.poll_options 
FOR ALL 
USING (auth.email() = ANY (ARRAY['admin@whosonfan.com'::text, 'motorsport@admin.com'::text]))
WITH CHECK (auth.email() = ANY (ARRAY['admin@whosonfan.com'::text, 'motorsport@admin.com'::text]));

-- RLS Policies for votes
CREATE POLICY "Users can view all votes" 
ON public.votes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own votes" 
ON public.votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.votes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" 
ON public.votes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add updated_at trigger for polls
CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for vote updates
ALTER TABLE public.votes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;

-- Create indexes for better performance
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);