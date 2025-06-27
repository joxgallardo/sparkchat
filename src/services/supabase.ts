import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// LOG para depuración
console.log('DEBUG SUPABASE_URL:', JSON.stringify(supabaseUrl));
console.log('DEBUG SUPABASE_ANON_KEY:', JSON.stringify(supabaseKey));

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found. Using mock database.');
  console.warn('Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

// Helper function to check if we should use real database
export const shouldUseRealDatabase = () => {
  return isSupabaseConfigured && process.env.USE_MOCK_DATABASE !== 'true';
}; 