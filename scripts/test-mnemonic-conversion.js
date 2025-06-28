const bip39 = require('bip39');
require('dotenv').config();

async function testMnemonicConversion() {
  console.log('=== Testing Mnemonic to Seed Conversion ===\n');

  // Get the master mnemonic from environment
  const masterMnemonic = process.env.SPARK_MASTER_MNEMONIC;

  if (!masterMnemonic) {
    console.error('❌ SPARK_MASTER_MNEMONIC not found in environment variables');
    process.exit(1);
  }

  console.log('✅ SPARK_MASTER_MNEMONIC found in environment');
  console.log(`📝 Mnemonic (first 20 chars): "${masterMnemonic.substring(0, 20)}..."`);
  console.log(`📏 Mnemonic length: ${masterMnemonic.length} characters`);

  // Check if it looks like a mnemonic (contains spaces)
  const isMnemonic = masterMnemonic.includes(' ');
  console.log(`🔍 Contains spaces (likely mnemonic): ${isMnemonic}`);

  if (!isMnemonic) {
    console.log('⚠️  Warning: This doesn\'t look like a mnemonic phrase (no spaces found)');
    console.log('   It might already be a hex seed or have formatting issues');
  }

  try {
    // Convert mnemonic to seed (async)
    const seedBuffer = await bip39.mnemonicToSeed(masterMnemonic);
    const seedHex = seedBuffer.toString('hex');
    
    console.log('\n✅ Conversion successful!');
    console.log(`🔑 Seed hex (first 16 chars): ${seedHex.substring(0, 16)}...`);
    console.log(`📏 Seed length: ${seedHex.length} characters (should be 128 for 64 bytes)`);
    
    // Validate the seed length
    if (seedHex.length === 128) {
      console.log('✅ Seed length is correct (128 hex characters = 64 bytes)');
    } else {
      console.log(`⚠️  Unexpected seed length: ${seedHex.length} (expected 128)`);
    }
    
    console.log('\n🎉 Mnemonic to seed conversion is working correctly!');
    console.log('   The Spark SDK should now accept this hex string.');
    
  } catch (error) {
    console.error('\n❌ Error converting mnemonic to seed:', error.message);
    
    if (error.message.includes('Invalid mnemonic')) {
      console.log('\n💡 Possible issues:');
      console.log('   - The mnemonic phrase might be invalid');
      console.log('   - There might be extra spaces or formatting issues');
      console.log('   - The phrase might not be a valid BIP39 mnemonic');
    }
    
    process.exit(1);
  }
}

// Run the test
testMnemonicConversion().catch(console.error); 