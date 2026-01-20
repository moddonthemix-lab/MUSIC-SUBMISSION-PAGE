-- Add Now Playing functionality
-- Run this in your Supabase SQL Editor

-- Create a simple settings table for now playing
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  now_playing_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row
INSERT INTO settings (id, now_playing_id) VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Allow public read access to settings" ON settings
  FOR SELECT USING (true);

-- Allow anyone to update (can restrict to admin later)
CREATE POLICY "Allow update settings" ON settings
  FOR UPDATE USING (true);

-- Enable realtime for submissions table
ALTER PUBLICATION supabase_realtime ADD TABLE submissions;
