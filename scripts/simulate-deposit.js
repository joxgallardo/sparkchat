#!/usr/bin/env node

/**
 * Simulate Deposit Script for REGTEST Testing
 * 
 * This script simulates deposits to test the bot functionality
 * in REGTEST mode without needing real faucets.
 */

require('dotenv').config();

const { execSync } = require('child_process');

console.log('💰 Simulating Deposits for REGTEST Testing');
console.log('==========================================');

// Test 1: Get deposit address
console.log('\n📋 Test 1: Get Deposit Address');
console.log('--------------------------------');

try {
  const addressResult = execSync('npx tsx -e "import { getSparkDepositAddressByTelegramId } from \'./src/services/spark\'; getSparkDepositAddressByTelegramId(950870644).then(address => { console.log(\'✅ Deposit address:\', address); }).catch(err => { console.log(\'❌ Error getting address:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(addressResult);
} catch (error) {
  console.log('❌ Failed to get deposit address:', error.message);
}

// Test 2: Check initial balance
console.log('\n📋 Test 2: Check Initial Balance');
console.log('---------------------------------');

try {
  const balanceResult = execSync('npx tsx -e "import { getSparkBalanceByTelegramId } from \'./src/services/spark\'; getSparkBalanceByTelegramId(950870644).then(balance => { console.log(\'✅ Initial balance:\', JSON.stringify(balance, null, 2)); }).catch(err => { console.log(\'❌ Error getting balance:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(balanceResult);
} catch (error) {
  console.log('❌ Failed to get balance:', error.message);
}

console.log('\n🎯 REGTEST Testing Instructions');
console.log('===============================');
console.log('1. Use the deposit address above to send REGTEST Bitcoin');
console.log('2. You can use REGTEST faucets or generate funds locally');
console.log('3. After sending, use /balance in your Telegram bot');
console.log('4. The balance should update automatically');

console.log('\n🔗 REGTEST Resources:');
console.log('- REGTEST Faucet: https://testnet-faucet.mempool.co/ (if supports REGTEST)');
console.log('- Local REGTEST node: If you have one running');
console.log('- Spark REGTEST services: Already configured in your bot');

console.log('\n💡 Testing Tips:');
console.log('- Start with small amounts (0.001 BTC)');
console.log('- Wait a few minutes for confirmations');
console.log('- Use /balance command to check updates');
console.log('- Test Lightning invoices with small amounts'); 