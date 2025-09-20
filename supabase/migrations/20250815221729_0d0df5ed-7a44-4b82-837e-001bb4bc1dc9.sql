-- Create fan_posts table
CREATE TABLE public.fan_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fan_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for fan_posts
CREATE POLICY "Users can view approved posts" 
ON public.fan_posts 
FOR SELECT 
USING (status = 'approved');

CREATE POLICY "Users can view their own posts" 
ON public.fan_posts 
FOR SELECT 
USING (auth.uid() = author_id);

CREATE POLICY "Users can create their own posts" 
ON public.fan_posts 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts" 
ON public.fan_posts 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Admins can view all posts" 
ON public.fan_posts 
FOR SELECT 
USING (auth.email() = ANY (ARRAY['admin@whosonfan.com'::text, 'motorsport@admin.com'::text]));

CREATE POLICY "Admins can update all posts" 
ON public.fan_posts 
FOR UPDATE 
USING (auth.email() = ANY (ARRAY['admin@whosonfan.com'::text, 'motorsport@admin.com'::text]));

-- Create storage bucket for fan posts
INSERT INTO storage.buckets (id, name, public) VALUES ('fan_posts', 'fan_posts', true);

-- Create storage policies for fan posts
CREATE POLICY "Fan post images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fan_posts');

CREATE POLICY "Users can upload their own fan post images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'fan_posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own fan post images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'fan_posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own fan post images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'fan_posts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fan_posts_updated_at
BEFORE UPDATE ON public.fan_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();