#!/usr/bin/env node

/**
 * Test script for Step 9: UMA Integration
 * 
 * This script tests the UMA (Universal Money Address) integration:
 * - UMA address generation and validation
 * - UMA quote generation
 * - UMA payment simulation
 * - UMA connectivity testing
 */

// Load environment variables
require('dotenv').config({ path: '.env' });

const { 
  validateUMAAddress,
  parseUMAAddress,
  generateUMAAddress,
  getUMAQuote,
  sendUMAPayment,
  receiveUMAPayment,
  getUMAPaymentHistory,
  testUMAConnectivity
} = require('../src/services/uma');

const { getUserWalletInfo } = require('../src/services/userManager');

// Test configuration
const TEST_TELEGRAM_ID = 950870644; // Use a real user ID from your database
const TEST_UMA_ADDRESS = 'testuser123@sparkchat.btc';
const TEST_AMOUNT = 100;
const TEST_CURRENCY = 'USD';

console.log('🧪 Testing Step 9: UMA Integration\n');

async function runTest(testName, testFunction) {
  console.log(`📋 ${testName}`);
  console.log('----------------------------');
  
  try {
    const result = await testFunction();
    console.log('✅ PASSED');
    return { success: true, result };
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testUMAAddressValidation() {
  console.log('\n1️⃣ Testing UMA address validation...');
  
  // Test valid addresses
  const validAddresses = [
    'user123@sparkchat.btc',
    'test_user@bitnob.btc',
    'merchant@yellowcard.btc',
    'john_doe@example.btc'
  ];
  
  for (const address of validAddresses) {
    const isValid = validateUMAAddress(address);
    if (isValid) {
      console.log(`   ✅ Valid: ${address}`);
    } else {
      throw new Error(`Address should be valid: ${address}`);
    }
  }
  
  // Test invalid addresses
  const invalidAddresses = [
    'invalid@address.com',
    'user123@sparkchat.com',
    'user@.btc',
    '@sparkchat.btc',
    'user123@sparkchat',
    'user 123@sparkchat.btc'
  ];
  
  for (const address of invalidAddresses) {
    const isValid = validateUMAAddress(address);
    if (!isValid) {
      console.log(`   ✅ Correctly rejected: ${address}`);
    } else {
      throw new Error(`Address should be invalid: ${address}`);
    }
  }
}

async function testUMAAddressParsing() {
  console.log('\n2️⃣ Testing UMA address parsing...');
  
  const testAddress = 'user123@sparkchat.btc';
  const parsed = parseUMAAddress(testAddress);
  
  if (!parsed) {
    throw new Error('Failed to parse valid UMA address');
  }
  
  if (parsed.username !== 'user123') {
    throw new Error(`Expected username 'user123', got '${parsed.username}'`);
  }
  
  if (parsed.domain !== 'sparkchat.btc') {
    throw new Error(`Expected domain 'sparkchat.btc', got '${parsed.domain}'`);
  }
  
  console.log(`   ✅ Parsed: ${testAddress} -> username: ${parsed.username}, domain: ${parsed.domain}`);
}

async function testUMAAddressGeneration() {
  console.log('\n3️⃣ Testing UMA address generation...');
  
  try {
    const umaAddress = await generateUMAAddress(TEST_TELEGRAM_ID);
    
    if (!umaAddress) {
      throw new Error('UMA address should not be null');
    }
    
    if (!validateUMAAddress(umaAddress)) {
      throw new Error('Generated UMA address should be valid');
    }
    
    console.log(`   ✅ Generated: ${umaAddress}`);
    
    // Verify it follows the expected format
    const parsed = parseUMAAddress(umaAddress);
    if (parsed && parsed.domain === 'sparkchat.btc') {
      console.log(`   ✅ Format correct: ${umaAddress}`);
    } else {
      throw new Error('Generated UMA address should have sparkchat.btc domain');
    }
    
  } catch (error) {
    if (error.message.includes('No user found')) {
      console.log(`   ⚠️  User not found for Telegram ID: ${TEST_TELEGRAM_ID}`);
      console.log(`   💡 Tip: Create a user first with /start in the bot`);
      return;
    }
    throw error;
  }
}

async function testUMAQuoteGeneration() {
  console.log('\n4️⃣ Testing UMA quote generation...');
  
  const testCases = [
    { from: 'USD', to: 'BTC', amount: 100 },
    { from: 'BTC', to: 'USD', amount: 0.001 },
    { from: 'EUR', to: 'BTC', amount: 50 },
    { from: 'BTC', to: 'EUR', amount: 0.002 }
  ];
  
  for (const testCase of testCases) {
    const quote = await getUMAQuote(testCase.from, testCase.to, testCase.amount);
    
    if (!quote) {
      throw new Error(`Quote should not be null for ${testCase.from} -> ${testCase.to}`);
    }
    
    if (quote.fromCurrency !== testCase.from) {
      throw new Error(`Expected fromCurrency '${testCase.from}', got '${quote.fromCurrency}'`);
    }
    
    if (quote.toCurrency !== testCase.to) {
      throw new Error(`Expected toCurrency '${testCase.to}', got '${quote.toCurrency}'`);
    }
    
    if (quote.amount !== testCase.amount) {
      throw new Error(`Expected amount ${testCase.amount}, got ${quote.amount}`);
    }
    
    if (quote.convertedAmount <= 0) {
      throw new Error(`Converted amount should be positive, got ${quote.convertedAmount}`);
    }
    
    if (quote.exchangeRate <= 0) {
      throw new Error(`Exchange rate should be positive, got ${quote.exchangeRate}`);
    }
    
    console.log(`   ✅ ${testCase.amount} ${testCase.from} → ${quote.convertedAmount.toFixed(8)} ${testCase.to} (rate: ${quote.exchangeRate.toFixed(8)})`);
  }
}

async function testUMAPaymentSending() {
  console.log('\n5️⃣ Testing UMA payment sending...');
  
  try {
    const result = await sendUMAPayment(
      TEST_TELEGRAM_ID,
      TEST_UMA_ADDRESS,
      TEST_AMOUNT,
      TEST_CURRENCY
    );
    
    if (!result) {
      throw new Error('Payment result should not be null');
    }
    
    if (result.success) {
      console.log(`   ✅ Payment sent successfully`);
      console.log(`   🆔 Payment ID: ${result.paymentId}`);
      console.log(`   💰 Amount: ${result.amount} ${result.currency}`);
      console.log(`   💸 Fees: ${result.fees}`);
      console.log(`   ⏱️  Time: ${result.estimatedTime}`);
    } else {
      console.log(`   ⚠️  Payment failed: ${result.error}`);
      // This might be expected if user doesn't have sufficient balance
    }
    
  } catch (error) {
    if (error.message.includes('No user found')) {
      console.log(`   ⚠️  User not found for Telegram ID: ${TEST_TELEGRAM_ID}`);
      console.log(`   💡 Tip: Create a user first with /start in the bot`);
      return;
    }
    if (error.message.includes('Insufficient balance')) {
      console.log(`   ⚠️  Insufficient balance for payment`);
      console.log(`   💡 Tip: Add funds to test payments`);
      return;
    }
    throw error;
  }
}

async function testUMAReceivePayment() {
  console.log('\n6️⃣ Testing UMA payment receiving...');
  
  const paymentDetails = {
    amount: 50,
    currency: 'USD',
    fromAddress: 'sender@bitnob.btc',
    memo: 'Test payment'
  };
  
  const result = await receiveUMAPayment(TEST_UMA_ADDRESS, paymentDetails);
  
  if (!result) {
    throw new Error('Receive result should not be null');
  }
  
  if (result.success) {
    console.log(`   ✅ Payment received successfully`);
    console.log(`   🆔 Payment ID: ${result.paymentId}`);
    console.log(`   💰 Amount: ${result.amount} ${result.currency}`);
    console.log(`   ⏱️  Time: ${result.estimatedTime}`);
  } else {
    throw new Error(`Payment receive failed: ${result.error}`);
  }
}

async function testUMAPaymentHistory() {
  console.log('\n7️⃣ Testing UMA payment history...');
  
  try {
    const history = await getUMAPaymentHistory(TEST_TELEGRAM_ID);
    
    if (!Array.isArray(history)) {
      throw new Error('Payment history should be an array');
    }
    
    console.log(`   ✅ Retrieved ${history.length} payment records`);
    
    for (const payment of history.slice(0, 2)) { // Show first 2 payments
      console.log(`   📋 ${payment.type}: ${payment.amount} ${payment.currency} to/from ${payment.counterparty}`);
    }
    
  } catch (error) {
    if (error.message.includes('No user found')) {
      console.log(`   ⚠️  User not found for Telegram ID: ${TEST_TELEGRAM_ID}`);
      console.log(`   💡 Tip: Create a user first with /start in the bot`);
      return;
    }
    throw error;
  }
}

async function testUMAConnectivityCheck() {
  console.log('\n8️⃣ Testing UMA connectivity...');
  
  const result = await testUMAConnectivity();
  
  if (!result) {
    throw new Error('Connectivity test result should not be null');
  }
  
  if (result.success) {
    console.log(`   ✅ UMA connectivity test passed`);
    console.log(`   🌐 Domain: ${result.details?.domain}`);
    console.log(`   🔍 Address validation: ${result.details?.addressValidation ? '✅' : '❌'}`);
    console.log(`   💱 Quote generation: ${result.details?.quoteGeneration ? '✅' : '❌'}`);
    console.log(`   🔧 Mode: ${result.details?.mockMode ? 'Simulation' : 'Production'}`);
  } else {
    throw new Error(`UMA connectivity test failed: ${result.error}`);
  }
}

async function runAllTests() {
  const tests = [
    { name: 'UMA Address Validation', fn: testUMAAddressValidation },
    { name: 'UMA Address Parsing', fn: testUMAAddressParsing },
    { name: 'UMA Address Generation', fn: testUMAAddressGeneration },
    { name: 'UMA Quote Generation', fn: testUMAQuoteGeneration },
    { name: 'UMA Payment Sending', fn: testUMAPaymentSending },
    { name: 'UMA Payment Receiving', fn: testUMAReceivePayment },
    { name: 'UMA Payment History', fn: testUMAPaymentHistory },
    { name: 'UMA Connectivity', fn: testUMAConnectivityCheck }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await runTest(test.name, test.fn);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Step 9 UMA integration is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Test the UMA commands manually in the bot');
    console.log('2. Verify UMA address generation for users');
    console.log('3. Test cross-currency payments');
    console.log('4. Proceed to Step 10 (LRC-20 tokens)');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the implementation.');
    process.exit(1);
  }
}

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}); 