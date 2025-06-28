-- Migration script to add Spark and UMA support to existing SparkChat database
-- Run this in your Supabase SQL editor after the main schema

-- Add new columns to telegram_users table if they don't exist
DO $$ 
BEGIN
    -- Add account_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'telegram_users' AND column_name = 'account_number') THEN
        ALTER TABLE telegram_users ADD COLUMN account_number INT;
    END IF;
    
    -- Add uma_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'telegram_users' AND column_name = 'uma_address') THEN
        ALTER TABLE telegram_users ADD COLUMN uma_address VARCHAR(255);
    END IF;
END $$;

-- Create sequence for account_number generation if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS account_number_seq START 1;

-- Function to generate UMA address
CREATE OR REPLACE FUNCTION generate_uma_address(username TEXT, account_number INT)
RETURNS TEXT AS $$
BEGIN
  -- Generate UMA address in format: username{account_number}@sparkchat.btc
  -- If username is null or empty, use 'user' as prefix
  RETURN COALESCE(
    CASE 
      WHEN username IS NULL OR username = '' THEN 'user'
      ELSE username
    END || account_number::TEXT || '@sparkchat.btc',
    'user' || account_number::TEXT || '@sparkchat.btc'
  );
END;
$$ language 'plpgsql';

-- Update existing users with account_number and uma_address
-- This assigns sequential account numbers to existing users
WITH numbered_users AS (
  SELECT 
    telegram_id,
    username,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM telegram_users 
  WHERE account_number IS NULL
)
UPDATE telegram_users 
SET 
  account_number = numbered_users.row_num,
  uma_address = generate_uma_address(numbered_users.username, numbered_users.row_num)
FROM numbered_users
WHERE telegram_users.telegram_id = numbered_users.telegram_id;

-- Make columns NOT NULL after populating them
ALTER TABLE telegram_users ALTER COLUMN account_number SET NOT NULL;
ALTER TABLE telegram_users ALTER COLUMN uma_address SET NOT NULL;

-- Add unique constraints
ALTER TABLE telegram_users ADD CONSTRAINT telegram_users_account_number_unique UNIQUE (account_number);
ALTER TABLE telegram_users ADD CONSTRAINT telegram_users_uma_address_unique UNIQUE (uma_address);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_account_number ON telegram_users(account_number);
CREATE INDEX IF NOT EXISTS idx_telegram_users_uma_address ON telegram_users(uma_address);

-- Update the user_stats view to include new fields
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  tu.telegram_id,
  tu.username,
  tu.first_name,
  tu.last_name,
  tu.is_active,
  tu.account_number,
  tu.uma_address,
  tu.created_at,
  tu.last_seen,
  ts.last_activity,
  ts.is_authenticated,
  ts.preferences
FROM telegram_users tu
LEFT JOIN telegram_sessions ts ON tu.telegram_id = ts.telegram_id;

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify migration
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_users,
  COUNT(account_number) as users_with_account_number,
  COUNT(uma_address) as users_with_uma_address
FROM telegram_users; 