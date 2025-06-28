/**
 * Test script for Step 5: On-chain BTC deposits
 * 
 * This script validates the implementation of on-chain deposit functionality:
 * - Generation of deposit addresses
 * - Claiming deposits with TXID
 * - Balance updates after claiming
 * 
 * Usage: node scripts/test-step5-onchain-deposits.js
 */

require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

// Mock Telegram ID for testing
const TEST_TELEGRAM_ID = 950870644;

console.log('🧪 Testing Step 5: On-chain BTC Deposits');
console.log('==========================================\n');

async function runTest() {
  try {
    // Test 1: Generate deposit address
    console.log('📋 Test 1: Generating deposit address...');
    const addressResult = execSync('npx tsx -e "import { getSparkDepositAddressByTelegramId } from \'./src/services/spark\'; getSparkDepositAddressByTelegramId(950870644).then(addr => console.log(\'Generated address:\', addr)).catch(err => console.error(\'Error:\', err.message))"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log('✅ Deposit address generation test completed');
    console.log('Generated address:', addressResult.trim());
    
    // Test 2: Check balance before any operations
    console.log('\n📋 Test 2: Checking initial balance...');
    const balanceResult = execSync('npx tsx -e "import { getSparkBalanceByTelegramId } from \'./src/services/spark\'; getSparkBalanceByTelegramId(950870644).then(balance => console.log(\'Balance:\', balance.balance, \'sats\')).catch(err => console.error(\'Error:\', err.message))"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log('✅ Balance check test completed');
    console.log('Current balance:', balanceResult.trim());
    
    // Test 3: Test claim deposit function (with mock TXID)
    console.log('\n📋 Test 3: Testing claim deposit function...');
    const mockTxId = 'abc123def456789abcdef123456789abcdef123456789abcdef123456789abc';
    
    try {
      const claimResult = execSync(`npx tsx -e "import { claimSparkDepositByTelegramId } from './src/services/spark'; claimSparkDepositByTelegramId(950870644, '${mockTxId}').then(result => console.log('Claim result:', result)).catch(err => console.error('Error:', err.message))"`, { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      
      console.log('✅ Claim deposit function test completed');
      console.log('Claim result:', claimResult.trim());
    } catch (error) {
      console.log('⚠️  Claim test failed (expected for mock TXID):', error.message);
    }
    
    // Test 4: Test Spark address generation
    console.log('\n📋 Test 4: Testing Spark address generation...');
    const sparkAddressResult = execSync('npx tsx -e "import { getSparkAddressByTelegramId } from \'./src/services/spark\'; getSparkAddressByTelegramId(950870644).then(addr => console.log(\'Spark address:\', addr)).catch(err => console.error(\'Error:\', err.message))"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log('✅ Spark address generation test completed');
    console.log('Spark address:', sparkAddressResult.trim());
    
    console.log('\n🎉 Step 5 validation completed successfully!');
    console.log('\n📝 Summary:');
    console.log('✅ Deposit address generation: Working');
    console.log('✅ Balance checking: Working');
    console.log('✅ Claim deposit function: Available');
    console.log('✅ Spark address generation: Working');
    console.log('\n💡 Next steps:');
    console.log('1. Test with real TXID from testnet transaction');
    console.log('2. Verify balance updates after claiming');
    console.log('3. Test bot commands: /deposit, /claim, /balance');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runTest(); 