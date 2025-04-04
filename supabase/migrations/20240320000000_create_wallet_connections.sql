-- Create wallet_connections table
CREATE TABLE IF NOT EXISTS wallet_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  last_connected TIMESTAMP WITH TIME ZONE NOT NULL,
  last_disconnected TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wallet_connections_address ON wallet_connections(wallet_address);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_wallet_connections_updated_at
  BEFORE UPDATE ON wallet_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE wallet_connections ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own wallet connections
CREATE POLICY "Users can read their own wallet connections"
  ON wallet_connections FOR SELECT
  USING (wallet_address = current_user);

-- Allow users to insert their own wallet connections
CREATE POLICY "Users can insert their own wallet connections"
  ON wallet_connections FOR INSERT
  WITH CHECK (wallet_address = current_user);

-- Allow users to update their own wallet connections
CREATE POLICY "Users can update their own wallet connections"
  ON wallet_connections FOR UPDATE
  USING (wallet_address = current_user)
  WITH CHECK (wallet_address = current_user); 