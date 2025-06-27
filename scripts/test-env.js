#!/usr/bin/env node

/**
 * Script to test environment variables loading
 * Run with: node scripts/test-env.js
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 Testing Environment Variables...\n');

const requiredVars = [
  'LIGHTSPARK_ACCOUNT_ID',
  'LIGHTSPARK_PRIVATE_KEY',
  'LIGHTSPARK_TESTNET',
  'USE_MOCK_CLIENT'
];

console.log('📋 Required Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const displayValue = varName.includes('PRIVATE_KEY') 
    ? (value ? `${value.substring(0, 50)}...` : 'NOT SET')
    : value || 'NOT SET';
  
  console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🔧 All Environment Variables:');
Object.keys(process.env)
  .filter(key => key.includes('LIGHTSPARK') || key.includes('USE_MOCK'))
  .forEach(key => {
    const value = process.env[key];
    const displayValue = key.includes('PRIVATE_KEY') 
      ? `${value.substring(0, 50)}...`
      : value;
    console.log(`${key}: ${displayValue}`);
  });

console.log('\n📁 Current Directory:', process.cwd());
console.log('📁 .env.local exists:', require('fs').existsSync('.env.local')); 