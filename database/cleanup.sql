-- Drop all existing tables and related objects
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS level_requirements CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS chat_reactions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS daily_checkins CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS auth CASCADE;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_user_points() CASCADE;
DROP FUNCTION IF EXISTS check_and_update_level(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_user_stats(UUID) CASCADE;

-- Drop any existing triggers
DROP TRIGGER IF EXISTS point_transaction_trigger ON point_transactions CASCADE;

-- Drop any existing indexes
DROP INDEX IF EXISTS idx_user_achievements_user_id;
DROP INDEX IF EXISTS idx_daily_checkins_user_id;
DROP INDEX IF EXISTS idx_chat_messages_user_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_point_transactions_user_id;
DROP INDEX IF EXISTS idx_user_rewards_user_id; 