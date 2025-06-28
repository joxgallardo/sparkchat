#!/usr/bin/env node

/**
 * Switch to REGTEST Configuration
 * 
 * This script helps you switch from TESTNET to REGTEST configuration
 * and provides instructions for testing.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to REGTEST Configuration');
console.log('=====================================');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('💡 Please create .env.local file first');
  console.log('   You can copy from env.example and fill in your values');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current SPARK_NETWORK setting
const currentNetworkMatch = envContent.match(/SPARK_NETWORK\s*=\s*(.+)/);
const currentNetwork = currentNetworkMatch ? currentNetworkMatch[1].trim() : 'NOT_SET';

console.log(`📋 Current SPARK_NETWORK: ${currentNetwork}`);

if (currentNetwork === 'REGTEST') {
  console.log('✅ Already configured for REGTEST');
} else {
  // Update SPARK_NETWORK to REGTEST
  if (currentNetworkMatch) {
    envContent = envContent.replace(/SPARK_NETWORK\s*=\s*.+/, 'SPARK_NETWORK=REGTEST');
  } else {
    // Add SPARK_NETWORK if it doesn't exist
    envContent += '\n# Spark Configuration (Self-custodial wallet)\nSPARK_NETWORK=REGTEST\n';
  }
  
  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local to use REGTEST');
}

console.log('\n🎯 REGTEST Configuration Complete');
console.log('================================');

console.log('\n📋 Next Steps:');
console.log('1. Test the configuration:');
console.log('   node scripts/test-regtest-configuration.js');
console.log('');
console.log('2. Test all features:');
console.log('   node scripts/test-regtest-features.js');
console.log('');
console.log('3. Start your bot with REGTEST:');
console.log('   npm run bot:dev');
console.log('');
console.log('4. Test in Telegram:');
console.log('   - Send /start to your bot');
console.log('   - Send /deposit to get a REGTEST address');
console.log('   - Send /balance to check balance');
console.log('   - Send /invoice 10000 to create Lightning invoice');

console.log('\n🔗 REGTEST Testing Resources:');
console.log('- REGTEST Faucet: https://testnet-faucet.mempool.co/');
console.log('- REGTEST Explorer: https://mempool.space/testnet/');
console.log('- REGTEST Block Explorer: https://blockstream.info/testnet/');

console.log('\n💡 REGTEST Advantages:');
console.log('- Free transactions (no real BTC needed)');
console.log('- Fast confirmations');
console.log('- Public endpoints already configured');
console.log('- Perfect for development and testing');
console.log('- Lightning network support');

console.log('\n⚠️  Important Notes:');
console.log('- REGTEST is a testing network');
console.log('- All transactions are free and fast');
console.log('- Use REGTEST faucets to get test BTC');
console.log('- Lightning invoices work with REGTEST wallets');
console.log('- All transactions are visible on REGTEST explorers');

console.log('\n🔄 To switch back to TESTNET later:');
console.log('   node scripts/switch-to-testnet.js'); 