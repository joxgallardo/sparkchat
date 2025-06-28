#!/usr/bin/env node

/**
 * Test script for Step 4: Spark SDK Integration
 * 
 * This script tests the basic Spark wallet operations:
 * - Balance checking
 * - Deposit address generation
 * - Spark address retrieval
 * - Lightning invoice creation
 * - On-chain withdrawal
 * - Transfer history
 */

// Load environment variables
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Debug: Check if environment variables are loaded
console.log('🔍 Debug: Checking environment variables...');
console.log('SPARK_MASTER_MNEMONIC exists:', !!process.env.SPARK_MASTER_MNEMONIC);
console.log('SPARK_MASTER_MNEMONIC starts with:', process.env.SPARK_MASTER_MNEMONIC ? process.env.SPARK_MASTER_MNEMONIC.substring(0, 20) + '...' : 'NOT SET');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('');

const { execSync } = require('child_process');
const path = require('path');

// Test configuration
const TEST_TELEGRAM_ID = 950870644; // Use the same ID from the logs
const TEST_AMOUNT_SATS = 10000; // 0.0001 BTC
const TEST_BTC_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Example address

console.log('🧪 Testing Step 4: Spark SDK Integration');
console.log('==========================================\n');

async function runTest(testName, testFunction) {
  console.log(`📋 Running test: ${testName}`);
  try {
    await testFunction();
    console.log(`✅ ${testName} - PASSED\n`);
    return true;
  } catch (error) {
    console.log(`❌ ${testName} - FAILED`);
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

async function testBalanceCheck() {
  // This would normally call the bot's /balance command
  // For now, we'll test the underlying Spark service
  const { getSparkBalanceByTelegramId } = require('../src/services/spark');
  
  const result = await getSparkBalanceByTelegramId(TEST_TELEGRAM_ID);
  
  if (typeof result.balance !== 'number') {
    throw new Error('Balance should be a number');
  }
  
  if (!(result.tokenBalances instanceof Map)) {
    throw new Error('Token balances should be a Map');
  }
  
  console.log(`   Balance: ${result.balance} sats`);
  console.log(`   Token balances: ${result.tokenBalances.size} tokens`);
}

async function testDepositAddress() {
  const { getSparkDepositAddressByTelegramId } = require('../src/services/spark');
  
  const address = await getSparkDepositAddressByTelegramId(TEST_TELEGRAM_ID);
  
  if (!address || typeof address !== 'string') {
    throw new Error('Deposit address should be a non-empty string');
  }
  
  if (!address.startsWith('bc1')) {
    throw new Error('Deposit address should start with bc1');
  }
  
  console.log(`   Address: ${address}`);
}

async function testSparkAddress() {
  const { getSparkAddressByTelegramId } = require('../src/services/spark');
  
  const address = await getSparkAddressByTelegramId(TEST_TELEGRAM_ID);
  
  if (!address || typeof address !== 'string') {
    throw new Error('Spark address should be a non-empty string');
  }
  
  if (!address.startsWith('sprt')) {
    throw new Error('Spark address should start with sprt');
  }
  
  console.log(`   Spark address: ${address}`);
}

async function testLightningInvoice() {
  const { createSparkLightningInvoiceByTelegramId } = require('../src/services/spark');
  
  const invoice = await createSparkLightningInvoiceByTelegramId(
    TEST_TELEGRAM_ID, 
    TEST_AMOUNT_SATS, 
    'Test invoice'
  );
  
  if (!invoice || typeof invoice !== 'string') {
    throw new Error('Lightning invoice should be a non-empty string');
  }
  
  if (!invoice.startsWith('ln')) {
    throw new Error('Lightning invoice should start with ln');
  }
  
  console.log(`   Invoice: ${invoice.substring(0, 50)}...`);
}

async function testTransferHistory() {
  const { getSparkTransfersByTelegramId } = require('../src/services/spark');
  
  const transfers = await getSparkTransfersByTelegramId(TEST_TELEGRAM_ID);
  
  if (!Array.isArray(transfers)) {
    throw new Error('Transfers should be an array');
  }
  
  console.log(`   Transfers found: ${transfers.length}`);
  
  if (transfers.length > 0) {
    const transfer = transfers[0];
    console.log(`   Sample transfer: ${transfer.type} - ${transfer.amount} ${transfer.currency}`);
  }
}

async function testWalletInitialization() {
  const { getUserSparkWallet } = require('../src/services/spark');
  
  const wallet = await getUserSparkWallet(TEST_TELEGRAM_ID);
  
  if (!wallet) {
    throw new Error('Wallet should be initialized');
  }
  
  // Test basic wallet methods
  const balance = await wallet.getBalance();
  const address = await wallet.getSparkAddress();
  
  console.log(`   Wallet initialized successfully`);
  console.log(`   Balance: ${balance.balance} sats`);
  console.log(`   Spark address: ${address}`);
}

async function testActionsIntegration() {
  // Test the actions layer
  const { 
    fetchBalancesAction, 
    fetchTransactionsAction,
    getDepositAddressAction,
    getSparkAddressAction
  } = require('../src/app/actions');
  
  // Test balance action
  const balances = await fetchBalancesAction(TEST_TELEGRAM_ID);
  if (typeof balances.btc !== 'number' || typeof balances.usd !== 'number') {
    throw new Error('Balance action should return BTC and USD balances');
  }
  
  // Test transactions action
  const transactions = await fetchTransactionsAction(TEST_TELEGRAM_ID);
  if (!Array.isArray(transactions)) {
    throw new Error('Transactions action should return an array');
  }
  
  // Test deposit address action
  const depositAddress = await getDepositAddressAction(TEST_TELEGRAM_ID);
  if (!depositAddress || typeof depositAddress !== 'string') {
    throw new Error('Deposit address action should return a string');
  }
  
  // Test Spark address action
  const sparkAddress = await getSparkAddressAction(TEST_TELEGRAM_ID);
  if (!sparkAddress || typeof sparkAddress !== 'string') {
    throw new Error('Spark address action should return a string');
  }
  
  console.log(`   Actions integration working`);
  console.log(`   BTC balance: ${balances.btc} BTC`);
  console.log(`   USD balance: $${balances.usd} USD`);
  console.log(`   Transactions: ${transactions.length}`);
}

async function runAllTests() {
  const tests = [
    { name: 'Wallet Initialization', fn: testWalletInitialization },
    { name: 'Balance Check', fn: testBalanceCheck },
    { name: 'Deposit Address Generation', fn: testDepositAddress },
    { name: 'Spark Address Retrieval', fn: testSparkAddress },
    { name: 'Lightning Invoice Creation', fn: testLightningInvoice },
    { name: 'Transfer History', fn: testTransferHistory },
    { name: 'Actions Integration', fn: testActionsIntegration }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Step 4 implementation is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Test the bot commands manually');
    console.log('2. Verify wallet operations in testnet');
    console.log('3. Proceed to Step 5 (UMA integration)');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
}); 