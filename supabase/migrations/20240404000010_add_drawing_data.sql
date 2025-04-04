-- Create drawing_data table
CREATE TABLE IF NOT EXISTS drawing_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  points JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create index for faster room lookups
CREATE INDEX IF NOT EXISTS idx_drawing_data_room_name ON drawing_data(room_name);

-- Enable Row Level Security
ALTER TABLE drawing_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON drawing_data
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert"
  ON drawing_data
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to clean old drawing data
CREATE OR REPLACE FUNCTION clean_old_drawing_data()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM drawing_data
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$; 