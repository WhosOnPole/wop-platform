-- ============================================
-- Who's on Pole? Platform - Initial Schema
-- ============================================
-- This migration creates all enum types, tables, indexes, RLS policies, and triggers
-- Run this in Supabase SQL Editor after creating your project

-- ============================================
-- 1. ENUM TYPES
-- ============================================

CREATE TYPE app_role AS ENUM ('user', 'admin');
CREATE TYPE grid_type AS ENUM ('driver', 'team', 'track');
CREATE TYPE parent_page_type AS ENUM ('driver', 'team', 'track', 'poll', 'hot_take', 'profile');
CREATE TYPE target_type AS ENUM ('post', 'grid', 'profile', 'comment');
CREATE TYPE report_status AS ENUM ('pending', 'resolved_removed', 'resolved_ignored');
CREATE TYPE tip_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE article_category AS ENUM ('FEATURE_FAN', 'FEATURE_WOMEN', 'FEATURE_INTERVIEW', 'BEGINNER_GUIDE');
CREATE TYPE article_status AS ENUM ('draft', 'published');

-- ============================================
-- 2. TABLES
-- ============================================

-- Profiles table (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  points INT NOT NULL DEFAULT 0,
  strikes INT NOT NULL DEFAULT 0,
  role app_role NOT NULL DEFAULT 'user',
  age INT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  social_links JSONB DEFAULT '{}'::jsonb,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_username UNIQUE (username)
);

-- Drivers table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  openf1_driver_number INT,
  image_url TEXT,
  team_icon_url TEXT,
  racing_number INT,
  age INT,
  nationality VARCHAR(100),
  podiums_total INT DEFAULT 0,
  current_standing INT,
  world_championships INT DEFAULT 0,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  overview_text TEXT,
  instagram_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tracks table
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  built_date DATE,
  track_length DECIMAL(10, 3),
  overview_text TEXT,
  history_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Track tips table
CREATE TABLE track_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  tip_content VARCHAR(2000) NOT NULL,
  status tip_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Grids table
CREATE TABLE grids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type grid_type NOT NULL,
  ranked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  comment VARCHAR(250),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  parent_page_type parent_page_type,
  parent_page_id UUID
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  content VARCHAR(5000) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Votes table
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type target_type NOT NULL,
  value INT NOT NULL DEFAULT 1 CHECK (value = 1),
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_vote UNIQUE (user_id, target_id, target_type)
);

-- Follows table
CREATE TABLE follows (
  id SERIAL PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Polls table
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_featured_podium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poll responses table
CREATE TABLE poll_responses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  selected_option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_poll_response UNIQUE (user_id, poll_id)
);

-- News stories table
CREATE TABLE news_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  image_url TEXT,
  content TEXT NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  category article_category NOT NULL,
  header_image_url TEXT,
  status article_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sponsors table
CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Weekly highlights table
CREATE TABLE weekly_highlights (
  id SERIAL PRIMARY KEY,
  week_start_date DATE NOT NULL UNIQUE,
  highlighted_fan_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  highlighted_sponsor_id UUID REFERENCES sponsors(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Race schedule table
CREATE TABLE race_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  race_time TIMESTAMPTZ,
  openf1_meeting_key INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Live chat messages table
CREATE TABLE live_chat_messages (
  id SERIAL PRIMARY KEY,
  race_id UUID NOT NULL REFERENCES race_schedule(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message VARCHAR(1000) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Race checkins table
CREATE TABLE race_checkins (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  race_id UUID NOT NULL REFERENCES race_schedule(id) ON DELETE CASCADE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_checkin UNIQUE (user_id, race_id)
);

-- Hot takes table
CREATE TABLE hot_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_text TEXT NOT NULL,
  featured_grid_id UUID REFERENCES grids(id) ON DELETE SET NULL,
  active_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reports table
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_id UUID NOT NULL,
  target_type target_type NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. INDEXES (for performance)
-- ============================================

-- Posts indexes
CREATE INDEX idx_posts_parent_page ON posts(parent_page_type, parent_page_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Comments indexes
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Live chat messages indexes
CREATE INDEX idx_live_chat_race_id ON live_chat_messages(race_id);
CREATE INDEX idx_live_chat_created_at ON live_chat_messages(created_at DESC);

-- Race checkins indexes
CREATE INDEX idx_race_checkins_race_id ON race_checkins(race_id);
CREATE INDEX idx_race_checkins_user_id ON race_checkins(user_id);

-- Votes indexes
CREATE INDEX idx_votes_target ON votes(target_id, target_type);
CREATE INDEX idx_votes_user_id ON votes(user_id);

-- Grids indexes
CREATE INDEX idx_grids_user_id ON grids(user_id);
CREATE INDEX idx_grids_type ON grids(type);
CREATE INDEX idx_grids_created_at ON grids(created_at DESC);

-- Track tips indexes
CREATE INDEX idx_track_tips_track_id ON track_tips(track_id);
CREATE INDEX idx_track_tips_status ON track_tips(status);
CREATE INDEX idx_track_tips_user_id ON track_tips(user_id);

-- Follows indexes
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_points ON profiles(points DESC);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Articles indexes
CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_status ON articles(status);

-- Polls indexes
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_featured ON polls(is_featured_podium) WHERE is_featured_podium = true;

-- News stories indexes
CREATE INDEX idx_news_stories_featured ON news_stories(is_featured) WHERE is_featured = true;
CREATE INDEX idx_news_stories_created_at ON news_stories(created_at DESC);

-- Race schedule indexes
CREATE INDEX idx_race_schedule_slug ON race_schedule(slug);
CREATE INDEX idx_race_schedule_race_time ON race_schedule(race_time);

-- Hot takes indexes
CREATE INDEX idx_hot_takes_active_date ON hot_takes(active_date);

-- Reports indexes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_target ON reports(target_id, target_type);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE grids ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE hot_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Drivers policies (admin-only write, public read)
CREATE POLICY "Anyone can view drivers"
  ON drivers FOR SELECT
  USING (true);

-- Teams policies (admin-only write, public read)
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  USING (true);

-- Tracks policies (admin-only write, public read)
CREATE POLICY "Anyone can view tracks"
  ON tracks FOR SELECT
  USING (true);

-- Track tips policies
CREATE POLICY "Anyone can view approved track tips"
  ON track_tips FOR SELECT
  USING (status = 'approved' OR auth.uid() = user_id);

CREATE POLICY "Authenticated users can create track tips"
  ON track_tips FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own track tips"
  ON track_tips FOR UPDATE
  USING (auth.uid() = user_id);

-- Grids policies
CREATE POLICY "Anyone can view grids"
  ON grids FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create grids"
  ON grids FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own grids"
  ON grids FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grids"
  ON grids FOR DELETE
  USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create votes"
  ON votes FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Anyone can view follows"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create follows"
  ON follows FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = follower_id);

CREATE POLICY "Users can delete their own follows"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Polls policies (admin-only write, public read)
CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  USING (true);

-- Poll responses policies
CREATE POLICY "Anyone can view poll responses"
  ON poll_responses FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create poll responses"
  ON poll_responses FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update their own poll responses"
  ON poll_responses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own poll responses"
  ON poll_responses FOR DELETE
  USING (auth.uid() = user_id);

-- News stories policies (admin-only write, public read)
CREATE POLICY "Anyone can view news stories"
  ON news_stories FOR SELECT
  USING (true);

-- Articles policies (admin-only write, public read)
CREATE POLICY "Anyone can view published articles"
  ON articles FOR SELECT
  USING (status = 'published' OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Sponsors policies (admin-only write, public read)
CREATE POLICY "Anyone can view sponsors"
  ON sponsors FOR SELECT
  USING (true);

-- Weekly highlights policies (admin-only write, public read)
CREATE POLICY "Anyone can view weekly highlights"
  ON weekly_highlights FOR SELECT
  USING (true);

-- Race schedule policies (admin-only write, public read)
CREATE POLICY "Anyone can view race schedule"
  ON race_schedule FOR SELECT
  USING (true);

-- Live chat messages policies
CREATE POLICY "Anyone can view live chat messages"
  ON live_chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create live chat messages"
  ON live_chat_messages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Race checkins policies
CREATE POLICY "Anyone can view race checkins"
  ON race_checkins FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create race checkins"
  ON race_checkins FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own race checkins"
  ON race_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- Hot takes policies (admin-only write, public read)
CREATE POLICY "Anyone can view hot takes"
  ON hot_takes FOR SELECT
  USING (true);

-- Reports policies (admin-only read, authenticated users can create)
CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = reporter_id);

-- ============================================
-- 5. AUTH TRIGGER (Auto-create profile)
-- ============================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. MANUAL STEP REQUIRED
-- ============================================
-- After running this migration, manually run:
-- ALTER TABLE auth.users ADD COLUMN banned_until TIMESTAMPTZ;
-- This column is required for the ban enforcement logic in middleware

