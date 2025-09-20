-- Create driver_comments table
CREATE TABLE public.driver_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.driver_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for driver comments
CREATE POLICY "Users can view approved comments" 
ON public.driver_comments 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own comments" 
ON public.driver_comments 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own comments" 
ON public.driver_comments 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own pending comments" 
ON public.driver_comments 
FOR UPDATE 
USING (auth.uid() = author_id AND status = 'pending');

CREATE POLICY "Admins can view all comments" 
ON public.driver_comments 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all comments" 
ON public.driver_comments 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_driver_comments_updated_at
BEFORE UPDATE ON public.driver_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_driver_comments_driver_id ON public.driver_comments(driver_id);
CREATE INDEX idx_driver_comments_author_id ON public.driver_comments(author_id);
CREATE INDEX idx_driver_comments_status ON public.driver_comments(status);