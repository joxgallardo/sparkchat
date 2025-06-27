#!/usr/bin/env node

/**
 * Script to generate RSA key pair for Lightspark JWT signing
 * Run with: node scripts/generate-lightspark-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔑 Generating Lightspark EC Key Pair...\n');

try {
  // Generate EC key pair for ES256 algorithm
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'P-256', // P-256 curve for ES256
    publicKeyEncoding: { 
      type: 'spki', 
      format: 'pem' 
    },
    privateKeyEncoding: { 
      type: 'sec1', 
      format: 'pem' 
    }
  });

  // Create keys directory if it doesn't exist
  const keysDir = path.join(__dirname, '..', 'keys');
  if (!fs.existsSync(keysDir)) {
    fs.mkdirSync(keysDir, { recursive: true });
  }

  // Save keys to files
  const privateKeyPath = path.join(keysDir, 'lightspark_private.pem');
  const publicKeyPath = path.join(keysDir, 'lightspark_public.pem');

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  console.log('✅ Keys generated successfully!');
  console.log(`📁 Private key saved to: ${privateKeyPath}`);
  console.log(`📁 Public key saved to: ${publicKeyPath}`);
  console.log('\n🔐 Private Key (for .env file):');
  console.log('='.repeat(50));
  console.log(privateKey);
  console.log('='.repeat(50));
  
  console.log('\n📋 Next steps:');
  console.log('1. Copy the private key above to your .env.local file');
  console.log('2. Add: LIGHTSPARK_PRIVATE_KEY="<private_key_here>"');
  console.log('3. Make sure LIGHTSPARK_ACCOUNT_ID is set');
  console.log('4. Test with: npx tsx src/services/test-lightspark-integration.ts');
  
  console.log('\n⚠️  Security Notes:');
  console.log('- Never commit the private key to version control');
  console.log('- Keep the keys directory in .gitignore');
  console.log('- Use different keys for development and production');
  
} catch (error) {
  console.error('❌ Error generating keys:', error.message);
  process.exit(1);
} 