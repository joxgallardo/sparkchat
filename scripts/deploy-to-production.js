#!/usr/bin/env node

require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

/**
 * @fileOverview Production Deployment Script for SparkChat
 * 
 * This script guides you through deploying SparkChat to production on Vercel
 * with proper security, environment configuration, and monitoring setup.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 SparkChat Production Deployment Guide');
console.log('==========================================');

// Check current environment
const currentNetwork = process.env.SPARK_NETWORK || 'NOT_SET';
const hasMasterMnemonic = !!process.env.SPARK_MASTER_MNEMONIC;
const hasBotToken = !!process.env.TELEGRAM_BOT_TOKEN;
const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);

console.log('\n📋 Current Configuration:');
console.log(`   Network: ${currentNetwork}`);
console.log(`   Master Mnemonic: ${hasMasterMnemonic ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Bot Token: ${hasBotToken ? '✅ Configured' : '❌ Missing'}`);
console.log(`   Supabase: ${hasSupabase ? '✅ Configured' : '❌ Missing'}`);

// Production readiness checklist
console.log('\n🔍 Production Readiness Checklist:');
console.log('==================================');

const checklist = [
  {
    item: 'Switch to MAINNET',
    status: currentNetwork === 'MAINNET',
    action: () => {
      console.log('   🔄 Switching to MAINNET...');
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(/SPARK_NETWORK\s*=\s*.+/, 'SPARK_NETWORK=MAINNET');
      fs.writeFileSync(envPath, envContent);
      console.log('   ✅ Switched to MAINNET');
    }
  },
  {
    item: 'Master Mnemonic configured',
    status: hasMasterMnemonic,
    action: () => {
      console.log('   ❌ Please set SPARK_MASTER_MNEMONIC in .env.local');
      console.log('   💡 Generate a new one with: npm run generate-master-mnemonic');
    }
  },
  {
    item: 'Telegram Bot Token configured',
    status: hasBotToken,
    action: () => {
      console.log('   ❌ Please set TELEGRAM_BOT_TOKEN in .env.local');
      console.log('   💡 Get it from @BotFather on Telegram');
    }
  },
  {
    item: 'Supabase configured',
    status: hasSupabase,
    action: () => {
      console.log('   ❌ Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local');
      console.log('   💡 Create a project at https://supabase.com');
    }
  },
  {
    item: 'UMA configuration',
    status: !!(process.env.UMA_DOMAIN && process.env.UMA_SIGNING_KEY),
    action: () => {
      console.log('   ❌ Please set UMA_DOMAIN, UMA_SIGNING_KEY, and UMA_ENCRYPTION_KEY');
      console.log('   💡 Configure UMA for cross-currency payments');
    }
  },
  {
    item: 'Google AI API Key',
    status: !!process.env.GOOGLE_AI_API_KEY,
    action: () => {
      console.log('   ❌ Please set GOOGLE_AI_API_KEY for AI features');
      console.log('   💡 Get it from Google AI Studio');
    }
  }
];

let readyForDeployment = true;

checklist.forEach((check, index) => {
  const status = check.status ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.item}`);
  
  if (!check.status) {
    readyForDeployment = false;
    check.action();
  }
});

if (!readyForDeployment) {
  console.log('\n⚠️  Please complete the missing configurations before deployment.');
  console.log('   Run this script again after fixing the issues.');
  process.exit(1);
}

console.log('\n✅ All configurations are ready for production!');

// Vercel deployment guide
console.log('\n🚀 Vercel Deployment Guide');
console.log('==========================');

console.log('\n1️⃣ Install Vercel CLI:');
console.log('   npm install -g vercel');

console.log('\n2️⃣ Login to Vercel:');
console.log('   vercel login');

console.log('\n3️⃣ Set up environment variables in Vercel:');
console.log('   vercel env add SPARK_NETWORK');
console.log('   vercel env add SPARK_MASTER_MNEMONIC');
console.log('   vercel env add TELEGRAM_BOT_TOKEN');
console.log('   vercel env add SUPABASE_URL');
console.log('   vercel env add SUPABASE_ANON_KEY');
console.log('   vercel env add UMA_DOMAIN');
console.log('   vercel env add UMA_SIGNING_KEY');
console.log('   vercel env add UMA_ENCRYPTION_KEY');
console.log('   vercel env add GOOGLE_AI_API_KEY');

console.log('\n4️⃣ Deploy to Vercel:');
console.log('   vercel --prod');

console.log('\n5️⃣ Set up Telegram webhook:');
console.log('   After deployment, set the webhook URL to:');
console.log('   https://your-app.vercel.app/api/bot/webhook');

console.log('\n6️⃣ Test the deployment:');
console.log('   curl https://your-app.vercel.app/api/health');

// Security recommendations
console.log('\n🔒 Production Security Checklist:');
console.log('==================================');

const securityChecks = [
  '✅ Use strong, unique master mnemonic',
  '✅ Enable Supabase Row Level Security (RLS)',
  '✅ Set up monitoring and alerts',
  '✅ Configure rate limiting (already implemented)',
  '✅ Use HTTPS only (Vercel handles this)',
  '✅ Regular security audits',
  '✅ Backup strategy for user data',
  '✅ Incident response plan'
];

securityChecks.forEach(check => {
  console.log(`   ${check}`);
});

// Monitoring setup
console.log('\n📊 Monitoring Setup:');
console.log('====================');

console.log('1. Vercel Analytics:');
console.log('   - Built-in performance monitoring');
console.log('   - Error tracking and alerting');

console.log('\n2. Custom monitoring:');
console.log('   - Set up health check endpoints');
console.log('   - Monitor bot response times');
console.log('   - Track user engagement metrics');

console.log('\n3. Database monitoring:');
console.log('   - Supabase dashboard for database health');
console.log('   - Query performance monitoring');

// Cost optimization
console.log('\n💰 Cost Optimization:');
console.log('=====================');

console.log('1. Vercel:');
console.log('   - Hobby plan: $0/month (up to 100GB bandwidth)');
console.log('   - Pro plan: $20/month (unlimited bandwidth)');

console.log('\n2. Supabase:');
console.log('   - Free tier: $0/month (up to 500MB database)');
console.log('   - Pro plan: $25/month (8GB database)');

console.log('\n3. Telegram Bot API:');
console.log('   - Free for most use cases');
console.log('   - Rate limits apply');

// Final deployment steps
console.log('\n🎯 Final Deployment Steps:');
console.log('==========================');

console.log('1. Run comprehensive tests:');
console.log('   npm run test-step11-comprehensive');

console.log('\n2. Build the application:');
console.log('   npm run build');

console.log('\n3. Deploy to Vercel:');
console.log('   vercel --prod');

console.log('\n4. Set up webhook:');
console.log('   curl -X POST https://api.telegram.org/bot<BOT_TOKEN>/setWebhook \\');
console.log('     -H "Content-Type: application/json" \\');
console.log('     -d \'{"url": "https://your-app.vercel.app/api/bot/webhook"}\'');

console.log('\n5. Verify deployment:');
console.log('   - Test bot commands');
console.log('   - Check health endpoint');
console.log('   - Monitor error logs');

console.log('\n🎉 Congratulations! SparkChat is now ready for production!');
console.log('\n📞 Support:');
console.log('   - Vercel documentation: https://vercel.com/docs');
console.log('   - Supabase documentation: https://supabase.com/docs');
console.log('   - Spark SDK documentation: https://docs.buildonspark.com');

console.log('\n' + '='.repeat(60)); 