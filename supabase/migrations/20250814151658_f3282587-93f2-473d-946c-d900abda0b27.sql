-- Create grids table for user driver rankings
CREATE TABLE public.grids (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.grids ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own grids" 
ON public.grids 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grids" 
ON public.grids 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grids" 
ON public.grids 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grids" 
ON public.grids 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_grids_updated_at
BEFORE UPDATE ON public.grids
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();