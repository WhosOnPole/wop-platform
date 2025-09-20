-- Fix grid visibility issue: Allow public viewing of grids while maintaining security for modifications

-- Drop the restrictive SELECT policy that only allows users to view their own grids
DROP POLICY IF EXISTS "Users can view their own grids" ON grids;

-- Create a new policy that allows everyone to view grids (making them publicly readable)
CREATE POLICY "Grids are publicly viewable" ON grids
  FOR SELECT USING (true);