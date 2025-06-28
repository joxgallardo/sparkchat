# SparkChat - Bitcoin Wallet Bot

A Telegram bot for Bitcoin savings and spending using the Spark SDK, featuring UMA integration and LRC-20 token support.

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Production Deployment
```bash
# Check production readiness
npm run deploy:check

# Deploy to Vercel
npm run deploy:vercel

# Or use the complete setup
npm run deploy:setup
```

## 📋 Features

- ✅ **Spark SDK Integration** - Self-custodial Bitcoin wallets
- ✅ **Telegram Bot Interface** - Natural language commands
- ✅ **UMA Integration** - Cross-currency payments
- ✅ **LRC-20 Token Support** - Bitcoin-native tokens
- ✅ **Lightning Network** - Fast, low-cost transactions
- ✅ **Rate Limiting** - Protection against abuse
- ✅ **AI-Powered Savings Assistant** - Personalized financial advice

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token

# Spark Configuration
SPARK_NETWORK=MAINNET  # or TESTNET
SPARK_MASTER_MNEMONIC=your_24_word_mnemonic

# UMA Configuration
UMA_DOMAIN=sparkchat.btc
UMA_SIGNING_KEY=your_signing_key
UMA_ENCRYPTION_KEY=your_encryption_key

# Database (Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
USE_MOCK_DATABASE=false

# AI Features
GOOGLE_AI_API_KEY=your_google_ai_key
```

## 🚀 Production Deployment

### Option 1: Vercel (Recommended)

**Best for:**
- Serverless scalability
- Cost-effective hosting
- Easy deployment
- Built-in security

**Steps:**
1. Install Vercel CLI: `npm install -g vercel`
2. Login: `vercel login`
3. Configure environment: `npm run deploy:check`
4. Deploy: `npm run deploy:vercel`
5. Set webhook: `curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook -H "Content-Type: application/json" -d '{"url": "https://your-app.vercel.app/api/bot/webhook"}'`

### Option 2: Traditional VPS

**Best for:**
- Full control over infrastructure
- Persistent connections
- Custom configurations

**Steps:**
1. Set up Ubuntu/Debian server
2. Install Node.js 18+
3. Clone repository
4. Configure environment variables
5. Run with PM2: `pm2 start npm --name "sparkchat" -- run start`

## 🔒 Security

### Production Checklist
- [ ] Use strong, unique master mnemonic
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Set up monitoring and alerts
- [ ] Configure rate limiting (✅ implemented)
- [ ] Use HTTPS only
- [ ] Regular security audits
- [ ] Backup strategy for user data

### Rate Limiting
- **General messages**: 30/minute, 300/hour
- **Commands**: 10/minute, 100/hour
- **Financial operations**: 3/minute, 20/hour
- **Cooldown periods**: 30-60 seconds for sensitive operations

## 📊 Monitoring

### Health Checks
```bash
# Check application health
npm run health:check

# Comprehensive testing
npm run test:comprehensive
```

### Metrics to Monitor
- Bot response times
- User engagement
- Transaction success rates
- Error rates
- Database performance

## 💰 Cost Optimization

### Vercel
- **Hobby**: $0/month (100GB bandwidth)
- **Pro**: $20/month (unlimited)

### Supabase
- **Free**: $0/month (500MB database)
- **Pro**: $25/month (8GB database)

### Telegram Bot API
- Free for most use cases
- Rate limits apply

## 🧪 Testing

### Comprehensive Test Suite
```bash
# Run all tests
npm run test:comprehensive

# Test mainnet configuration
npm run test:mainnet
```

### Test Coverage
- ✅ Spark SDK integration
- ✅ Telegram bot functionality
- ✅ User management
- ✅ UMA integration
- ✅ LRC-20 token support
- ✅ Rate limiting
- ✅ Security validation

## 🔄 Network Switching

```bash
# Switch to mainnet (production)
npm run switch:mainnet

# Switch to testnet (development)
npm run switch:testnet
```

## 📚 Documentation

- [Spark SDK Documentation](https://docs.buildonspark.com)
- [UMA Protocol](https://umaproject.org)
- [LRC-20 Standard](https://docs.buildonspark.com/lrc20)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/sparkchat/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/sparkchat/discussions)
- **Documentation**: [Project Wiki](https://github.com/your-repo/sparkchat/wiki)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for educational and development purposes. Use at your own risk. Always test thoroughly before using with real funds.

---

**Made with ❤️ for the Bitcoin community**
