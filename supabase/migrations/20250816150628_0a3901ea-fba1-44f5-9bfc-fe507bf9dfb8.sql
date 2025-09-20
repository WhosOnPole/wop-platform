-- Create junction table for driver mentions in fan posts
CREATE TABLE public.fan_post_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_post_id UUID NOT NULL REFERENCES public.fan_posts(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ensure unique combinations
ALTER TABLE public.fan_post_drivers 
ADD CONSTRAINT unique_post_driver UNIQUE (fan_post_id, driver_id);

-- Enable RLS
ALTER TABLE public.fan_post_drivers ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Driver post associations are viewable by everyone" 
ON public.fan_post_drivers 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage driver post associations" 
ON public.fan_post_drivers 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));