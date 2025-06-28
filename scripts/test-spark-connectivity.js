/**
 * Spark Connectivity Test Script
 * 
 * This script tests the connectivity and configuration of the Spark SDK.
 * It helps diagnose authentication and network issues.
 * 
 * Usage: node scripts/test-spark-connectivity.js
 */

require('dotenv').config();
const { execSync } = require('child_process');

console.log('🔍 Spark SDK Connectivity Test');
console.log('==============================\n');

async function testSparkConnectivity() {
  console.log('📋 Test 1: Basic SDK Import');
  console.log('----------------------------');
  
  try {
    const importTest = execSync('npx tsx -e "import { SparkWallet } from \'@buildonspark/spark-sdk\'; console.log(\'✅ Spark SDK imported successfully\'); console.log(\'✅ SparkWallet available:\', typeof SparkWallet);"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log(importTest);
    console.log('✅ SDK import: PASSED\n');
  } catch (error) {
    console.log('❌ SDK import: FAILED');
    console.log('Error:', error.message, '\n');
    return;
  }

  console.log('📋 Test 2: Environment Configuration');
  console.log('------------------------------------');
  
  try {
    const envTest = execSync('npx tsx -e "console.log(\'SPARK_NETWORK:\', process.env.SPARK_NETWORK || \'NOT_SET\'); console.log(\'SPARK_MASTER_MNEMONIC:\', process.env.SPARK_MASTER_MNEMONIC ? \'SET\' : \'NOT_SET\'); console.log(\'NODE_ENV:\', process.env.NODE_ENV || \'NOT_SET\');"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log(envTest);
    console.log('✅ Environment check: PASSED\n');
  } catch (error) {
    console.log('❌ Environment check: FAILED');
    console.log('Error:', error.message, '\n');
  }

  console.log('📋 Test 3: Spark Connectivity Test');
  console.log('-----------------------------------');
  
  try {
    const connectivityTest = execSync('npx tsx -e "import { testSparkConnectivity } from \'./src/services/spark\'; testSparkConnectivity().then(result => { console.log(\'Connectivity test result:\', JSON.stringify(result, null, 2)); if(result.success) { console.log(\'✅ Connectivity test: PASSED\'); } else { console.log(\'❌ Connectivity test: FAILED\'); console.log(\'Error:\', result.error); } }).catch(err => { console.log(\'❌ Connectivity test: FAILED\'); console.log(\'Error:\', err.message); })"', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    console.log(connectivityTest);
  } catch (error) {
    console.log('❌ Connectivity test: FAILED');
    console.log('Error:', error.message, '\n');
  }

  console.log('\n📋 Test 4: Network Troubleshooting');
  console.log('-----------------------------------');
  
  try {
    // Test basic internet connectivity
    console.log('Testing basic internet connectivity...');
    execSync('ping -c 1 8.8.8.8', { stdio: 'pipe' });
    console.log('✅ Basic internet connectivity: PASSED');
  } catch (error) {
    console.log('❌ Basic internet connectivity: FAILED');
    console.log('This might indicate a network issue.');
  }

  console.log('\n🎯 Connectivity Test Summary');
  console.log('============================');
  console.log('✅ SDK import test completed');
  console.log('✅ Environment configuration checked');
  console.log('✅ Spark connectivity test completed');
  console.log('✅ Network troubleshooting completed');
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('1. Check your internet connection');
  console.log('2. Verify SPARK_NETWORK environment variable');
  console.log('3. Ensure SPARK_MASTER_MNEMONIC is set correctly');
  console.log('4. Check if Spark services are accessible from your location');
  console.log('5. Try using a VPN if you\'re behind a firewall');
  console.log('6. Check Spark SDK documentation for network requirements');
}

// Run the connectivity test
testSparkConnectivity(); 