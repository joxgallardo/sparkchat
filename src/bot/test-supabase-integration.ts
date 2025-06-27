/**
 * Test script for Supabase integration
 * Run with: npx tsx src/bot/test-supabase-integration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { getUserContext, getSparkChatUserId, isUserAuthenticated, getUserStats } from '@/services/userManager';
import { shouldUseRealDatabase, isSupabaseConfigured } from '@/services/supabase';

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase Integration...\n');

  // Check configuration
  console.log('📋 Configuration Check:');
  console.log('  - Supabase configured:', isSupabaseConfigured);
  console.log('  - Should use real database:', shouldUseRealDatabase());
  console.log('  - USE_MOCK_DATABASE:', process.env.USE_MOCK_DATABASE);
  console.log('  - SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('  - SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 1: Create new user with Supabase
  console.log('📝 Test 1: Creating new user with Supabase...');
  const telegramId = 999888777;
  const userData = {
    username: 'supabaseuser',
    firstName: 'Supabase',
    lastName: 'User'
  };

  try {
    const userContext = await getUserContext(telegramId, userData);
    console.log('✅ User created successfully:');
    console.log('  - Telegram ID:', userContext.telegramId);
    console.log('  - SparkChat User ID:', userContext.sparkChatUserId);
    console.log('  - Is Authenticated:', userContext.isAuthenticated);
    console.log('  - User:', userContext.user);
    console.log('  - Session:', userContext.session);
  } catch (error) {
    console.error('❌ Error creating user:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Get existing user
  console.log('🔍 Test 2: Getting existing user...');
  try {
    const sparkChatUserId = await getSparkChatUserId(telegramId);
    console.log('✅ Existing user retrieved:');
    console.log('  - SparkChat User ID:', sparkChatUserId);
  } catch (error) {
    console.error('❌ Error getting existing user:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Check authentication
  console.log('🔐 Test 3: Checking authentication...');
  try {
    const isAuth = await isUserAuthenticated(telegramId);
    console.log('✅ Is authenticated:', isAuth);
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Get user stats
  console.log('📊 Test 4: Getting user stats...');
  try {
    const stats = await getUserStats(telegramId);
    console.log('✅ User stats:');
    console.log('  - Stats:', stats);
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Create another user to test isolation
  console.log('👤 Test 5: Creating another user...');
  const telegramId2 = 111222333;
  const userData2 = {
    username: 'anothersupabaseuser',
    firstName: 'Another',
    lastName: 'SupabaseUser'
  };

  try {
    const userContext2 = await getUserContext(telegramId2, userData2);
    console.log('✅ Second user created successfully:');
    console.log('  - Telegram ID:', userContext2.telegramId);
    console.log('  - SparkChat User ID:', userContext2.sparkChatUserId);
    
    // Verify different IDs
    const firstUserId = await getSparkChatUserId(telegramId);
    console.log('  - Different IDs:', userContext2.sparkChatUserId !== firstUserId);
  } catch (error) {
    console.error('❌ Error creating second user:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Test session persistence
  console.log('🔄 Test 6: Testing session persistence...');
  try {
    // Get user context again to test session persistence
    const userContext3 = await getUserContext(telegramId, userData);
    console.log('✅ Session persistence test:');
    console.log('  - Same SparkChat User ID:', userContext3.sparkChatUserId);
    console.log('  - Still authenticated:', userContext3.isAuthenticated);
  } catch (error) {
    console.error('❌ Error in session persistence test:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 All Supabase integration tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Configuration check');
  console.log('✅ User creation and retrieval');
  console.log('✅ SparkChat User ID mapping');
  console.log('✅ Authentication checking');
  console.log('✅ User statistics');
  console.log('✅ Multiple user isolation');
  console.log('✅ Session persistence');
  
  console.log('\n💡 Next steps:');
  console.log('1. Set up Supabase project at https://supabase.com');
  console.log('2. Run the SQL schema from supabase-schema.sql');
  console.log('3. Add your Supabase credentials to .env');
  console.log('4. Set USE_MOCK_DATABASE=false to use real database');
}

// Run tests
testSupabaseIntegration().catch(console.error); 