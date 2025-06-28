#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

/**
 * @fileOverview Test script for rate limiting middleware
 * 
 * This script tests the rate limiting functionality by simulating:
 * - Message rate limits
 * - Command rate limits  
 * - Financial operation rate limits
 * - Cooldown periods
 * - Rate limit statistics
 */

const { 
  rateLimitMiddleware, 
  getUserRateLimitStats, 
  clearUserRateLimit, 
  getAllRateLimitStats,
  DEFAULT_RATE_LIMIT_CONFIG 
} = require('../src/bot/middleware/rateLimit');

// Mock Telegram message for testing
function createMockMessage(telegramId, text) {
  return {
    from: { id: telegramId },
    text: text,
    chat: { id: 123456789 }
  };
}

// Test configuration
const TEST_TELEGRAM_ID = 950870644;

console.log('🚀 Testing Rate Limiting Middleware');
console.log('====================================');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

function logTestResult(testName, success, error = null) {
  if (success) {
    console.log(`✅ ${testName}: PASSED`);
    testResults.passed++;
  } else {
    console.log(`❌ ${testName}: FAILED`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
      testResults.errors.push({ test: testName, error: error.message || error });
    }
    testResults.failed++;
  }
}

// ============================================================================
// TEST 1: Basic Message Rate Limiting
// ============================================================================

async function testBasicMessageRateLimiting() {
  console.log('\n📝 Test 1: Basic Message Rate Limiting');
  console.log('=======================================');
  
  try {
    // Clear any existing rate limit data
    clearUserRateLimit(TEST_TELEGRAM_ID);
    
    // Test 1.1: Normal message should be allowed
    console.log('\n1.1️⃣ Testing normal message...');
    const normalMessage = createMockMessage(TEST_TELEGRAM_ID, 'Hello bot!');
    const result1 = await rateLimitMiddleware(normalMessage);
    
    if (result1.allowed) {
      logTestResult('Normal Message Allowed', true);
    } else {
      throw new Error(`Normal message was blocked: ${result1.reason}`);
    }
    
    // Test 1.2: Multiple messages within limit
    console.log('\n1.2️⃣ Testing multiple messages within limit...');
    let blockedCount = 0;
    
    for (let i = 0; i < 25; i++) { // Should be within 30 messages per minute limit
      const message = createMockMessage(TEST_TELEGRAM_ID, `Message ${i + 1}`);
      const result = await rateLimitMiddleware(message);
      
      if (!result.allowed) {
        blockedCount++;
      }
    }
    
    if (blockedCount === 0) {
      logTestResult('Multiple Messages Within Limit', true);
      console.log(`   All ${25} messages were allowed`);
    } else {
      throw new Error(`${blockedCount} messages were unexpectedly blocked`);
    }
    
    // Test 1.3: Exceed message rate limit
    console.log('\n1.3️⃣ Testing message rate limit exceeded...');
    let rateLimitHit = false;
    
    for (let i = 0; i < 35; i++) { // Should exceed 30 messages per minute limit
      const message = createMockMessage(TEST_TELEGRAM_ID, `Message ${i + 1}`);
      const result = await rateLimitMiddleware(message);
      
      if (!result.allowed && result.reason.includes('Too many messages')) {
        rateLimitHit = true;
        console.log(`   Rate limit hit at message ${i + 1}: ${result.reason}`);
        break;
      }
    }
    
    if (rateLimitHit) {
      logTestResult('Message Rate Limit Enforcement', true);
    } else {
      throw new Error('Message rate limit was not enforced');
    }
    
  } catch (error) {
    logTestResult('Basic Message Rate Limiting', false, error);
  }
}

// ============================================================================
// TEST 2: Command Rate Limiting
// ============================================================================

async function testCommandRateLimiting() {
  console.log('\n⚡ Test 2: Command Rate Limiting');
  console.log('================================');
  
  try {
    // Clear any existing rate limit data
    clearUserRateLimit(TEST_TELEGRAM_ID);
    
    // Test 2.1: Normal command should be allowed
    console.log('\n2.1️⃣ Testing normal command...');
    const normalCommand = createMockMessage(TEST_TELEGRAM_ID, '/balance');
    const result1 = await rateLimitMiddleware(normalCommand);
    
    if (result1.allowed) {
      logTestResult('Normal Command Allowed', true);
    } else {
      throw new Error(`Normal command was blocked: ${result1.reason}`);
    }
    
    // Test 2.2: Multiple commands within limit
    console.log('\n2.2️⃣ Testing multiple commands within limit...');
    let blockedCount = 0;
    
    for (let i = 0; i < 8; i++) { // Should be within 10 commands per minute limit
      const command = createMockMessage(TEST_TELEGRAM_ID, `/command${i + 1}`);
      const result = await rateLimitMiddleware(command);
      
      if (!result.allowed) {
        blockedCount++;
      }
    }
    
    if (blockedCount === 0) {
      logTestResult('Multiple Commands Within Limit', true);
      console.log(`   All ${8} commands were allowed`);
    } else {
      throw new Error(`${blockedCount} commands were unexpectedly blocked`);
    }
    
    // Test 2.3: Exceed command rate limit
    console.log('\n2.3️⃣ Testing command rate limit exceeded...');
    let rateLimitHit = false;
    
    for (let i = 0; i < 15; i++) { // Should exceed 10 commands per minute limit
      const command = createMockMessage(TEST_TELEGRAM_ID, `/command${i + 1}`);
      const result = await rateLimitMiddleware(command);
      
      if (!result.allowed && result.reason.includes('Too many commands')) {
        rateLimitHit = true;
        console.log(`   Rate limit hit at command ${i + 1}: ${result.reason}`);
        break;
      }
    }
    
    if (rateLimitHit) {
      logTestResult('Command Rate Limit Enforcement', true);
    } else {
      throw new Error('Command rate limit was not enforced');
    }
    
  } catch (error) {
    logTestResult('Command Rate Limiting', false, error);
  }
}

// ============================================================================
// TEST 3: Financial Operation Rate Limiting
// ============================================================================

async function testFinancialOperationRateLimiting() {
  console.log('\n💰 Test 3: Financial Operation Rate Limiting');
  console.log('============================================');
  
  try {
    // Clear any existing rate limit data
    clearUserRateLimit(TEST_TELEGRAM_ID);
    
    // Test 3.1: Financial command should be allowed
    console.log('\n3.1️⃣ Testing financial command...');
    const financialCommand = createMockMessage(TEST_TELEGRAM_ID, '/deposit');
    const result1 = await rateLimitMiddleware(financialCommand);
    
    if (result1.allowed) {
      logTestResult('Financial Command Allowed', true);
    } else {
      throw new Error(`Financial command was blocked: ${result1.reason}`);
    }
    
    // Test 3.2: Multiple financial operations within limit
    console.log('\n3.2️⃣ Testing multiple financial operations within limit...');
    let blockedCount = 0;
    
    for (let i = 0; i < 2; i++) { // Should be within 3 financial ops per minute limit
      const commands = ['/deposit', '/withdraw', '/claim'];
      const command = createMockMessage(TEST_TELEGRAM_ID, commands[i]);
      const result = await rateLimitMiddleware(command);
      
      if (!result.allowed) {
        blockedCount++;
      }
    }
    
    if (blockedCount === 0) {
      logTestResult('Multiple Financial Operations Within Limit', true);
      console.log(`   All ${2} financial operations were allowed`);
    } else {
      throw new Error(`${blockedCount} financial operations were unexpectedly blocked`);
    }
    
    // Test 3.3: Exceed financial operation rate limit
    console.log('\n3.3️⃣ Testing financial operation rate limit exceeded...');
    let rateLimitHit = false;
    
    for (let i = 0; i < 5; i++) { // Should exceed 3 financial ops per minute limit
      const commands = ['/deposit', '/withdraw', '/claim', '/pay', '/send_uma'];
      const command = createMockMessage(TEST_TELEGRAM_ID, commands[i]);
      const result = await rateLimitMiddleware(command);
      
      if (!result.allowed && result.reason.includes('Too many financial operations')) {
        rateLimitHit = true;
        console.log(`   Rate limit hit at financial operation ${i + 1}: ${result.reason}`);
        break;
      }
    }
    
    if (rateLimitHit) {
      logTestResult('Financial Operation Rate Limit Enforcement', true);
    } else {
      throw new Error('Financial operation rate limit was not enforced');
    }
    
  } catch (error) {
    logTestResult('Financial Operation Rate Limiting', false, error);
  }
}

// ============================================================================
// TEST 4: Cooldown Periods
// ============================================================================

async function testCooldownPeriods() {
  console.log('\n⏰ Test 4: Cooldown Periods');
  console.log('==========================');
  
  try {
    // Clear any existing rate limit data
    clearUserRateLimit(TEST_TELEGRAM_ID);
    
    // Test 4.1: First command should be allowed
    console.log('\n4.1️⃣ Testing first command...');
    const firstCommand = createMockMessage(TEST_TELEGRAM_ID, '/deposit');
    const result1 = await rateLimitMiddleware(firstCommand);
    
    if (result1.allowed) {
      logTestResult('First Command Allowed', true);
    } else {
      throw new Error(`First command was blocked: ${result1.reason}`);
    }
    
    // Test 4.2: Same command immediately after should be blocked
    console.log('\n4.2️⃣ Testing immediate repeat command...');
    const repeatCommand = createMockMessage(TEST_TELEGRAM_ID, '/deposit');
    const result2 = await rateLimitMiddleware(repeatCommand);
    
    if (!result2.allowed && result2.reason.includes('Cooldown active')) {
      logTestResult('Cooldown Enforcement', true);
      console.log(`   Cooldown message: ${result2.reason}`);
    } else {
      throw new Error('Cooldown was not enforced for immediate repeat');
    }
    
    // Test 4.3: Different command should still be allowed
    console.log('\n4.3️⃣ Testing different command during cooldown...');
    const differentCommand = createMockMessage(TEST_TELEGRAM_ID, '/balance');
    const result3 = await rateLimitMiddleware(differentCommand);
    
    if (result3.allowed) {
      logTestResult('Different Command During Cooldown', true);
    } else {
      throw new Error(`Different command was blocked during cooldown: ${result3.reason}`);
    }
    
  } catch (error) {
    logTestResult('Cooldown Periods', false, error);
  }
}

// ============================================================================
// TEST 5: Rate Limit Statistics
// ============================================================================

async function testRateLimitStatistics() {
  console.log('\n📊 Test 5: Rate Limit Statistics');
  console.log('===============================');
  
  try {
    // Clear any existing rate limit data
    clearUserRateLimit(TEST_TELEGRAM_ID);
    
    // Generate some activity
    console.log('\n5.1️⃣ Generating test activity...');
    for (let i = 0; i < 5; i++) {
      const message = createMockMessage(TEST_TELEGRAM_ID, `Message ${i + 1}`);
      await rateLimitMiddleware(message);
    }
    
    for (let i = 0; i < 3; i++) {
      const command = createMockMessage(TEST_TELEGRAM_ID, `/command${i + 1}`);
      await rateLimitMiddleware(command);
    }
    
    for (let i = 0; i < 2; i++) {
      const financialCommand = createMockMessage(TEST_TELEGRAM_ID, `/deposit${i + 1}`);
      await rateLimitMiddleware(financialCommand);
    }
    
    // Test 5.2: Get user statistics
    console.log('\n5.2️⃣ Testing user statistics...');
    const userStats = getUserRateLimitStats(TEST_TELEGRAM_ID);
    
    if (userStats) {
      logTestResult('User Statistics Retrieved', true);
      console.log(`   Messages: ${userStats.messages.count}/${userStats.messages.limit} (${userStats.messages.remaining} remaining)`);
      console.log(`   Commands: ${userStats.commands.count}/${userStats.commands.limit} (${userStats.commands.remaining} remaining)`);
      console.log(`   Financial Ops: ${userStats.financialOps.count}/${userStats.financialOps.limit} (${userStats.financialOps.remaining} remaining)`);
    } else {
      throw new Error('User statistics not available');
    }
    
    // Test 5.3: Get global statistics
    console.log('\n5.3️⃣ Testing global statistics...');
    const globalStats = getAllRateLimitStats();
    
    if (globalStats) {
      logTestResult('Global Statistics Retrieved', true);
      console.log(`   Total Users: ${globalStats.totalUsers}`);
      console.log(`   Active Users: ${globalStats.activeUsers}`);
      console.log(`   Blocked Requests: ${globalStats.blockedRequests}`);
    } else {
      throw new Error('Global statistics not available');
    }
    
  } catch (error) {
    logTestResult('Rate Limit Statistics', false, error);
  }
}

// ============================================================================
// TEST 6: Configuration Validation
// ============================================================================

async function testConfigurationValidation() {
  console.log('\n⚙️ Test 6: Configuration Validation');
  console.log('===================================');
  
  try {
    // Test 6.1: Default configuration
    console.log('\n6.1️⃣ Testing default configuration...');
    const config = DEFAULT_RATE_LIMIT_CONFIG;
    
    if (config.maxMessagesPerMinute === 30 &&
        config.maxCommandsPerMinute === 10 &&
        config.maxFinancialOpsPerMinute === 3) {
      logTestResult('Default Configuration Valid', true);
      console.log(`   Messages per minute: ${config.maxMessagesPerMinute}`);
      console.log(`   Commands per minute: ${config.maxCommandsPerMinute}`);
      console.log(`   Financial ops per minute: ${config.maxFinancialOpsPerMinute}`);
    } else {
      throw new Error('Default configuration has invalid values');
    }
    
    // Test 6.2: Cooldown periods
    console.log('\n6.2️⃣ Testing cooldown periods...');
    const cooldowns = config.cooldownPeriods;
    
    if (cooldowns['/deposit'] === 30000 &&
        cooldowns['/withdraw'] === 60000 &&
        cooldowns['/savings_advice'] === 60000) {
      logTestResult('Cooldown Periods Valid', true);
      console.log(`   /deposit cooldown: ${cooldowns['/deposit']}ms`);
      console.log(`   /withdraw cooldown: ${cooldowns['/withdraw']}ms`);
      console.log(`   /savings_advice cooldown: ${cooldowns['/savings_advice']}ms`);
    } else {
      throw new Error('Cooldown periods have invalid values');
    }
    
  } catch (error) {
    logTestResult('Configuration Validation', false, error);
  }
}

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runAllTests() {
  console.log('\n🧪 Starting Rate Limiting Test Suite...\n');
  
  // Run all test suites
  await testBasicMessageRateLimiting();
  await testCommandRateLimiting();
  await testFinancialOperationRateLimiting();
  await testCooldownPeriods();
  await testRateLimitStatistics();
  await testConfigurationValidation();
  
  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 RATE LIMITING TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${(((testResults.passed / (testResults.passed + testResults.failed)) * 100) || 0).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.test}: ${error.error}`);
    });
  }
  
  // Rate limiting implementation check
  console.log('\n🎯 RATE LIMITING IMPLEMENTATION CHECK');
  console.log('=====================================');
  
  const checks = [
    {
      feature: 'Message rate limiting',
      status: testResults.errors.some(e => e.test.includes('Message')) ? '❌ FAILED' : '✅ WORKING'
    },
    {
      feature: 'Command rate limiting',
      status: testResults.errors.some(e => e.test.includes('Command')) ? '❌ FAILED' : '✅ WORKING'
    },
    {
      feature: 'Financial operation rate limiting',
      status: testResults.errors.some(e => e.test.includes('Financial')) ? '❌ FAILED' : '✅ WORKING'
    },
    {
      feature: 'Cooldown periods',
      status: testResults.errors.some(e => e.test.includes('Cooldown')) ? '❌ FAILED' : '✅ WORKING'
    },
    {
      feature: 'Statistics tracking',
      status: testResults.errors.some(e => e.test.includes('Statistics')) ? '❌ FAILED' : '✅ WORKING'
    },
    {
      feature: 'Configuration validation',
      status: testResults.errors.some(e => e.test.includes('Configuration')) ? '❌ FAILED' : '✅ WORKING'
    }
  ];
  
  checks.forEach((check, index) => {
    console.log(`${index + 1}. ${check.feature}: ${check.status}`);
  });
  
  const workingFeatures = checks.filter(c => c.status.includes('WORKING')).length;
  console.log(`\n📈 Rate Limiting Features Working: ${workingFeatures}/${checks.length} (${((workingFeatures / checks.length) * 100).toFixed(1)}%)`);
  
  if (workingFeatures === checks.length) {
    console.log('\n🎉 RATE LIMITING IMPLEMENTATION: COMPLETED SUCCESSFULLY!');
    console.log('\n✅ All rate limiting features are working correctly');
    console.log('✅ Protection against spam and API abuse is active');
    console.log('✅ Cooldown periods are enforced');
    console.log('✅ Statistics tracking is functional');
    console.log('\n🚀 SparkChat is ready for testnet deployment with rate limiting!');
  } else {
    console.log('\n⚠️ RATE LIMITING IMPLEMENTATION: PARTIALLY COMPLETED');
    console.log('\n❌ Some rate limiting features are not working correctly');
    console.log('🔧 Please review failed tests and fix issues before deployment');
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the rate limiting test suite
runAllTests().catch(console.error); 