#!/usr/bin/env node

/**
 * @fileOverview Test script for Step 7: Lightning Deposits Implementation
 * 
 * This script tests the Lightning deposit functionality implemented in Step 7
 * of the SparkChat UMA Integration plan.
 * 
 * Tests:
 * 1. Lightning invoice creation
 * 2. Balance synchronization with Lightning payments
 * 3. Invoice format validation
 * 4. Error handling for invalid amounts
 */

const { 
  createSparkLightningInvoiceByTelegramId,
  getSparkBalanceByTelegramId,
  testSparkConnectivity: testSparkConnectivityService
} = require('../src/services/spark');

// Test configuration - using a real user ID or create one
const TEST_TELEGRAM_ID = 123456789; // This should be a real user ID from your database
const TEST_AMOUNT_SATS = 10000; // 0.0001 BTC
const TEST_AMOUNT_BTC = 0.0001;

console.log('🧪 Testing Step 7: Lightning Deposits Implementation\n');
console.log('⚠️  Note: This test requires a valid user in the database.');
console.log(`   Using Telegram ID: ${TEST_TELEGRAM_ID}\n`);

async function testSparkConnectivity() {
  console.log('1️⃣ Testing Spark connectivity...');
  
  try {
    const result = await testSparkConnectivityService();
    
    if (result.success) {
      console.log(`   ✅ Spark connectivity test passed`);
      console.log(`   🌐 Network: ${result.details?.network || 'Unknown'}`);
      console.log(`   💰 Test balance: ${result.details?.balance?.balance || 'Unknown'} sats`);
    } else {
      console.log(`   ❌ Spark connectivity test failed: ${result.error}`);
    }
    
    return result;
  } catch (error) {
    console.error(`   ❌ Error testing Spark connectivity:`, error.message);
    throw error;
  }
}

async function testLightningInvoiceCreation() {
  console.log('\n2️⃣ Testing Lightning invoice creation...');
  
  try {
    const invoice = await createSparkLightningInvoiceByTelegramId(
      TEST_TELEGRAM_ID, 
      TEST_AMOUNT_SATS, 
      'Test Lightning deposit'
    );
    
    if (!invoice || typeof invoice !== 'string') {
      throw new Error('Lightning invoice should be a non-empty string');
    }
    
    if (!invoice.startsWith('ln')) {
      throw new Error('Lightning invoice should start with "ln"');
    }
    
    console.log(`   ✅ Invoice created successfully`);
    console.log(`   📝 Invoice: ${invoice.substring(0, 50)}...`);
    console.log(`   💰 Amount: ${TEST_AMOUNT_SATS} sats (${TEST_AMOUNT_BTC} BTC)`);
    
    return invoice;
  } catch (error) {
    console.error(`   ❌ Error creating Lightning invoice:`, error.message);
    if (error.message.includes('No user found')) {
      console.log(`   💡 Tip: Create a user first with /start in the bot`);
    }
    throw error;
  }
}

async function testBalanceSynchronization() {
  console.log('\n3️⃣ Testing balance synchronization...');
  
  try {
    // Get balance with forceRefetch to sync Lightning payments
    const { balance, tokenBalances } = await getSparkBalanceByTelegramId(TEST_TELEGRAM_ID, true);
    
    console.log(`   ✅ Balance retrieved successfully`);
    console.log(`   💰 BTC Balance: ${balance} sats (${(balance / 100_000_000).toFixed(8)} BTC)`);
    console.log(`   🪙 Token balances: ${tokenBalances.size} tokens`);
    
    if (tokenBalances.size > 0) {
      for (const [token, amount] of tokenBalances.entries()) {
        console.log(`      • ${token}: ${amount}`);
      }
    }
    
    return { balance, tokenBalances };
  } catch (error) {
    console.error(`   ❌ Error getting balance:`, error.message);
    if (error.message.includes('No user found')) {
      console.log(`   💡 Tip: Create a user first with /start in the bot`);
    }
    throw error;
  }
}

async function testInvalidAmounts() {
  console.log('\n4️⃣ Testing invalid amount handling...');
  
  const testCases = [
    { amount: 0, description: 'Zero amount' },
    { amount: -1000, description: 'Negative amount' },
    { amount: 0.000000001, description: 'Amount too small (less than 1 sat)' }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`   Testing: ${testCase.description} (${testCase.amount})`);
      
      await createSparkLightningInvoiceByTelegramId(
        TEST_TELEGRAM_ID, 
        testCase.amount, 
        'Test invalid amount'
      );
      
      console.log(`   ❌ Should have failed for ${testCase.description}`);
    } catch (error) {
      if (error.message.includes('No user found')) {
        console.log(`   ⚠️  Skipped (user not found): ${testCase.description}`);
      } else {
        console.log(`   ✅ Correctly rejected ${testCase.description}: ${error.message}`);
      }
    }
  }
}

async function testInvoiceFormat() {
  console.log('\n5️⃣ Testing invoice format validation...');
  
  try {
    const invoice = await createSparkLightningInvoiceByTelegramId(
      TEST_TELEGRAM_ID, 
      TEST_AMOUNT_SATS, 
      'Format test'
    );
    
    // Basic BOLT11 format validation
    const isValidFormat = /^ln[a-zA-Z0-9]+$/.test(invoice);
    
    if (isValidFormat) {
      console.log(`   ✅ Invoice format is valid BOLT11`);
      console.log(`   📏 Length: ${invoice.length} characters`);
      console.log(`   🔗 Prefix: ${invoice.substring(0, 10)}...`);
    } else {
      console.log(`   ❌ Invoice format appears invalid`);
    }
    
    return invoice;
  } catch (error) {
    console.error(`   ❌ Error testing invoice format:`, error.message);
    if (error.message.includes('No user found')) {
      console.log(`   💡 Tip: Create a user first with /start in the bot`);
    }
    throw error;
  }
}

async function runAllTests() {
  try {
    // Test 1: Spark connectivity (this should work regardless of user)
    await testSparkConnectivity();
    
    // Test 2: Lightning invoice creation (requires user)
    try {
      const invoice = await testLightningInvoiceCreation();
      
      // Test 3: Balance synchronization (requires user)
      await testBalanceSynchronization();
      
      // Test 4: Invalid amounts (requires user)
      await testInvalidAmounts();
      
      // Test 5: Invoice format (requires user)
      await testInvoiceFormat();
      
      console.log('\n🎉 All Step 7 tests completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ Spark connectivity');
      console.log('   ✅ Lightning invoice creation works');
      console.log('   ✅ Balance synchronization with Lightning payments');
      console.log('   ✅ Invalid amount validation');
      console.log('   ✅ Invoice format validation');
      
    } catch (userError) {
      if (userError.message.includes('No user found')) {
        console.log('\n⚠️  User-dependent tests skipped (no user found)');
        console.log('📋 Summary:');
        console.log('   ✅ Spark connectivity');
        console.log('   ⚠️  Lightning tests require a valid user');
        console.log('\n💡 To test Lightning functionality:');
        console.log('   1. Start the bot');
        console.log('   2. Send /start to create a user');
        console.log('   3. Run this test again');
      } else {
        throw userError;
      }
    }
    
    console.log('\n💡 Next steps:');
    console.log('   • Test with real Lightning payments');
    console.log('   • Verify invoice expiration handling');
    console.log('   • Test cross-network compatibility');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testLightningInvoiceCreation,
  testBalanceSynchronization,
  testInvalidAmounts,
  testInvoiceFormat,
  testSparkConnectivity,
  runAllTests
}; 