-- =============================================
-- USERS TABLE - Based on wallet addresses
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY users_select_policy ON public.users 
  FOR SELECT USING (auth.uid()::text = wallet_address);

-- Allow users to update their own data
CREATE POLICY users_update_policy ON public.users 
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- Allow users to insert their own data
CREATE POLICY users_insert_policy ON public.users 
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- =============================================
-- ACHIEVEMENTS DEFINITION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rank TEXT NOT NULL CHECK (rank IN ('basic', 'uncommon', 'rare', 'epic', 'legendary')),
  points INTEGER NOT NULL,
  requires_progress BOOLEAN DEFAULT FALSE,
  total_required INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read achievements
CREATE POLICY achievements_select_policy ON public.achievements FOR SELECT USING (true);

-- =============================================
-- USER ACHIEVEMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  progress INTEGER DEFAULT 0,
  UNIQUE (wallet_address, achievement_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own achievements
CREATE POLICY user_achievements_select_policy ON public.user_achievements 
  FOR SELECT USING (auth.uid()::text = wallet_address);

-- Allow upsert operation for users' own achievements
CREATE POLICY user_achievements_insert_policy ON public.user_achievements 
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- Allow updates to users' own achievements
CREATE POLICY user_achievements_update_policy ON public.user_achievements 
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- =============================================
-- DAILY CHECK-INS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_count INTEGER NOT NULL DEFAULT 1,
  points_earned INTEGER NOT NULL DEFAULT 0,
  UNIQUE (wallet_address, check_date)
);

-- Enable Row Level Security
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own check-ins
CREATE POLICY daily_checkins_select_policy ON public.daily_checkins
  FOR SELECT USING (auth.uid()::text = wallet_address);

-- Allow users to insert their own check-ins
CREATE POLICY daily_checkins_insert_policy ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid()::text = wallet_address);

-- Allow users to update their own check-ins
CREATE POLICY daily_checkins_update_policy ON public.daily_checkins
  FOR UPDATE USING (auth.uid()::text = wallet_address);

-- =============================================
-- USER NFT COLLECTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.user_nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  mint_address TEXT NOT NULL,
  name TEXT,
  image_url TEXT,
  collection TEXT,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (wallet_address, mint_address)
);

-- Enable Row Level Security
ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own NFTs
CREATE POLICY user_nfts_select_policy ON public.user_nfts
  FOR SELECT USING (auth.uid()::text = wallet_address);

-- =============================================
-- STORED FUNCTIONS
-- =============================================

-- Function to update user points and level when achievement is earned
CREATE OR REPLACE FUNCTION update_user_points_and_level()
RETURNS TRIGGER AS $$
DECLARE
  achievement_points INTEGER;
BEGIN
  -- Get points for the achievement
  SELECT points INTO achievement_points
  FROM public.achievements
  WHERE id = NEW.achievement_id;
  
  -- Update user's total points and level
  UPDATE public.users
  SET 
    total_points = total_points + achievement_points,
    level = GREATEST(1, FLOOR((total_points + achievement_points) / 100))
  WHERE wallet_address = NEW.wallet_address;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user points when achievement is earned
CREATE TRIGGER after_achievement_earned
  AFTER INSERT ON public.user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points_and_level();

-- Function to check if an achievement should be unlocked based on criteria
CREATE OR REPLACE FUNCTION check_achievement_criteria(
  p_wallet_address TEXT,
  p_achievement_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_result BOOLEAN;
BEGIN
  -- This is a placeholder for checking various achievement criteria
  -- In a real implementation, this would have different logic for each achievement type
  
  -- For now, just return true for testing
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL DATA - ACHIEVEMENTS
-- =============================================
INSERT INTO public.achievements (id, name, description, icon, rank, points, requires_progress, total_required)
VALUES
  ('early-adopter', 'Early Adopter', 'Joined during beta phase', '🌟', 'rare', 250, FALSE, NULL),
  ('diamond-hands', 'Diamond Hands', 'Held assets for 30 days', '💎', 'uncommon', 100, TRUE, 30),
  ('moon-shot', 'Moon Shot', '10x return on investment', '🚀', 'epic', 500, FALSE, NULL),
  ('wallet-connected', 'Wallet Connected', 'Connected a wallet to your account', '🔗', 'basic', 50, FALSE, NULL),
  ('first-transaction', 'First Transaction', 'Made your first transaction', '💸', 'basic', 50, FALSE, NULL),
  ('blockchain-explorer', 'Blockchain Explorer', 'Explored both Ethereum and Solana chains', '🧭', 'uncommon', 150, TRUE, 2),
  ('nft-collector', 'NFT Collector', 'Collect 5 NFTs from our collection', '🖼️', 'uncommon', 200, TRUE, 5),
  ('nft-whale', 'NFT Whale', 'Own 20 NFTs from our collection', '🐋', 'epic', 500, TRUE, 20),
  ('community-active', 'Community Enthusiast', 'Participate in community chat for 7 days', '🗣️', 'uncommon', 100, TRUE, 7),
  ('halloween-2024', 'Halloween 2024', 'Active during Halloween 2024 event', '🎃', 'rare', 250, FALSE, NULL),
  ('christmas-2024', 'Christmas Spirit 2024', 'Active during December 2024 holiday event', '🎄', 'rare', 250, FALSE, NULL),
  ('bank-depositor', 'Bank Depositor', 'Deposit any amount into our bank', '🏦', 'basic', 100, FALSE, NULL),
  ('high-roller', 'High Roller', 'Deposit over 10 SOL into our bank', '💰', 'epic', 400, FALSE, NULL),
  ('daily-streak-7', 'Weekly Warrior', 'Log in for 7 consecutive days', '📅', 'uncommon', 150, TRUE, 7),
  ('daily-streak-30', 'Monthly Master', 'Log in for 30 consecutive days', '📆', 'rare', 300, TRUE, 30),
  ('daily-streak-365', 'Year-Long Legend', 'Log in for 365 consecutive days', '🏆', 'legendary', 1000, TRUE, 365),
  ('market-analyst', 'Market Analyst', 'View the markets page 10 different days', '📊', 'uncommon', 100, TRUE, 10),
  ('swap-master', 'Swap Master', 'Complete 10 token swaps', '🔄', 'rare', 250, TRUE, 10),
  ('referral-program', 'Community Builder', 'Refer 3 friends who connect their wallets', '👥', 'rare', 300, TRUE, 3),
  ('artist', 'Digital Artist', 'Create artwork in the Draw section', '🎨', 'basic', 75, FALSE, NULL)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  rank = EXCLUDED.rank,
  points = EXCLUDED.points,
  requires_progress = EXCLUDED.requires_progress,
  total_required = EXCLUDED.total_required; 