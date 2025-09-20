-- Create enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable Row-Level Security on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Give admin role to the specified user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('ebe1610f-1ac0-4b73-8575-6f2266e5a604', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Update existing RLS policies to use the new role system

-- Update drivers policies
DROP POLICY "Only admins can modify drivers" ON public.drivers;
CREATE POLICY "Only admins can modify drivers" 
ON public.drivers 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update teams policies  
DROP POLICY "Only admins can modify teams" ON public.teams;
CREATE POLICY "Only admins can modify teams" 
ON public.teams 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update tracks policies
DROP POLICY "Only admins can modify tracks" ON public.tracks;
CREATE POLICY "Only admins can modify tracks" 
ON public.tracks 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update polls policies
DROP POLICY "Only admins can modify polls" ON public.polls;
CREATE POLICY "Only admins can modify polls" 
ON public.polls 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update poll_options policies
DROP POLICY "Only admins can modify poll options" ON public.poll_options;
CREATE POLICY "Only admins can modify poll options" 
ON public.poll_options 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Update fan_posts admin policies
DROP POLICY "Admins can view all posts" ON public.fan_posts;
DROP POLICY "Admins can update all posts" ON public.fan_posts;

CREATE POLICY "Admins can view all posts" 
ON public.fan_posts 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all posts" 
ON public.fan_posts 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'));