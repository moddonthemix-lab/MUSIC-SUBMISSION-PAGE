-- Add Home Studio Toggle functionality
-- Run this in your Supabase SQL Editor

-- Add home_studio_enabled column to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS home_studio_enabled BOOLEAN DEFAULT false;

-- Update the initial row to have home_studio_enabled set to false (Coming Soon mode)
UPDATE settings
SET home_studio_enabled = false
WHERE id = 1;
