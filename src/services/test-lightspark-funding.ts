#!/usr/bin/env tsx

/**
 * Test script for Lightspark real funding functionality
 * Run with: npx tsx src/services/test-lightspark-funding.ts
 */

// Load environment variables
import 'dotenv/config';
import { config } from 'dotenv';
config({ path: '.env.local' });

import { fundWalletWithRealBTC } from './lightspark';
import { 
  LightsparkClient, 
  CustomJwtAuthProvider, 
  InMemoryTokenStorage 
} from '@lightsparkdev/wallet-sdk';
import { generateLightsparkJWT } from './lightspark-jwt';

async function investigateFundingMethods() {
  console.log('🔍 Investigating Lightspark Funding Methods...\n');

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

    // Investigate client methods
    console.log('4️⃣ Investigating client methods...');
    const clientMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(client));
    const fundingMethods = clientMethods.filter(method => 
      method.toLowerCase().includes('fund') || 
      method.toLowerCase().includes('address') || 
      method.toLowerCase().includes('wallet') ||
      method.toLowerCase().includes('node')
    );
    console.log('   Funding-related methods on client:', fundingMethods);
    console.log('');

    // Investigate wallet methods
    console.log('5️⃣ Investigating wallet methods...');
    const walletMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(currentWallet));
    const walletFundingMethods = walletMethods.filter(method => 
      method.toLowerCase().includes('fund') || 
      method.toLowerCase().includes('address') || 
      method.toLowerCase().includes('wallet') ||
      method.toLowerCase().includes('node')
    );
    console.log('   Funding-related methods on wallet:', walletFundingMethods);
    console.log('');

    // Check wallet properties
    console.log('6️⃣ Checking wallet properties...');
    const walletKeys = Object.keys(currentWallet);
    const fundingProperties = walletKeys.filter(key => 
      key.toLowerCase().includes('address') || 
      key.toLowerCase().includes('bitcoin') ||
      key.toLowerCase().includes('fund')
    );
    console.log('   Funding-related properties on wallet:', fundingProperties);
    console.log('');

    // Try to access specific properties
    console.log('7️⃣ Checking specific properties...');
    if ((currentWallet as any).bitcoinAddress) {
      console.log('   ✅ Wallet has bitcoinAddress:', (currentWallet as any).bitcoinAddress);
    } else {
      console.log('   ❌ Wallet does not have bitcoinAddress property');
    }

    if ((currentWallet as any).address) {
      console.log('   ✅ Wallet has address:', (currentWallet as any).address);
    } else {
      console.log('   ❌ Wallet does not have address property');
    }

    if ((currentWallet as any).nodeId) {
      console.log('   ✅ Wallet has nodeId:', (currentWallet as any).nodeId);
    } else {
      console.log('   ❌ Wallet does not have nodeId property');
    }
    console.log('');

    // Check dashboard for addresses
    console.log('8️⃣ Checking dashboard for addresses...');
    try {
      const dashboard = await client.getWalletDashboard(10, 10);
      if (dashboard) {
        const dashboardKeys = Object.keys(dashboard);
        const dashboardFundingKeys = dashboardKeys.filter(key => 
          key.toLowerCase().includes('address') || 
          key.toLowerCase().includes('bitcoin') ||
          key.toLowerCase().includes('fund')
        );
        console.log('   Funding-related properties on dashboard:', dashboardFundingKeys);
        
        if ((dashboard as any).bitcoinAddress) {
          console.log('   ✅ Dashboard has bitcoinAddress:', (dashboard as any).bitcoinAddress);
        } else {
          console.log('   ❌ Dashboard does not have bitcoinAddress property');
        }
      } else {
        console.log('   ❌ Dashboard is null');
      }
    } catch (error) {
      console.log('   ❌ Could not get dashboard:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    console.log('🔍 Funding investigation completed!');
    console.log('📝 Summary:');
    console.log('   - Client methods available:', fundingMethods.length);
    console.log('   - Wallet methods available:', walletFundingMethods.length);
    console.log('   - Wallet properties available:', fundingProperties.length);
    
  } catch (error) {
    console.error('❌ Funding investigation failed:', error);
  }
}

async function testLightsparkFunding() {
  console.log('🧪 Testing Lightspark Real Funding...\n');

  try {
    // First, investigate available methods
    await investigateFundingMethods();
    
    console.log('\n' + '='.repeat(50) + '\n');

    // Test 1: Try to fund with 0.1 BTC
    console.log('1️⃣ Testing fundWalletWithRealBTC with 0.1 BTC...');
    try {
      const result = await fundWalletWithRealBTC('test-user-123', 0.1);
      
      console.log('✅ Funding test completed successfully!');
      console.log('📋 Result:', {
        success: result.success,
        message: result.message,
        newBalance: result.newBalance,
        fundingMethod: result.fundingMethod,
        hasFundingAddress: !!result.fundingAddress
      });
      
      if (result.fundingAddress) {
        console.log('📍 Funding address:', result.fundingAddress);
      }
      
    } catch (error) {
      console.log('❌ Funding test failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    // Test 2: Try to fund with 1 BTC
    console.log('2️⃣ Testing fundWalletWithRealBTC with 1 BTC...');
    try {
      const result = await fundWalletWithRealBTC('test-user-123', 1);
      
      console.log('✅ Funding test completed successfully!');
      console.log('📋 Result:', {
        success: result.success,
        message: result.message,
        newBalance: result.newBalance,
        fundingMethod: result.fundingMethod,
        hasFundingAddress: !!result.fundingAddress
      });
      
      if (result.fundingAddress) {
        console.log('📍 Funding address:', result.fundingAddress);
      }
      
    } catch (error) {
      console.log('❌ Funding test failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    console.log('🎉 Real funding testing completed!');
    console.log('\n📝 Summary:');
    console.log('   - If fundNode method is available in testnet, it will be used for instant funding');
    console.log('   - If fundNode is not available, a funding address will be generated');
    console.log('   - The funding address can be used to send real BTC (testnet) to the wallet');
    
  } catch (error) {
    console.error('❌ Real funding test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLightsparkFunding(); 