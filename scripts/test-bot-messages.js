#!/usr/bin/env node

/**
 * Test script to verify bot messages work correctly
 * This helps identify Telegram API issues before they occur
 */

const TelegramBot = require('node-telegram-bot-api');

// Test messages that should work with Telegram API
const testMessages = [
  {
    name: 'Deposit Success (Short)',
    message: `✅ *Depósito exitoso*

💰 0.001 BTC depositado
💳 Saldo BTC: 0 BTC
📝 Lightning invoice created for 0.001 BTC deposit`
  },
  {
    name: 'Withdrawal Success (Short)',
    message: `✅ *Retiro exitoso*

💰 $50 USD retirado
💳 Saldo USD: $0 USD
📝 USD withdrawal processed`
  },
  {
    name: 'Insufficient Balance (USD)',
    message: `❌ *Saldo insuficiente*

💳 Saldo disponible: $0 USD
💰 Cantidad solicitada: $50 USD

💡 *Sugerencias:*
• Deposita Bitcoin primero
• Convierte BTC a USD
• Verifica tu saldo con /balance`
  },
  {
    name: 'Insufficient Balance (BTC)',
    message: `❌ *Saldo BTC insuficiente*

🪙 Saldo disponible: 0 BTC
💰 Cantidad solicitada: 0.001 BTC

💡 *Sugerencias:*
• Deposita Bitcoin primero con /deposit
• Verifica tu saldo con /balance`
  },
  {
    name: 'Conversion Success',
    message: `✅ *Conversión exitosa*

💰 0.001 BTC → $50 USD
💳 Saldo BTC: 0 BTC
💳 Saldo USD: $50 USD`
  }
];

function testMessage(message, name) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`📏 Length: ${message.length} characters`);
  console.log(`📝 Message:`);
  console.log('─'.repeat(50));
  console.log(message);
  console.log('─'.repeat(50));
  
  // Check for potential Telegram issues
  const issues = [];
  
  if (message.length > 4096) {
    issues.push('❌ Message too long (>4096 chars)');
  }
  
  if (message.includes('```') && !message.includes('```\n')) {
    issues.push('❌ Incomplete code blocks');
  }
  
  // Check for unclosed bold markers - count * and ensure they're paired
  const asterisks = (message.match(/\*/g) || []).length;
  if (asterisks % 2 !== 0) {
    issues.push('❌ Unpaired asterisks (bold markers)');
  }
  
  // Check for unclosed italic markers
  const underscores = (message.match(/_/g) || []).length;
  if (underscores % 2 !== 0) {
    issues.push('❌ Unpaired underscores (italic markers)');
  }
  
  if (message.includes('[') && !message.includes(']')) {
    issues.push('❌ Unclosed brackets');
  }
  
  if (message.includes('(') && !message.includes(')')) {
    issues.push('❌ Unclosed parentheses');
  }
  
  if (issues.length > 0) {
    console.log('⚠️  Potential issues:');
    issues.forEach(issue => console.log(`   ${issue}`));
  } else {
    console.log('✅ Message looks good!');
  }
  
  return issues.length === 0;
}

function main() {
  console.log('🤖 Testing SparkChat Bot Messages');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  testMessages.forEach(({ name, message }) => {
    const success = testMessage(message, name);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log('\n📊 Test Results:');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / testMessages.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All messages are ready for Telegram!');
  } else {
    console.log('\n⚠️  Some messages need fixes before deployment.');
  }
}

if (require.main === module) {
  main();
}

module.exports = { testMessage, testMessages }; 