-- Update grid items structure to replace stars with reasoning
-- This migration handles existing grids by removing stars and adding reasoning field
-- The stars field is removed from the JSONB structure

-- Note: This is a data structure migration that affects the JSONB items column
-- No table structure changes needed, just updating application logic