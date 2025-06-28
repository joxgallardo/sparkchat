/**
 * Test script for Spark database integration
 * This script tests the new account_number and uma_address functionality
 */

import { 
  getOrCreateTelegramUser, 
  getTelegramUser, 
  getTelegramUserByAccountNumber,
  createTelegramUser 
} from '@/services/database-hybrid';

async function testSparkDatabaseIntegration() {
  console.log('🧪 Testing Spark Database Integration...\n');

  try {
    // Test 1: Create a new user and verify account_number and uma_address are assigned
    console.log('📝 Test 1: Creating new user with automatic account_number and uma_address assignment');
    
    const testTelegramId = Math.floor(Math.random() * 1000000) + 1000000; // Random ID
    const testUsername = `testuser_${Date.now()}`;
    
    const newUser = await getOrCreateTelegramUser(
      testTelegramId,
      testUsername,
      'Test',
      'User'
    );
    
    console.log('✅ New user created:', {
      telegramId: newUser.telegramId,
      username: newUser.username,
      accountNumber: newUser.accountNumber,
      umaAddress: newUser.umaAddress,
      sparkChatUserId: newUser.sparkChatUserId
    });
    
    // Verify required fields are present
    if (!newUser.accountNumber || !newUser.umaAddress) {
      throw new Error('❌ accountNumber or umaAddress not assigned');
    }
    
    // Verify UMA address format
    if (!newUser.umaAddress.includes('@sparkchat.btc')) {
      throw new Error('❌ UMA address format is incorrect');
    }
    
    console.log('✅ Account number and UMA address assigned correctly\n');

    // Test 2: Retrieve user by account number
    console.log('🔍 Test 2: Retrieving user by account number');
    
    const userByAccountNumber = await getTelegramUserByAccountNumber(newUser.accountNumber);
    
    if (!userByAccountNumber) {
      throw new Error('❌ Could not retrieve user by account number');
    }
    
    if (userByAccountNumber.telegramId !== newUser.telegramId) {
      throw new Error('❌ Retrieved user does not match original user');
    }
    
    console.log('✅ User retrieved by account number successfully:', {
      accountNumber: userByAccountNumber.accountNumber,
      umaAddress: userByAccountNumber.umaAddress
    });

    // Test 3: Create multiple users and verify unique account numbers
    console.log('\n🔢 Test 3: Creating multiple users and verifying unique account numbers');
    
    const users = [];
    const accountNumbers = new Set();
    const umaAddresses = new Set();
    
    for (let i = 0; i < 3; i++) {
      const telegramId = Math.floor(Math.random() * 1000000) + 2000000; // Different range
      const username = `multiuser_${i}_${Date.now()}`;
      
      const user = await getOrCreateTelegramUser(
        telegramId,
        username,
        `Multi${i}`,
        'User'
      );
      
      users.push(user);
      accountNumbers.add(user.accountNumber);
      umaAddresses.add(user.umaAddress);
      
      console.log(`  User ${i + 1}:`, {
        telegramId: user.telegramId,
        accountNumber: user.accountNumber,
        umaAddress: user.umaAddress
      });
    }
    
    // Verify uniqueness
    if (accountNumbers.size !== users.length) {
      throw new Error('❌ Account numbers are not unique');
    }
    
    if (umaAddresses.size !== users.length) {
      throw new Error('❌ UMA addresses are not unique');
    }
    
    console.log('✅ All users have unique account numbers and UMA addresses');

    // Test 4: Retrieve existing user (should not create new account number)
    console.log('\n🔄 Test 4: Retrieving existing user (should not create new account number)');
    
    const existingUser = await getOrCreateTelegramUser(
      newUser.telegramId,
      newUser.username,
      newUser.firstName,
      newUser.lastName
    );
    
    if (existingUser.accountNumber !== newUser.accountNumber) {
      throw new Error('❌ Existing user got different account number');
    }
    
    if (existingUser.umaAddress !== newUser.umaAddress) {
      throw new Error('❌ Existing user got different UMA address');
    }
    
    console.log('✅ Existing user retrieved with same account number and UMA address');

    // Test 5: Test UMA address generation with different username patterns
    console.log('\n🏷️ Test 5: Testing UMA address generation with different username patterns');
    
    const testCases = [
      { username: 'normaluser', expectedPrefix: 'normaluser' },
      { username: '', expectedPrefix: 'user' },
      { username: undefined, expectedPrefix: 'user' },
      { username: 'user_with_underscores', expectedPrefix: 'user_with_underscores' },
      { username: 'UserWithCaps', expectedPrefix: 'UserWithCaps' }
    ];
    
    for (const testCase of testCases) {
      const telegramId = Math.floor(Math.random() * 1000000) + 3000000;
      const user = await getOrCreateTelegramUser(
        telegramId,
        testCase.username,
        'Test',
        'User'
      );
      
      const expectedFormat = `${testCase.expectedPrefix}${user.accountNumber}@sparkchat.btc`;
      
      if (user.umaAddress !== expectedFormat) {
        throw new Error(`❌ UMA address format incorrect for username "${testCase.username}": expected ${expectedFormat}, got ${user.umaAddress}`);
      }
      
      console.log(`  ✅ "${testCase.username}" -> ${user.umaAddress}`);
    }

    console.log('\n🎉 All Spark database integration tests passed!');
    console.log('\n📊 Summary:');
    console.log(`  - Created ${users.length + 1} users total`);
    console.log(`  - All users have unique account numbers`);
    console.log(`  - All users have unique UMA addresses`);
    console.log(`  - UMA address format is correct for all username patterns`);
    console.log(`  - User retrieval by account number works correctly`);
    console.log(`  - Existing users maintain their account numbers and UMA addresses`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSparkDatabaseIntegration().catch(console.error); 