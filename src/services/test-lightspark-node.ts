#!/usr/bin/env tsx

/**
 * Test script to investigate Lightspark node status and configuration
 * Run with: npx tsx src/services/test-lightspark-node.ts
 * 
 * This script will help us understand why createInvoice is failing
 * by checking the node status and configuration.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { 
  LightsparkClient, 
  CustomJwtAuthProvider, 
  InMemoryTokenStorage 
} from '@lightsparkdev/wallet-sdk';
import { generateLightsparkJWT } from './lightspark-jwt';

async function testLightsparkNode() {
  console.log('🔍 Investigating Lightspark Node Status...\n');

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
    console.log('✅ Login successful');
    console.log('');

    // Get current wallet
    console.log('3️⃣ Getting current wallet...');
    const currentWallet = await client.getCurrentWallet();
    if (!currentWallet) {
      throw new Error('No wallet found');
    }
    console.log('✅ Wallet found:', {
      id: currentWallet.id,
      status: currentWallet.status,
      type: currentWallet.typename
    });
    console.log('');

    // Get node ID from environment
    console.log('4️⃣ Checking node configuration...');
    const nodeId = process.env.LIGHTSPARK_NODE_ID;
    console.log('Node ID from environment:', nodeId);
    console.log('');

    // Try to get node information
    console.log('5️⃣ Attempting to get node information...');
    try {
      // Try different approaches to get node info
      console.log('   Trying to get node details...');
      
      // Check if there are any node-related methods on the client
      const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
      const nodeMethods = clientMethods.filter(method => method.toLowerCase().includes('node'));
      console.log('   Node-related methods on client:', nodeMethods);
      
      // Check if there are any node-related methods on the wallet
      const walletMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(currentWallet));
      const walletNodeMethods = walletMethods.filter(method => method.toLowerCase().includes('node'));
      console.log('   Node-related methods on wallet:', walletNodeMethods);
      
      // Try to access node properties on wallet
      console.log('   Checking wallet properties...');
      const walletKeys = Object.keys(currentWallet);
      console.log('   Wallet keys:', walletKeys);
      
      // Check if wallet has nodeId property
      if ((currentWallet as any).nodeId) {
        console.log('   ✅ Wallet has nodeId:', (currentWallet as any).nodeId);
      } else {
        console.log('   ❌ Wallet does not have nodeId property');
      }
      
    } catch (nodeError) {
      console.log('   ⚠️ Could not get node information:', nodeError instanceof Error ? nodeError.message : 'Unknown error');
    }
    console.log('');

    // Test createInvoice with different approaches
    console.log('6️⃣ Testing createInvoice with different approaches...');
    const testAmountMsats = 1000000; // 0.001 BTC
    
    // Approach 1: Using client.createInvoice with amount only
    console.log('   Approach 1: client.createInvoice(amountMsats)');
    try {
      const invoice1 = await client.createInvoice(testAmountMsats);
      console.log('   ✅ Success! Invoice created:', invoice1?.id || 'unknown');
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Approach 2: Using client.createInvoice with memo
    console.log('   Approach 2: client.createInvoice(amountMsats, memo)');
    try {
      const invoice2 = await client.createInvoice(testAmountMsats, 'Test invoice');
      console.log('   ✅ Success! Invoice created:', invoice2?.id || 'unknown');
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Approach 3: Using client.createInvoice with all parameters
    console.log('   Approach 3: client.createInvoice(amountMsats, memo, type, expiry)');
    try {
      const invoice3 = await client.createInvoice(testAmountMsats, 'Test invoice', undefined, 3600);
      console.log('   ✅ Success! Invoice created:', invoice3?.id || 'unknown');
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Approach 4: Try to use wallet.createInvoice if available
    console.log('   Approach 4: wallet.createInvoice(amountMsats)');
    try {
      if (typeof (currentWallet as any).createInvoice === 'function') {
        const invoice4 = await (currentWallet as any).createInvoice(testAmountMsats);
        console.log('   ✅ Success! Invoice created:', invoice4.id);
      } else {
        console.log('   ❌ Wallet does not have createInvoice method');
      }
    } catch (error) {
      console.log('   ❌ Failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    console.log('');

    // Check wallet dashboard for more details
    console.log('7️⃣ Getting wallet dashboard for more details...');
    try {
      const dashboard = await client.getWalletDashboard(10, 10);
      console.log('   Dashboard info:', {
        id: dashboard?.id,
        status: dashboard?.status,
        hasBalances: !!dashboard?.balances,
        hasTransactions: !!dashboard?.recentTransactions,
        hasPaymentRequests: !!dashboard?.paymentRequests,
        balanceKeys: dashboard?.balances ? Object.keys(dashboard.balances) : [],
        transactionCount: dashboard?.recentTransactions?.count || 0,
        paymentRequestCount: dashboard?.paymentRequests?.count || 0
      });
    } catch (error) {
      console.log('   ❌ Failed to get dashboard:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    console.log('🔍 Node investigation completed!');
    console.log('📝 Summary:');
    console.log('   - Wallet is deployed and accessible');
    console.log('   - Node ID is configured in environment');
    console.log('   - createInvoice is failing with "Something went wrong"');
    console.log('   - This suggests a permissions or configuration issue');
    
  } catch (error) {
    console.error('❌ Node investigation failed:', error);
    process.exit(1);
  }
}

// Run the test
testLightsparkNode().catch(console.error); 