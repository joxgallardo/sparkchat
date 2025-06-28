#!/usr/bin/env node

/**
 * Switch to TESTNET Configuration
 * 
 * This script helps you switch from REGTEST to TESTNET configuration.
 * TESTNET is the recommended option for scaling to more users.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to TESTNET Configuration');
console.log('=====================================');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  console.log('💡 Please create .env.local file first');
  process.exit(1);
}

// Read current .env.local
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current SPARK_NETWORK setting
const currentNetworkMatch = envContent.match(/SPARK_NETWORK\s*=\s*(.+)/);
const currentNetwork = currentNetworkMatch ? currentNetworkMatch[1].trim() : 'NOT_SET';

console.log(`📋 Current SPARK_NETWORK: ${currentNetwork}`);

if (currentNetwork === 'TESTNET') {
  console.log('✅ Already configured for TESTNET');
} else {
  // Update SPARK_NETWORK to TESTNET
  if (currentNetworkMatch) {
    envContent = envContent.replace(/SPARK_NETWORK\s*=\s*.+/, 'SPARK_NETWORK=TESTNET');
  } else {
    // Add SPARK_NETWORK if it doesn't exist
    envContent += '\n# Spark Configuration (Self-custodial wallet)\nSPARK_NETWORK=TESTNET\n';
  }
  
  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local to use TESTNET');
}

console.log('\n🎯 TESTNET Configuration for Scaling');
console.log('====================================');

console.log('\n✅ BENEFITS of TESTNET for scaling:');
console.log('• Users can get free funds from public faucets');
console.log('• No need to maintain local Bitcoin nodes');
console.log('• Works from any cloud server');
console.log('• Real Bitcoin experience without real costs');
console.log('• Easy user onboarding and testing');

console.log('\n🔗 Available TESTNET Faucets:');
console.log('• https://testnet-faucet.mempool.co/');
console.log('• https://coinfaucet.eu/en/btc-testnet/');
console.log('• https://testnet.help/');
console.log('• https://bitcoinfaucet.uo1.net/');

console.log('\n🌐 TESTNET Explorers:');
console.log('• https://mempool.space/testnet/');
console.log('• https://blockstream.info/testnet/');
console.log('• https://live.blockcypher.com/btc-testnet/');

console.log('\n⚠️  IMPORTANT NOTES:');
console.log('• TESTNET uses different address prefixes (tb1, tb1p)');
console.log('• TESTNET coins have no real value');
console.log('• Perfect for user testing and development');
console.log('• Can easily switch to MAINNET later');

console.log('\n🚀 Next Steps:');
console.log('1. Test the configuration: npx tsx scripts/test-step7-testnet.ts');
console.log('2. Try the /deposit command in your Telegram bot');
console.log('3. Use a faucet to get testnet funds');
console.log('4. Test all wallet operations');

console.log('\n🔄 To switch back to REGTEST:');
console.log('   node scripts/switch-to-regtest.js');

console.log('\n🔄 To switch to MAINNET (production):');
console.log('   node scripts/switch-to-mainnet.js'); 