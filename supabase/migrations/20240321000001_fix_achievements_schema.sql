-- Drop existing tables if they exist
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS daily_checkins;

-- Create users table
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Create achievements table
CREATE TABLE achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('basic', 'uncommon', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL DEFAULT 0,
  requires_progress BOOLEAN DEFAULT FALSE,
  total_required INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  wallet_address TEXT REFERENCES users(wallet_address) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  progress INTEGER DEFAULT 0,
  PRIMARY KEY (wallet_address, achievement_id)
);

-- Create function to update user points when achievement is earned
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET total_points = total_points + (
    SELECT points FROM achievements WHERE id = NEW.achievement_id
  ),
  level = GREATEST(1, FLOOR((
    total_points + (SELECT points FROM achievements WHERE id = NEW.achievement_id)
  ) / 100))
  WHERE wallet_address = NEW.wallet_address;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update points on achievement earn
DROP TRIGGER IF EXISTS on_achievement_earned ON user_achievements;
CREATE TRIGGER on_achievement_earned
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Allow users to read their own data"
  ON users FOR SELECT
  USING (auth.uid()::text = wallet_address);

CREATE POLICY "Allow users to update their own data"
  ON users FOR UPDATE
  USING (auth.uid()::text = wallet_address);

CREATE POLICY "Allow users to read their own achievements"
  ON user_achievements FOR SELECT
  USING (wallet_address = auth.uid()::text);

CREATE POLICY "Allow users to insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (wallet_address = auth.uid()::text);

-- Grant necessary permissions
GRANT SELECT ON achievements TO anon, authenticated;
GRANT SELECT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT ON user_achievements TO authenticated;

-- Create daily_checkins table
CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT REFERENCES users(wallet_address) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_count INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE (wallet_address, check_date)
);

-- Enable Row Level Security
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own check-ins
CREATE POLICY "Allow users to read their own check-ins"
  ON daily_checkins FOR SELECT
  USING (wallet_address = auth.uid()::text);

-- Allow users to insert their own check-ins
CREATE POLICY "Allow users to insert their own check-ins"
  ON daily_checkins FOR INSERT
  WITH CHECK (wallet_address = auth.uid()::text);

-- Grant necessary permissions
GRANT SELECT, INSERT ON daily_checkins TO authenticated;

-- Create function to increment user points
CREATE OR REPLACE FUNCTION increment_user_points(user_wallet TEXT, points_to_add INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET total_points = total_points + points_to_add
  WHERE wallet_address = user_wallet;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user level
CREATE OR REPLACE FUNCTION update_user_level(user_wallet TEXT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET level = GREATEST(1, FLOOR(total_points / 100))
  WHERE wallet_address = user_wallet;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_user_points(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_level(TEXT) TO authenticated; 