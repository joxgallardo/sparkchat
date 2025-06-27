#!/usr/bin/env tsx

/**
 * Test script for Lightspark REST API
 * Run with: npx tsx src/services/test-lightspark-rest-api.ts
 * 
 * This script tests the REST API approach for creating invoices
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { 
  createInvoiceViaRestAPI,
  getNodeStatusViaRestAPI
} from './lightspark-rest-api';

async function testLightsparkRestAPI() {
  console.log('🧪 Testing Lightspark REST API...\n');

  try {
    // Test 1: Get node status
    console.log('1️⃣ Testing getNodeStatusViaRestAPI...');
    try {
      const nodes = await getNodeStatusViaRestAPI();
      console.log('✅ Node status retrieved successfully');
      console.log('📋 Nodes found:', nodes.length);
      nodes.forEach((node: any, index: number) => {
        console.log(`   ${index + 1}. ${node.typename}: ${node.id} (${node.status})`);
      });
    } catch (error) {
      console.log('❌ Failed to get node status:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    // Test 2: Create invoice via REST API
    console.log('2️⃣ Testing createInvoiceViaRestAPI...');
    try {
      const invoice = await createInvoiceViaRestAPI({
        amountMsats: 1000000, // 0.001 BTC
        memo: 'Test invoice via REST API',
        expirySecs: 3600 // 1 hour
      });
      
      console.log('✅ Invoice created successfully via REST API!');
      console.log('📋 Invoice details:', {
        id: invoice.id,
        status: invoice.status,
        encodedPaymentRequest: invoice.data.encodedPaymentRequest.substring(0, 50) + '...',
        bitcoinAddress: invoice.data.bitcoinAddress,
        createdAt: invoice.createdAt
      });
      
    } catch (error) {
      console.log('❌ Failed to create invoice via REST API:', error instanceof Error ? error.message : 'Unknown error');
    }
    console.log('');

    console.log('🎉 REST API testing completed!');
    
  } catch (error) {
    console.error('❌ REST API test failed:', error);
    process.exit(1);
  }
}

// Run the test
testLightsparkRestAPI().catch(console.error); 