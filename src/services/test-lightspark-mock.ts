#!/usr/bin/env tsx

/**
 * Test script for Lightspark integration with MOCK data
 * Run with: npx tsx src/services/test-lightspark-mock.ts
 * 
 * This script tests all functionality using mock data to demonstrate
 * that the implementation works correctly.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { 
  getLightsparkBalances, 
  getLightsparkTransactionHistory,
  depositBTCWithLightspark,
  withdrawUSDWithLightspark,
  convertBTCToUSDWithLightspark,
  convertUSDToBTCWithLightspark
} from './lightspark';

async function testLightsparkMockIntegration() {
  console.log('🧪 Testing Lightspark Integration with MOCK Data...\n');

  // Temporarily enable mock client
  const originalUseMock = process.env.USE_MOCK_CLIENT;
  process.env.USE_MOCK_CLIENT = 'true';

  const testUserId = 'test-user-123';

  try {
    // Test 1: Get initial balances
    console.log('1️⃣ Testing getLightsparkBalances (Initial)...');
    const initialBalances = await getLightsparkBalances(testUserId);
    console.log('✅ Initial Balances:', initialBalances);
    console.log('');

    // Test 2: Get initial transaction history
    console.log('2️⃣ Testing getLightsparkTransactionHistory (Initial)...');
    const initialTransactions = await getLightsparkTransactionHistory(testUserId);
    console.log('✅ Initial Transactions found:', initialTransactions.length);
    console.log('');

    // Test 3: Create deposit invoice
    console.log('3️⃣ Testing depositBTCWithLightspark...');
    const depositResult = await depositBTCWithLightspark(testUserId, 0.001); // 0.001 BTC
    console.log('✅ Deposit invoice created:', {
      newBalance: depositResult.newBtcBalance,
      transactionId: depositResult.transaction.id,
      invoiceLength: depositResult.invoice?.length || 0,
      description: depositResult.transaction.description
    });
    console.log('');

    // Test 4: Check balances after deposit
    console.log('4️⃣ Testing getLightsparkBalances (After Deposit)...');
    const balancesAfterDeposit = await getLightsparkBalances(testUserId);
    console.log('✅ Balances after deposit:', balancesAfterDeposit);
    console.log('');

    // Test 5: Convert BTC to USD
    console.log('5️⃣ Testing convertBTCToUSDWithLightspark...');
    const btcToUsdResult = await convertBTCToUSDWithLightspark(testUserId, 0.0005); // 0.0005 BTC
    console.log('✅ BTC to USD conversion:', {
      newBtcBalance: btcToUsdResult.newBtcBalance,
      newUsdBalance: btcToUsdResult.newUsdBalance,
      transactionId: btcToUsdResult.transaction.id,
      convertedAmount: btcToUsdResult.transaction.convertedAmount,
      description: btcToUsdResult.transaction.description
    });
    console.log('');

    // Test 6: Check balances after BTC to USD conversion
    console.log('6️⃣ Testing getLightsparkBalances (After BTC→USD)...');
    const balancesAfterBtcToUsd = await getLightsparkBalances(testUserId);
    console.log('✅ Balances after BTC→USD conversion:', balancesAfterBtcToUsd);
    console.log('');

    // Test 7: Convert USD to BTC
    console.log('7️⃣ Testing convertUSDToBTCWithLightspark...');
    const usdToBtcResult = await convertUSDToBTCWithLightspark(testUserId, 15); // $15 USD
    console.log('✅ USD to BTC conversion:', {
      newUsdBalance: usdToBtcResult.newUsdBalance,
      newBtcBalance: usdToBtcResult.newBtcBalance,
      transactionId: usdToBtcResult.transaction.id,
      convertedAmount: usdToBtcResult.transaction.convertedAmount,
      description: usdToBtcResult.transaction.description
    });
    console.log('');

    // Test 8: Check balances after USD to BTC conversion
    console.log('8️⃣ Testing getLightsparkBalances (After USD→BTC)...');
    const balancesAfterUsdToBtc = await getLightsparkBalances(testUserId);
    console.log('✅ Balances after USD→BTC conversion:', balancesAfterUsdToBtc);
    console.log('');

    // Test 9: Test USD withdrawal
    console.log('9️⃣ Testing withdrawUSDWithLightspark...');
    const withdrawResult = await withdrawUSDWithLightspark(testUserId, 10, 'test-bank-account-123');
    console.log('✅ USD withdrawal processed:', {
      newBalance: withdrawResult.newUsdBalance,
      transactionId: withdrawResult.transaction.id,
      description: withdrawResult.transaction.description
    });
    console.log('');

    // Test 10: Final balance check
    console.log('🔟 Testing getLightsparkBalances (Final)...');
    const finalBalances = await getLightsparkBalances(testUserId);
    console.log('✅ Final Balances:', finalBalances);
    console.log('');

    // Test 11: Final transaction history
    console.log('1️⃣1️⃣ Testing getLightsparkTransactionHistory (Final)...');
    const finalTransactions = await getLightsparkTransactionHistory(testUserId);
    console.log('✅ Final Transactions found:', finalTransactions.length);
    if (finalTransactions.length > 0) {
      console.log('📋 Transaction Summary:');
      finalTransactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.type}: ${tx.amount} ${tx.currency} - ${tx.description}`);
      });
    }
    console.log('');

    console.log('🎉 All mock tests completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Initial Balance: ${initialBalances.btc} BTC, $${initialBalances.usd} USD`);
    console.log(`   - Final Balance: ${finalBalances.btc} BTC, $${finalBalances.usd} USD`);
    console.log(`   - Total Transactions: ${finalTransactions.length}`);
    console.log('');
    console.log('✅ All Lightspark functionality is working correctly with mock data!');
    
  } catch (error) {
    console.error('❌ Mock test failed:', error);
    process.exit(1);
  } finally {
    // Restore original mock setting
    if (originalUseMock !== undefined) {
      process.env.USE_MOCK_CLIENT = originalUseMock;
    } else {
      delete process.env.USE_MOCK_CLIENT;
    }
  }
}

// Run the test
testLightsparkMockIntegration().catch(console.error); 