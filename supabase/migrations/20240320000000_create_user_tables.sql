-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  wallet_address text UNIQUE,
  display_name text,
  avatar_url text,
  level integer DEFAULT 1,
  total_points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_admin boolean DEFAULT false
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  earned_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  progress integer DEFAULT 0
);

-- Create daily checkins table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  check_date date DEFAULT CURRENT_DATE NOT NULL,
  streak_count integer DEFAULT 1,
  points_earned integer DEFAULT 0,
  UNIQUE (user_id, check_date)
);

-- Create user NFTs table
CREATE TABLE IF NOT EXISTS public.user_nfts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  mint_address text NOT NULL,
  name text,
  image_url text,
  collection text,
  acquired_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, mint_address)
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nfts ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Achievements policies
CREATE POLICY "Users can view their own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Daily checkins policies
CREATE POLICY "Users can view their own checkins"
  ON public.daily_checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkins"
  ON public.daily_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NFTs policies
CREATE POLICY "Users can view their own NFTs"
  ON public.user_nfts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own NFTs"
  ON public.user_nfts FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS users_wallet_address_idx ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS user_achievements_user_id_idx ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS daily_checkins_user_id_date_idx ON public.daily_checkins(user_id, check_date);
CREATE INDEX IF NOT EXISTS user_nfts_user_id_idx ON public.user_nfts(user_id);
CREATE INDEX IF NOT EXISTS user_nfts_mint_address_idx ON public.user_nfts(mint_address); 