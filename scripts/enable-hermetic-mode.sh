#!/bin/bash

# Enable Hermetic Mode for Spark SDK
# This script enables hermetic mode which allows the Spark SDK to work
# without requiring a local Spark node.

echo "🔧 Enabling Hermetic Mode for Spark SDK"
echo "========================================"

# Method 1: Create marker file
echo "📁 Creating marker file..."
touch /tmp/spark_hermetic
echo "✅ Created /tmp/spark_hermetic"

# Method 2: Set environment variable
echo "🔧 Setting environment variable..."
export HERMETIC_TEST=true
echo "✅ Set HERMETIC_TEST=true"

# Add to .env file if it exists
if [ -f .env ]; then
    echo "📝 Adding HERMETIC_TEST to .env file..."
    if ! grep -q "HERMETIC_TEST" .env; then
        echo "HERMETIC_TEST=true" >> .env
        echo "✅ Added HERMETIC_TEST=true to .env"
    else
        echo "⚠️  HERMETIC_TEST already exists in .env"
    fi
else
    echo "⚠️  .env file not found, creating one..."
    echo "HERMETIC_TEST=true" > .env
    echo "✅ Created .env with HERMETIC_TEST=true"
fi

echo ""
echo "🎯 Hermetic Mode Enabled!"
echo "========================="
echo "✅ Marker file: /tmp/spark_hermetic"
echo "✅ Environment variable: HERMETIC_TEST=true"
echo "✅ .env file updated"

echo ""
echo "🚀 Next Steps:"
echo "1. Restart your bot: npx tsx src/bot/index.ts"
echo "2. Test with: node scripts/test-hermetic-mode.js"
echo "3. Try commands like /deposit, /balance in your bot"

echo ""
echo "⚠️  Important Notes:"
echo "- Hermetic mode uses mock data (not real transactions)"
echo "- Perfect for development and testing"
echo "- For real transactions, you'll need a Spark node later"

echo ""
echo "🔄 To disable hermetic mode:"
echo "1. Remove /tmp/spark_hermetic: rm /tmp/spark_hermetic"
echo "2. Remove HERMETIC_TEST from .env file"
echo "3. Restart your bot" 