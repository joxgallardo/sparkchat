#!/usr/bin/env node

/**
 * Switch to MAINNET Configuration
 * 
 * This script helps you switch to MAINNET configuration for production.
 * WARNING: This will use real Bitcoin with real value.
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Switching to MAINNET Configuration');
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

if (currentNetwork === 'MAINNET') {
  console.log('✅ Already configured for MAINNET');
} else {
  // Update SPARK_NETWORK to MAINNET
  if (currentNetworkMatch) {
    envContent = envContent.replace(/SPARK_NETWORK\s*=\s*.+/, 'SPARK_NETWORK=MAINNET');
  } else {
    // Add SPARK_NETWORK if it doesn't exist
    envContent += '\n# Spark Configuration (Self-custodial wallet)\nSPARK_NETWORK=MAINNET\n';
  }
  
  // Write updated .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local to use MAINNET');
}

console.log('\n⚠️  MAINNET Configuration WARNING');
console.log('================================');

console.log('\n🚨 CRITICAL SECURITY WARNINGS:');
console.log('• This will use REAL Bitcoin with REAL value');
console.log('• All transactions will cost real money');
console.log('• Users will need real Bitcoin to use the service');
console.log('• Make sure you have proper security measures in place');
console.log('• Test thoroughly on TESTNET first');

console.log('\n✅ MAINNET Benefits:');
console.log('• Real Bitcoin transactions');
console.log('• Production-ready service');
console.log('• Users can use real funds');
console.log('• Full Bitcoin ecosystem integration');

console.log('\n🔗 MAINNET Resources:');
console.log('• Explorer: https://mempool.space/');
console.log('• Explorer: https://blockstream.info/');
console.log('• Explorer: https://live.blockcypher.com/btc/');

console.log('\n💰 Getting Real Bitcoin:');
console.log('• Buy from exchanges (Coinbase, Binance, etc.)');
console.log('• Use Bitcoin ATMs');
console.log('• Accept Bitcoin payments');
console.log('• Mine Bitcoin (advanced)');

console.log('\n🔒 Security Checklist:');
console.log('• [ ] Backup your master mnemonic securely');
console.log('• [ ] Use hardware wallet for master keys');
console.log('• [ ] Implement proper rate limiting');
console.log('• [ ] Set up monitoring and alerts');
console.log('• [ ] Have disaster recovery plan');
console.log('• [ ] Test all functionality thoroughly');

console.log('\n🚀 Next Steps:');
console.log('1. Test the configuration: npx tsx scripts/test-mainnet.ts');
console.log('2. Verify your master mnemonic is secure');
console.log('3. Set up monitoring and alerts');
console.log('4. Deploy to production server');
console.log('5. Start with small amounts for testing');

console.log('\n🔄 To switch back to TESTNET:');
console.log('   node scripts/switch-to-testnet.js');

console.log('\n🔄 To switch back to REGTEST:');
console.log('   node scripts/switch-to-regtest.js'); 