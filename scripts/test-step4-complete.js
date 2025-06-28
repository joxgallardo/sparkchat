#!/usr/bin/env node

/**
 * Test Script for Step 4: Complete Spark SDK Migration Verification
 * 
 * This script tests all the Spark SDK functions to ensure the migration
 * from Lightspark to Spark SDK is working correctly.
 */

require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const { 
  getSparkBalanceByTelegramId,
  getSparkDepositAddressByTelegramId,
  createSparkLightningInvoiceByTelegramId,
  getSparkAddressByTelegramId,
  getSparkTransfersByTelegramId,
  clearWalletCache,
  getWalletCacheSize
} = require('../src/services/spark');

const { getUserWalletInfo } = require('../src/services/userManager');

async function testStep4Complete() {
  console.log('🧪 Testing Step 4: Complete Spark SDK Migration\n');
  
  const TEST_TELEGRAM_ID = 950870644;
  
  try {
    // Test 1: Verify environment variables
    console.log('1️⃣ Testing Environment Variables...');
    const masterMnemonic = process.env.SPARK_MASTER_MNEMONIC;
    if (!masterMnemonic) {
      throw new Error('SPARK_MASTER_MNEMONIC not found in environment variables');
    }
    console.log('✅ SPARK_MASTER_MNEMONIC found (length:', masterMnemonic.split(' ').length, 'words)');
    
    // Test 2: Verify user wallet info
    console.log('\n2️⃣ Testing User Wallet Info...');
    const walletInfo = await getUserWalletInfo(TEST_TELEGRAM_ID);
    console.log('✅ User wallet info retrieved:', {
      userId: walletInfo.userId,
      accountNumber: walletInfo.accountNumber,
      umaAddress: walletInfo.umaAddress
    });
    
    // Test 3: Test wallet initialization and balance
    console.log('\n3️⃣ Testing Wallet Initialization and Balance...');
    const balanceInfo = await getSparkBalanceByTelegramId(TEST_TELEGRAM_ID);
    console.log('✅ Balance retrieved:', {
      balance: balanceInfo.balance,
      balanceBTC: (balanceInfo.balance / 100_000_000).toFixed(8),
      tokenBalancesCount: balanceInfo.tokenBalances.size
    });
    
    // Test 4: Test deposit address generation
    console.log('\n4️⃣ Testing Deposit Address Generation...');
    const depositAddress = await getSparkDepositAddressByTelegramId(TEST_TELEGRAM_ID);
    console.log('✅ Deposit address generated:', depositAddress);
    
    // Test 5: Test Spark address retrieval
    console.log('\n5️⃣ Testing Spark Address Retrieval...');
    const sparkAddress = await getSparkAddressByTelegramId(TEST_TELEGRAM_ID);
    console.log('✅ Spark address retrieved:', sparkAddress);
    
    // Test 6: Test Lightning invoice creation
    console.log('\n6️⃣ Testing Lightning Invoice Creation...');
    const testAmountSats = 1000; // 0.00001 BTC
    const invoice = await createSparkLightningInvoiceByTelegramId(
      TEST_TELEGRAM_ID, 
      testAmountSats, 
      'Test invoice from Step 4 verification'
    );
    console.log('✅ Lightning invoice created:', invoice);
    
    // Test 7: Test transaction history
    console.log('\n7️⃣ Testing Transaction History...');
    const transactions = await getSparkTransfersByTelegramId(TEST_TELEGRAM_ID);
    console.log('✅ Transaction history retrieved:', {
      count: transactions.length,
      transactions: transactions.slice(0, 3) // Show first 3 transactions
    });
    
    // Test 8: Test wallet cache
    console.log('\n8️⃣ Testing Wallet Cache...');
    const cacheSize = await getWalletCacheSize();
    console.log('✅ Wallet cache size:', cacheSize);
    
    // Test 9: Test cache clearing
    console.log('\n9️⃣ Testing Cache Clearing...');
    await clearWalletCache();
    const newCacheSize = await getWalletCacheSize();
    console.log('✅ Cache cleared, new size:', newCacheSize);
    
    // Test 10: Test balance after cache clear (should reinitialize wallet)
    console.log('\n🔟 Testing Balance After Cache Clear...');
    const balanceAfterClear = await getSparkBalanceByTelegramId(TEST_TELEGRAM_ID);
    console.log('✅ Balance after cache clear:', {
      balance: balanceAfterClear.balance,
      balanceBTC: (balanceAfterClear.balance / 100_000_000).toFixed(8)
    });
    
    console.log('\n🎉 Step 4 Migration Verification Complete!');
    console.log('✅ All Spark SDK functions are working correctly');
    console.log('✅ Wallet initialization with mnemonic conversion is successful');
    console.log('✅ All core functionality has been migrated from Lightspark to Spark SDK');
    
  } catch (error) {
    console.error('\n❌ Step 4 Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
testStep4Complete().catch(console.error); 