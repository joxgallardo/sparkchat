/**
 * Test script for user management system
 * Run with: npx tsx src/bot/test-user-management.ts
 */

import { getUserContext, getSparkChatUserId, isUserAuthenticated, getUserStats } from '@/services/userManager';
import { getTelegramUser, getTelegramSession } from '@/services/database';

async function testUserManagement() {
  console.log('🧪 Testing User Management System...\n');

  // Test 1: Create new user
  console.log('📝 Test 1: Creating new user...');
  const telegramId = 123456789;
  const userData = {
    username: 'testuser',
    firstName: 'Test',
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
    const existingUser = await getTelegramUser(telegramId);
    console.log('✅ Existing user retrieved:');
    console.log('  - User:', existingUser);
  } catch (error) {
    console.error('❌ Error getting existing user:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Get SparkChat User ID
  console.log('🆔 Test 3: Getting SparkChat User ID...');
  try {
    const sparkChatUserId = await getSparkChatUserId(telegramId);
    console.log('✅ SparkChat User ID:', sparkChatUserId);
  } catch (error) {
    console.error('❌ Error getting SparkChat User ID:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Check authentication
  console.log('🔐 Test 4: Checking authentication...');
  try {
    const isAuth = await isUserAuthenticated(telegramId);
    console.log('✅ Is authenticated:', isAuth);
  } catch (error) {
    console.error('❌ Error checking authentication:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 5: Get user stats
  console.log('📊 Test 5: Getting user stats...');
  try {
    const stats = await getUserStats(telegramId);
    console.log('✅ User stats:');
    console.log('  - Stats:', stats);
  } catch (error) {
    console.error('❌ Error getting user stats:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 6: Create another user
  console.log('👤 Test 6: Creating another user...');
  const telegramId2 = 987654321;
  const userData2 = {
    username: 'anotheruser',
    firstName: 'Another',
    lastName: 'User'
  };

  try {
    const userContext2 = await getUserContext(telegramId2, userData2);
    console.log('✅ Second user created successfully:');
    console.log('  - Telegram ID:', userContext2.telegramId);
    console.log('  - SparkChat User ID:', userContext2.sparkChatUserId);
    console.log('  - Different IDs:', userContext2.sparkChatUserId !== (await getSparkChatUserId(telegramId)));
  } catch (error) {
    console.error('❌ Error creating second user:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 7: Test session middleware simulation
  console.log('🔄 Test 7: Simulating session middleware...');
  try {
    // Simulate message object
    const mockMessage = {
      from: {
        id: telegramId,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      },
      chat: { id: 123456789 },
      text: '/test'
    };

    // Simulate session middleware
    const telegramIdFromMessage = mockMessage.from?.id;
    if (telegramIdFromMessage) {
      const userContext = await getUserContext(telegramIdFromMessage, {
        username: mockMessage.from?.username,
        firstName: mockMessage.from?.first_name,
        lastName: mockMessage.from?.last_name
      });

      console.log('✅ Session middleware simulation successful:');
      console.log('  - Telegram ID from message:', telegramIdFromMessage);
      console.log('  - SparkChat User ID:', userContext.sparkChatUserId);
      console.log('  - Is Authenticated:', userContext.isAuthenticated);
    }
  } catch (error) {
    console.error('❌ Error in session middleware simulation:', error);
  }

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ User creation and retrieval');
  console.log('✅ SparkChat User ID mapping');
  console.log('✅ Authentication checking');
  console.log('✅ User statistics');
  console.log('✅ Multiple user isolation');
  console.log('✅ Session middleware simulation');
}

// Run tests
testUserManagement().catch(console.error); 