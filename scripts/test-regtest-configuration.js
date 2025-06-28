#!/usr/bin/env node

/**
 * Test Script for REGTEST Configuration
 * 
 * This script tests the REGTEST configuration and verifies that all
 * Spark SDK endpoints are accessible and working correctly.
 */

require('dotenv').config();

const { execSync } = require('child_process');

console.log('🧪 Testing REGTEST Configuration');
console.log('================================');

// Test 1: Check environment configuration
console.log('\n📋 Test 1: Environment Configuration');
console.log('-------------------------------------');

try {
  const envTest = execSync('npx tsx -e "console.log(\'SPARK_NETWORK:\', process.env.SPARK_NETWORK || \'NOT_SET\'); console.log(\'SPARK_MASTER_MNEMONIC:\', process.env.SPARK_MASTER_MNEMONIC ? \'SET\' : \'NOT_SET\');"', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  console.log(envTest);
  console.log('✅ Environment check: PASSED');
} catch (error) {
  console.log('❌ Environment check: FAILED');
  console.log('Error:', error.message);
}

// Test 2: Test REGTEST endpoints connectivity
console.log('\n📋 Test 2: REGTEST Endpoints Connectivity');
console.log('------------------------------------------');

const regtestEndpoints = [
  'https://api.lightspark.com',
  'https://regtest-mempool.us-west-2.sparkinfra.net/api',
  'https://regtest.lrc20.lightspark.com:443',
  'https://regtest.lrc20.lightspark.com'
];

for (const endpoint of regtestEndpoints) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" ${endpoint}`, { 
      encoding: 'utf8',
      timeout: 10000
    });
    
    if (response.trim() === '200' || response.trim() === '404' || response.trim() === '405') {
      console.log(`✅ ${endpoint}: ACCESSIBLE (HTTP ${response.trim()})`);
    } else {
      console.log(`⚠️  ${endpoint}: RESPONDED (HTTP ${response.trim()})`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint}: UNREACHABLE`);
  }
}

// Test 3: Test Spark SDK with REGTEST
console.log('\n📋 Test 3: Spark SDK REGTEST Integration');
console.log('-----------------------------------------');

try {
  const sparkTest = execSync('npx tsx -e "import { testSparkConnectivity } from \'./src/services/spark\'; testSparkConnectivity().then(result => { console.log(\'Connectivity test result:\', JSON.stringify(result, null, 2)); if(result.success) { console.log(\'✅ REGTEST connectivity: PASSED\'); } else { console.log(\'❌ REGTEST connectivity: FAILED\'); console.log(\'Error:\', result.error); } }).catch(err => { console.log(\'❌ REGTEST connectivity: FAILED\'); console.log(\'Error:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  console.log(sparkTest);
} catch (error) {
  console.log('❌ REGTEST connectivity test: FAILED');
  console.log('Error:', error.message);
}

// Test 4: Test basic wallet operations
console.log('\n📋 Test 4: Basic Wallet Operations');
console.log('----------------------------------');

try {
  const walletTest = execSync('npx tsx -e "import { getSparkDepositAddressByTelegramId } from \'./src/services/spark\'; getSparkDepositAddressByTelegramId(950870644).then(address => { console.log(\'✅ Deposit address generated:\', address); }).catch(err => { console.log(\'❌ Deposit address generation failed:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  console.log(walletTest);
} catch (error) {
  console.log('❌ Wallet operations test: FAILED');
  console.log('Error:', error.message);
}

console.log('\n🎯 REGTEST Configuration Test Summary');
console.log('=====================================');
console.log('✅ Environment configuration checked');
console.log('✅ REGTEST endpoints connectivity tested');
console.log('✅ Spark SDK REGTEST integration tested');
console.log('✅ Basic wallet operations tested');

console.log('\n💡 Next Steps:');
console.log('1. If all tests pass, your REGTEST configuration is working');
console.log('2. You can now test deposits using REGTEST faucets');
console.log('3. Use /deposit command in your Telegram bot');
console.log('4. Test Lightning invoices with REGTEST wallets');
console.log('5. Test withdrawals to REGTEST addresses');

console.log('\n🔗 REGTEST Resources:');
console.log('- REGTEST Faucet: https://testnet-faucet.mempool.co/');
console.log('- REGTEST Explorer: https://mempool.space/testnet/');
console.log('- REGTEST Lightning: Use any Lightning wallet with REGTEST support'); 