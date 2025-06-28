/**
 * Test script to verify Step 7 Lightning deposits with TESTNET configuration
 * This script tests that the bot generates proper testnet addresses
 */

import { testSparkConnectivity, getSparkDepositAddressByTelegramId } from '../src/services/spark';

async function testTestnetConfiguration() {
  console.log('🧪 Testing Step 7: Lightning deposits with TESTNET configuration\n');

  try {
    // Test 1: Verify Spark SDK connectivity with testnet
    console.log('1️⃣ Testing Spark SDK connectivity...');
    const connectivityResult = await testSparkConnectivity();
    
    if (connectivityResult.success) {
      console.log('✅ Spark SDK connectivity test passed');
      console.log(`   Network: ${connectivityResult.details.network}`);
      console.log(`   Balance: ${connectivityResult.details.balance.balance} sats`);
    } else {
      console.log('❌ Spark SDK connectivity test failed');
      console.log(`   Error: ${connectivityResult.error}`);
      console.log(`   Details: ${JSON.stringify(connectivityResult.details, null, 2)}`);
      return;
    }

    // Test 2: Generate deposit address for test user
    console.log('\n2️⃣ Testing deposit address generation...');
    const testTelegramId = 950870644; // Your Telegram ID
    
    try {
      const depositAddress = await getSparkDepositAddressByTelegramId(testTelegramId);
      console.log('✅ Deposit address generated successfully');
      console.log(`   Address: ${depositAddress}`);
      
      // Verify it's a testnet address
      if (depositAddress.startsWith('tb1p') || depositAddress.startsWith('tb1q') || depositAddress.startsWith('tb1')) {
        console.log('✅ Address is a valid Bitcoin testnet address');
        console.log('   This address should work with Bitcoin testnet faucets');
      } else if (depositAddress.startsWith('bcrt1')) {
        console.log('❌ Address is still a regtest address');
        console.log('   This address will not work with testnet faucets');
      } else {
        console.log('⚠️  Unknown address format');
        console.log(`   Address starts with: ${depositAddress.substring(0, 4)}`);
      }
      
    } catch (error) {
      console.log('❌ Failed to generate deposit address');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🎉 Test completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. If the address starts with "tb1", you can use it with Bitcoin testnet faucets');
    console.log('   2. If the address starts with "bcrt1", the network configuration needs to be fixed');
    console.log('   3. Try the /deposit command in Telegram to get a new address');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testTestnetConfiguration().catch(console.error); 