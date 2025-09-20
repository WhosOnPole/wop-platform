-- Enable Row Level Security
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE grid_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlight_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Entities policies
CREATE POLICY "Entities are viewable by everyone" ON entities
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert entities" ON entities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Only admins can update entities" ON entities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Users public policies
CREATE POLICY "Users public are viewable by everyone" ON users_public
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON users_public
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON users_public
  FOR UPDATE USING (auth.uid() = user_id);

-- Follows policies
CREATE POLICY "Users can view all follows" ON follows
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own follows" ON follows
  FOR ALL USING (auth.uid() = user_id);

-- Grid items policies
CREATE POLICY "Users can view all grid items" ON grid_items
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own grid items" ON grid_items
  FOR ALL USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Votes are viewable by everyone" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own votes" ON votes
  FOR ALL USING (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Approved highlights are viewable by everyone" ON highlights
  FOR SELECT USING (approved = true);

CREATE POLICY "Users can view their own highlights" ON highlights
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert highlights" ON highlights
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" ON highlights
  FOR UPDATE USING (auth.uid() = user_id);

-- Highlight tags policies
CREATE POLICY "Highlight tags are viewable by everyone" ON highlight_tags
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage highlight tags" ON highlight_tags
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Polls policies
CREATE POLICY "Polls are viewable by everyone" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage polls" ON polls
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Poll options policies
CREATE POLICY "Poll options are viewable by everyone" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage poll options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Poll votes policies
CREATE POLICY "Poll votes are viewable by everyone" ON poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own poll votes" ON poll_votes
  FOR ALL USING (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Authenticated users can insert reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Only admins can update reports" ON reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Spotlights policies
CREATE POLICY "Spotlights are viewable by everyone" ON spotlights
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage spotlights" ON spotlights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Audit log policies
CREATE POLICY "Only admins can view audit log" ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "System can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (true);
