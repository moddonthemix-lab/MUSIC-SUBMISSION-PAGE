-- Add affiliate codes table
CREATE TABLE IF NOT EXISTS affiliate_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  affiliate_name TEXT NOT NULL,
  affiliate_email TEXT,
  discount_percentage INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add affiliate_code column to submissions table
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS original_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS final_price NUMERIC(10,2) DEFAULT 0;

-- Enable RLS on affiliate_codes
ALTER TABLE affiliate_codes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to active codes
CREATE POLICY "Allow public read access to active codes" ON affiliate_codes
  FOR SELECT USING (is_active = true);

-- Allow admin to manage codes (you can restrict this later)
CREATE POLICY "Allow insert affiliate codes" ON affiliate_codes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update affiliate codes" ON affiliate_codes
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete affiliate codes" ON affiliate_codes
  FOR DELETE USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_codes_code ON affiliate_codes(code);
CREATE INDEX IF NOT EXISTS idx_submissions_affiliate_code ON submissions(affiliate_code);

-- Insert some example affiliate codes (you can modify these)
INSERT INTO affiliate_codes (code, affiliate_name, discount_percentage)
VALUES
  ('PRODUCER15', 'Sample Affiliate', 15),
  ('NEWARTIST10', 'Another Affiliate', 10)
ON CONFLICT (code) DO NOTHING;
