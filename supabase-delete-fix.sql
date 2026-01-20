-- Fix: Add missing DELETE policy for affiliate_codes table
-- Run this in your Supabase SQL Editor

CREATE POLICY "Allow delete affiliate codes" ON affiliate_codes
  FOR DELETE USING (true);
