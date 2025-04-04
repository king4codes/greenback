-- Create stored procedure for incrementing points for a user
CREATE OR REPLACE FUNCTION increment_user_points(user_wallet TEXT, points_to_add INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_points INTEGER;
  new_points INTEGER;
BEGIN
  -- Get current points
  SELECT total_points INTO current_points FROM users WHERE wallet_address = user_wallet;
  
  -- Calculate new points
  new_points := current_points + points_to_add;
  
  -- Update user points
  UPDATE users SET total_points = new_points WHERE wallet_address = user_wallet;
  
  -- Return new points
  RETURN new_points;
END;
$$;

-- Create stored procedure for calculating and updating user level
CREATE OR REPLACE FUNCTION update_user_level(user_wallet TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  current_points INTEGER;
  new_level INTEGER;
BEGIN
  -- Get current points
  SELECT total_points INTO current_points FROM users WHERE wallet_address = user_wallet;
  
  -- Calculate level based on points
  new_level := GREATEST(1, FLOOR(current_points / 100));
  
  -- Update user level
  UPDATE users SET level = new_level WHERE wallet_address = user_wallet;
  
  -- Return new level
  RETURN new_level;
END;
$$; 