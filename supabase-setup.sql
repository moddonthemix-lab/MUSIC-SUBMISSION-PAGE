-- Music Submission Platform Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  track_title TEXT NOT NULL,
  social_handle TEXT,
  priority TEXT NOT NULL DEFAULT 'free',
  mix_notes TEXT,
  mix_option TEXT,
  file_link TEXT,
  submission_type TEXT NOT NULL,
  file_name TEXT,
  file_data TEXT,
  file_type TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create queue_order table for drag-and-drop queue management
CREATE TABLE IF NOT EXISTS queue_order (
  id SERIAL PRIMARY KEY,
  submission_ids TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial queue order row
INSERT INTO queue_order (submission_ids) VALUES ('{}');

-- Enable Row Level Security (RLS)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_order ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read/write access
-- (You can restrict this later if needed)
CREATE POLICY "Allow public read access" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON submissions
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete access" ON submissions
  FOR DELETE USING (true);

CREATE POLICY "Allow public read access on queue_order" ON queue_order
  FOR SELECT USING (true);

CREATE POLICY "Allow public update access on queue_order" ON queue_order
  FOR UPDATE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_priority ON submissions(priority);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
