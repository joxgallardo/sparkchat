'use server';

/**
 * Test script to investigate createInvoice issue
 */

import { 
  LightsparkClient, 
  CustomJwtAuthProvider, 
  InMemoryTokenStorage,
  InvoiceType
} from '@lightsparkdev/wallet-sdk';
import { generateLightsparkJWT } from './lightspark-jwt';

async function testCreateInvoice() {
  console.log('🔍 Testing createInvoice with different approaches...\n');

  try {
    // Initialize client
    console.log('1️⃣ Initializing Lightspark client...');
    const tokenStorage = new InMemoryTokenStorage();
    const authProvider = new CustomJwtAuthProvider(tokenStorage);
    const client = new LightsparkClient(authProvider);
    
    // Login
    console.log('2️⃣ Logging in with JWT...');
    const accountId = process.env.LIGHTSPARK_ACCOUNT_ID!;
    const jwtToken = generateLightsparkJWT();
    await client.loginWithJWT(accountId, jwtToken, tokenStorage);
    console.log('✅ Login successful\n');

    // Get current wallet
    console.log('3️⃣ Getting current wallet...');
    const currentWallet = await client.getCurrentWallet();
    console.log('✅ Wallet found:', {
      id: currentWallet?.id,
      status: currentWallet?.status,
      type: currentWallet?.typename
    });

    // Check if wallet is unlocked
    console.log('4️⃣ Checking wallet unlock status...');
    const isUnlocked = client.isWalletUnlocked();
    console.log('✅ Wallet unlocked:', isUnlocked);

    // Test amount
    const testAmountMsats = 10000000; // 0.0001 BTC

    console.log('\n5️⃣ Testing createInvoice with different approaches...');

    // Approach 1: Basic createInvoice
    console.log('\n   Approach 1: Basic createInvoice');
    try {
      const invoice1 = await client.createInvoice(testAmountMsats);
      console.log('   ✅ Success:', invoice1?.id);
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }

    // Approach 2: With memo
    console.log('\n   Approach 2: createInvoice with memo');
    try {
      const invoice2 = await client.createInvoice(testAmountMsats, 'Test invoice');
      console.log('   ✅ Success:', invoice2?.id);
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }

    // Approach 3: With InvoiceType.STANDARD
    console.log('\n   Approach 3: createInvoice with InvoiceType.STANDARD');
    try {
      const invoice3 = await client.createInvoice(testAmountMsats, 'Test invoice', InvoiceType.STANDARD);
      console.log('   ✅ Success:', invoice3?.id);
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }

    // Approach 4: With InvoiceType.AMP
    console.log('\n   Approach 4: createInvoice with InvoiceType.AMP');
    try {
      const invoice4 = await client.createInvoice(testAmountMsats, 'Test invoice', InvoiceType.AMP);
      console.log('   ✅ Success:', invoice4?.id);
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }

    // Approach 5: Test mode invoice
    console.log('\n   Approach 5: createTestModeInvoice');
    try {
      const testInvoice = await client.createTestModeInvoice(testAmountMsats, 'Test mode invoice');
      console.log('   ✅ Success:', testInvoice);
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : error);
    }

    // Approach 6: Try with different amounts
    console.log('\n   Approach 6: createInvoice with different amounts');
    const amounts = [1000, 10000, 100000, 1000000]; // Different amounts in msats
    for (const amount of amounts) {
      try {
        const invoice = await client.createInvoice(amount, `Test ${amount} msats`);
        console.log(`   ✅ Success with ${amount} msats:`, invoice?.id);
        break; // If one works, we found the issue
      } catch (error) {
        console.log(`   ❌ Failed with ${amount} msats:`, error instanceof Error ? error.message : error);
      }
    }

    // Approach 7: Check if we need to deploy wallet first
    console.log('\n   Approach 7: Checking wallet deployment...');
    if (currentWallet?.status === 'NOT_SETUP') {
      console.log('   🔧 Wallet not setup, trying to deploy...');
      try {
        const deploymentResult = await client.deployWalletAndAwaitDeployed();
        console.log('   ✅ Deployment result:', deploymentResult);
      } catch (error) {
        console.log('   ❌ Deployment failed:', error instanceof Error ? error.message : error);
      }
    } else {
      console.log('   ✅ Wallet is already deployed');
    }

    console.log('\n🎯 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCreateInvoice(); 