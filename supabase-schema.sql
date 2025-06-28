-- SparkChat Database Schema for Supabase
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create telegram_users table
CREATE TABLE IF NOT EXISTS telegram_users (
  telegram_id BIGINT PRIMARY KEY,
  spark_chat_user_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  account_number INT UNIQUE NOT NULL, -- Spark account number for wallet derivation
  uma_address VARCHAR(255) UNIQUE NOT NULL, -- UMA address in format usuario@sparkchat.btc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telegram_sessions table
CREATE TABLE IF NOT EXISTS telegram_sessions (
  telegram_id BIGINT PRIMARY KEY REFERENCES telegram_users(telegram_id) ON DELETE CASCADE,
  spark_chat_user_id TEXT NOT NULL,
  is_authenticated BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Create user_lightspark_configs table (DEPRECATED - will be removed in future)
CREATE TABLE IF NOT EXISTS user_lightspark_configs (
  user_id TEXT PRIMARY KEY,
  lightspark_wallet_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (for general SparkChat users)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sequence for account_number generation
CREATE SEQUENCE IF NOT EXISTS account_number_seq START 1;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_users_spark_chat_id ON telegram_users(spark_chat_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_spark_chat_id ON telegram_sessions(spark_chat_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_username ON telegram_users(username);
CREATE INDEX IF NOT EXISTS idx_telegram_users_last_seen ON telegram_users(last_seen);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_last_activity ON telegram_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_telegram_users_account_number ON telegram_users(account_number);
CREATE INDEX IF NOT EXISTS idx_telegram_users_uma_address ON telegram_users(uma_address);

-- Enable Row Level Security (RLS)
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lightspark_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for telegram_users
CREATE POLICY "Allow all operations for telegram_users" ON telegram_users
  FOR ALL USING (true);

-- Create RLS policies for telegram_sessions
CREATE POLICY "Allow all operations for telegram_sessions" ON telegram_sessions
  FOR ALL USING (true);

-- Create RLS policies for user_lightspark_configs
CREATE POLICY "Allow all operations for user_lightspark_configs" ON user_lightspark_configs
  FOR ALL USING (true);

-- Create RLS policies for users
CREATE POLICY "Allow all operations for users" ON users
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to generate UMA address
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

-- Create triggers for updated_at
CREATE TRIGGER update_user_lightspark_configs_updated_at
  BEFORE UPDATE ON user_lightspark_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data (optional) - Updated with new fields
INSERT INTO users (id, email) VALUES 
  ('test-user-123', 'testuser@example.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO telegram_users (telegram_id, spark_chat_user_id, username, first_name, last_name, account_number, uma_address) VALUES 
  (123456789, 'test-user-123', 'testuser', 'Test', 'User', 1, 'testuser1@sparkchat.btc')
ON CONFLICT (telegram_id) DO NOTHING;

INSERT INTO user_lightspark_configs (user_id, lightspark_wallet_id) VALUES 
  ('test-user-123', 'default-mock-wallet-id-from-db')
ON CONFLICT (user_id) DO NOTHING;

-- Create view for user statistics
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