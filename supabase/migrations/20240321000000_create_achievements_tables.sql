-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_achievements table to track earned achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, achievement_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_wallet ON user_achievements(wallet_address);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_achievements_updated_at
  BEFORE UPDATE ON achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read achievements
CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  USING (true);

-- Allow users to read their own achievements
CREATE POLICY "Users can read their own achievements"
  ON user_achievements FOR SELECT
  USING (wallet_address = current_user);

-- Allow users to insert their own achievements
CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (wallet_address = current_user);

-- Seed initial achievements
INSERT INTO achievements (id, name, icon, description)
VALUES
  ('early-adopter', '🌟 Early Adopter', '🌟', 'Joined during beta'),
  ('diamond-hands', '💎 Diamond Hands', '💎', 'Held assets for 30 days'),
  ('moon-shot', '🚀 Moon Shot', '🚀', '10x return on investment'),
  ('wallet-connected', '🔗 Wallet Connected', '🔗', 'Connected a wallet to your account'),
  ('first-transaction', '💸 First Transaction', '💸', 'Made your first transaction'),
  ('blockchain-explorer', '🧭 Blockchain Explorer', '🧭', 'Explored both Ethereum and Solana chains')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  updated_at = NOW(); 