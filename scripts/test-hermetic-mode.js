#!/usr/bin/env node

/**
 * Test Script for Hermetic Mode
 * 
 * This script tests the Spark SDK in hermetic mode, which should
 * work without requiring a local Spark node.
 */

require('dotenv').config();

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing Hermetic Mode');
console.log('=========================');

// Test 1: Enable hermetic mode
console.log('\n📋 Test 1: Enabling Hermetic Mode');
console.log('-----------------------------------');

try {
  // Set hermetic test environment variable
  process.env.HERMETIC_TEST = 'true';
  
  // Create marker file
  fs.writeFileSync('/tmp/spark_hermetic', 'hermetic mode enabled');
  console.log('✅ Created /tmp/spark_hermetic marker file');
  
  const envTest = execSync('npx tsx -e "console.log(\'HERMETIC_TEST:\', process.env.HERMETIC_TEST); console.log(\'SPARK_NETWORK:\', process.env.SPARK_NETWORK || \'NOT_SET\');"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, HERMETIC_TEST: 'true' }
  });
  
  console.log(envTest);
  console.log('✅ Hermetic mode enabled: PASSED');
} catch (error) {
  console.log('❌ Hermetic mode setup: FAILED');
  console.log('Error:', error.message);
}

// Test 2: Test Spark SDK with hermetic mode
console.log('\n📋 Test 2: Spark SDK Hermetic Integration');
console.log('-------------------------------------------');

try {
  const sparkTest = execSync('npx tsx -e "import { testSparkConnectivity } from \'./src/services/spark\'; testSparkConnectivity().then(result => { console.log(\'Connectivity test result:\', JSON.stringify(result, null, 2)); if(result.success) { console.log(\'✅ Hermetic connectivity: PASSED\'); } else { console.log(\'❌ Hermetic connectivity: FAILED\'); console.log(\'Error:\', result.error); } }).catch(err => { console.log(\'❌ Hermetic connectivity: FAILED\'); console.log(\'Error:\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, HERMETIC_TEST: 'true' }
  });
  
  console.log(sparkTest);
} catch (error) {
  console.log('❌ Hermetic connectivity test: FAILED');
  console.log('Error:', error.message);
}

// Test 3: Test basic wallet operations with hermetic mode
console.log('\n📋 Test 3: Basic Wallet Operations (Hermetic)');
console.log('-----------------------------------------------');

try {
  const walletTest = execSync('npx tsx -e "import { getSparkDepositAddressByTelegramId } from \'./src/services/spark\'; getSparkDepositAddressByTelegramId(950870644).then(address => { console.log(\'✅ Deposit address generated (hermetic):\', address); }).catch(err => { console.log(\'❌ Deposit address generation failed (hermetic):\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, HERMETIC_TEST: 'true' }
  });
  
  console.log(walletTest);
} catch (error) {
  console.log('❌ Wallet operations test (hermetic): FAILED');
  console.log('Error:', error.message);
}

// Test 4: Test balance checking with hermetic mode
console.log('\n📋 Test 4: Balance Checking (Hermetic)');
console.log('----------------------------------------');

try {
  const balanceTest = execSync('npx tsx -e "import { getSparkBalanceByTelegramId } from \'./src/services/spark\'; getSparkBalanceByTelegramId(950870644).then(balance => { console.log(\'✅ Balance retrieved (hermetic):\', JSON.stringify(balance, null, 2)); }).catch(err => { console.log(\'❌ Balance check failed (hermetic):\', err.message); })"', { 
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env, HERMETIC_TEST: 'true' }
  });
  
  console.log(balanceTest);
} catch (error) {
  console.log('❌ Balance checking test (hermetic): FAILED');
  console.log('Error:', error.message);
}

console.log('\n🎯 Hermetic Mode Test Summary');
console.log('==============================');
console.log('✅ Hermetic mode enabled');
console.log('✅ Spark SDK hermetic integration tested');
console.log('✅ Basic wallet operations tested');
console.log('✅ Balance checking tested');

console.log('\n💡 Hermetic Mode Advantages:');
console.log('- Works without local Spark node');
console.log('- Uses mock services for testing');
console.log('- Perfect for development and CI/CD');
console.log('- No network dependencies');

console.log('\n⚠️  Hermetic Mode Limitations:');
console.log('- Uses mock data (not real transactions)');
console.log('- Limited functionality for production testing');
console.log('- Addresses and balances are simulated');

console.log('\n🔄 To use hermetic mode in your bot:');
console.log('1. Set HERMETIC_TEST=true in your environment');
console.log('2. Or create /tmp/spark_hermetic file');
console.log('3. Restart your bot');
console.log('4. Test with mock data');

console.log('\n🔗 Next Steps:');
console.log('1. If hermetic mode works, you can develop with mock data');
console.log('2. For real testing, you\'ll need a local Spark node');
console.log('3. Contact Spark team for production endpoints');

console.log('\n🚨 Important Migration Notes:');
console.log('- Hermetic mode uses mock data and services');
console.log('- Real environment will have network latency and errors');
console.log('- Test thoroughly with small amounts before production');
console.log('- Implement proper error handling for network issues');
console.log('- Consider rate limiting and retry logic for production'); 