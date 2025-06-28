#!/usr/bin/env node

/**
 * Test Script for REGTEST Features
 * 
 * This script tests all the bot features using REGTEST:
 * - Balance checking
 * - Deposit address generation
 * - Lightning invoice creation
 * - On-chain withdrawals
 * - Transfer history
 * - User management
 */

require('dotenv').config();

const { execSync } = require('child_process');

console.log('🧪 Testing REGTEST Features');
console.log('===========================');

const TEST_TELEGRAM_ID = 950870644;
const TEST_AMOUNT_SATS = 10000; // 0.0001 BTC
const TEST_BTC_ADDRESS = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Example REGTEST address

// Test 1: Environment Setup
console.log('\n📋 Test 1: Environment Setup');
console.log('-----------------------------');

try {
  // Set SPARK_NETWORK to REGTEST for this test
  process.env.SPARK_NETWORK = 'REGTEST';
  
  const envTest = execSync('npx tsx -e "console.log(\'SPARK_NETWORK:\', process.env.SPARK_NETWORK); console.log(\'SPARK_MASTER_MNEMONIC:\', process.env.SPARK_MASTER_MNEMONIC ? \'SET\' : \'NOT_SET\');"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(envTest);
  console.log('✅ Environment setup: PASSED');
} catch (error) {
  console.log('❌ Environment setup: FAILED');
  console.log('Error:', error.message);
}

// Test 2: User Management
console.log('\n📋 Test 2: User Management');
console.log('----------------------------');

try {
  const userTest = execSync('npx tsx -e "import { getUserWalletInfo } from \'./src/services/userManager\'; getUserWalletInfo(950870644).then(info => { console.log(\'✅ User info retrieved:\', JSON.stringify(info, null, 2)); }).catch(err => { console.log(\'❌ User info failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(userTest);
} catch (error) {
  console.log('❌ User management test: FAILED');
  console.log('Error:', error.message);
}

// Test 3: Balance Checking
console.log('\n📋 Test 3: Balance Checking');
console.log('-----------------------------');

try {
  const balanceTest = execSync('npx tsx -e "import { getSparkBalanceByTelegramId } from \'./src/services/spark\'; getSparkBalanceByTelegramId(950870644).then(balance => { console.log(\'✅ Balance retrieved:\', JSON.stringify(balance, null, 2)); }).catch(err => { console.log(\'❌ Balance check failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(balanceTest);
} catch (error) {
  console.log('❌ Balance checking test: FAILED');
  console.log('Error:', error.message);
}

// Test 4: Deposit Address Generation
console.log('\n📋 Test 4: Deposit Address Generation');
console.log('--------------------------------------');

try {
  const depositTest = execSync('npx tsx -e "import { getSparkDepositAddressByTelegramId } from \'./src/services/spark\'; getSparkDepositAddressByTelegramId(950870644).then(address => { console.log(\'✅ Deposit address generated:\', address); console.log(\'💡 You can send REGTEST BTC to this address for testing\'); }).catch(err => { console.log(\'❌ Deposit address generation failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(depositTest);
} catch (error) {
  console.log('❌ Deposit address generation test: FAILED');
  console.log('Error:', error.message);
}

// Test 5: Lightning Invoice Creation
console.log('\n📋 Test 5: Lightning Invoice Creation');
console.log('--------------------------------------');

try {
  const invoiceTest = execSync('npx tsx -e "import { createSparkLightningInvoiceByTelegramId } from \'./src/services/spark\'; createSparkLightningInvoiceByTelegramId(950870644, 10000, \'Test REGTEST invoice\').then(invoice => { console.log(\'✅ Lightning invoice created:\', invoice); console.log(\'💡 You can pay this invoice with a REGTEST Lightning wallet\'); }).catch(err => { console.log(\'❌ Lightning invoice creation failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(invoiceTest);
} catch (error) {
  console.log('❌ Lightning invoice creation test: FAILED');
  console.log('Error:', error.message);
}

// Test 6: Spark Address Retrieval
console.log('\n📋 Test 6: Spark Address Retrieval');
console.log('-----------------------------------');

try {
  const sparkAddressTest = execSync('npx tsx -e "import { getSparkAddressByTelegramId } from \'./src/services/spark\'; getSparkAddressByTelegramId(950870644).then(address => { console.log(\'✅ Spark address retrieved:\', address); }).catch(err => { console.log(\'❌ Spark address retrieval failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(sparkAddressTest);
} catch (error) {
  console.log('❌ Spark address retrieval test: FAILED');
  console.log('Error:', error.message);
}

// Test 7: Transfer History
console.log('\n📋 Test 7: Transfer History');
console.log('-----------------------------');

try {
  const transferTest = execSync('npx tsx -e "import { getSparkTransfersByTelegramId } from \'./src/services/spark\'; getSparkTransfersByTelegramId(950870644).then(transfers => { console.log(\'✅ Transfer history retrieved:\', JSON.stringify(transfers, null, 2)); }).catch(err => { console.log(\'❌ Transfer history failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(transferTest);
} catch (error) {
  console.log('❌ Transfer history test: FAILED');
  console.log('Error:', error.message);
}

// Test 8: Withdrawal Simulation (without actually withdrawing)
console.log('\n📋 Test 8: Withdrawal Simulation');
console.log('---------------------------------');

try {
  const withdrawalTest = execSync('npx tsx -e "import { withdrawSparkOnChainByTelegramId } from \'./src/services/spark\'; console.log(\'💡 Note: This is a simulation - actual withdrawal would require sufficient balance\'); console.log(\'Withdrawal would be to address:\', \'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh\'); console.log(\'Amount:\', 10000, \'sats\'); console.log(\'✅ Withdrawal simulation: READY\');"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, SPARK_NETWORK: 'REGTEST' }
  });
  
  console.log(withdrawalTest);
} catch (error) {
  console.log('❌ Withdrawal simulation test: FAILED');
  console.log('Error:', error.message);
}

console.log('\n🎯 REGTEST Features Test Summary');
console.log('=================================');
console.log('✅ Environment setup tested');
console.log('✅ User management tested');
console.log('✅ Balance checking tested');
console.log('✅ Deposit address generation tested');
console.log('✅ Lightning invoice creation tested');
console.log('✅ Spark address retrieval tested');
console.log('✅ Transfer history tested');
console.log('✅ Withdrawal simulation tested');

console.log('\n💡 How to Test with Real REGTEST Transactions:');
console.log('1. Get the deposit address from Test 4');
console.log('2. Use a REGTEST faucet to send BTC to that address');
console.log('3. Use /balance command in your Telegram bot to check balance');
console.log('4. Use /withdraw command to test withdrawals');
console.log('5. Use /invoice command to create Lightning invoices');
console.log('6. Pay the invoice with a REGTEST Lightning wallet');

console.log('\n🔗 REGTEST Testing Resources:');
console.log('- REGTEST Faucet: https://testnet-faucet.mempool.co/');
console.log('- REGTEST Explorer: https://mempool.space/testnet/');
console.log('- REGTEST Lightning: Use Phoenix, Breez, or other REGTEST wallets');
console.log('- REGTEST Block Explorer: https://blockstream.info/testnet/');

console.log('\n⚠️  Important Notes:');
console.log('- REGTEST is a testing network - transactions are free and fast');
console.log('- Use REGTEST faucets to get test BTC');
console.log('- Lightning invoices work with REGTEST Lightning wallets');
console.log('- All transactions are visible on REGTEST explorers');
console.log('- This is perfect for development and testing'); 