-- Add admin policies for admin-only tables
-- These policies allow users with admin role or @whosonpole.org email to perform admin operations

-- Polls policies
DROP POLICY IF EXISTS "Admins can insert polls" ON polls;
CREATE POLICY "Admins can insert polls"
  ON polls FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update polls" ON polls;
CREATE POLICY "Admins can update polls"
  ON polls FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can delete polls" ON polls;
CREATE POLICY "Admins can delete polls"
  ON polls FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- News stories policies
DROP POLICY IF EXISTS "Admins can insert news stories" ON news_stories;
CREATE POLICY "Admins can insert news stories"
  ON news_stories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update news stories" ON news_stories;
CREATE POLICY "Admins can update news stories"
  ON news_stories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can delete news stories" ON news_stories;
CREATE POLICY "Admins can delete news stories"
  ON news_stories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Articles policies
DROP POLICY IF EXISTS "Admins can insert articles" ON articles;
CREATE POLICY "Admins can insert articles"
  ON articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update articles" ON articles;
CREATE POLICY "Admins can update articles"
  ON articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can delete articles" ON articles;
CREATE POLICY "Admins can delete articles"
  ON articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Hot takes policies
DROP POLICY IF EXISTS "Admins can insert hot takes" ON hot_takes;
CREATE POLICY "Admins can insert hot takes"
  ON hot_takes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update hot takes" ON hot_takes;
CREATE POLICY "Admins can update hot takes"
  ON hot_takes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can delete hot takes" ON hot_takes;
CREATE POLICY "Admins can delete hot takes"
  ON hot_takes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Sponsors policies
DROP POLICY IF EXISTS "Admins can insert sponsors" ON sponsors;
CREATE POLICY "Admins can insert sponsors"
  ON sponsors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update sponsors" ON sponsors;
CREATE POLICY "Admins can update sponsors"
  ON sponsors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can delete sponsors" ON sponsors;
CREATE POLICY "Admins can delete sponsors"
  ON sponsors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Weekly highlights policies
DROP POLICY IF EXISTS "Admins can insert weekly highlights" ON weekly_highlights;
CREATE POLICY "Admins can insert weekly highlights"
  ON weekly_highlights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update weekly highlights" ON weekly_highlights;
CREATE POLICY "Admins can update weekly highlights"
  ON weekly_highlights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can delete weekly highlights" ON weekly_highlights;
CREATE POLICY "Admins can delete weekly highlights"
  ON weekly_highlights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Drivers policies (for data enrichment)
DROP POLICY IF EXISTS "Admins can update drivers" ON drivers;
CREATE POLICY "Admins can update drivers"
  ON drivers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Teams policies (for data enrichment)
DROP POLICY IF EXISTS "Admins can update teams" ON teams;
CREATE POLICY "Admins can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Tracks policies (for data enrichment)
DROP POLICY IF EXISTS "Admins can update tracks" ON tracks;
CREATE POLICY "Admins can update tracks"
  ON tracks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Reports policies (for moderation)
DROP POLICY IF EXISTS "Admins can view reports" ON reports;
CREATE POLICY "Admins can view reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );

-- Track tips policies (for moderation)
DROP POLICY IF EXISTS "Admins can view all track tips" ON track_tips;
CREATE POLICY "Admins can view all track tips"
  ON track_tips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
    OR status = 'approved'
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Admins can update track tips" ON track_tips;
CREATE POLICY "Admins can update track tips"
  ON track_tips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.email LIKE '%@whosonpole.org')
    )
  );
