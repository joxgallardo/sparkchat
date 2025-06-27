import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { setupCommandHandlers } from './handlers/commands';
import { setupMessageHandlers } from './handlers/messages';
// import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

console.log('🔍 Debug: Verificando configuración del bot...');
console.log('🔍 Debug: TELEGRAM_BOT_TOKEN existe:', !!token);
console.log('🔍 Debug: TELEGRAM_BOT_TOKEN comienza con:', token ? token.substring(0, 10) + '...' : 'NO TOKEN');

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN is required in .env file');
  process.exit(1);
}

if (token === 'your_telegram_bot_token_here') {
  console.error('❌ TELEGRAM_BOT_TOKEN still has default value. Please update .env file with your real bot token');
  process.exit(1);
}

// Create bot instance with better error handling
const bot = new TelegramBot(token, { 
  polling: true
});

console.log('🤖 SparkChat Telegram Bot starting...');

// Add message logging
bot.on('message', (msg) => {
  console.log('📨 Bot recibió mensaje:', {
    chatId: msg.chat.id,
    text: msg.text,
    isCommand: msg.text?.startsWith('/'),
    from: msg.from?.username || msg.from?.first_name,
    timestamp: new Date().toISOString()
  });
});

// Middlewares se implementarán manualmente en los handlers
// bot.use(authMiddleware);

// Setup handlers
try {
  setupCommandHandlers(bot);
  setupMessageHandlers(bot);
  console.log('✅ Handlers configurados correctamente');
} catch (error) {
  console.error('❌ Error configurando handlers:', error);
  process.exit(1);
}

// Error handling
bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
  console.error('❌ Error details:', {
    message: error.message,
    stack: error.stack
  });
});

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
  console.error('❌ Polling error details:', {
    message: error.message
  });
  
  // Don't exit on polling errors, just log them
  // The bot will try to reconnect automatically
});

// Add connection success logging
bot.on('webhook_error', (error) => {
  console.error('❌ Webhook error:', error);
});

// Log when bot is ready
setTimeout(() => {
  console.log('✅ SparkChat Telegram Bot is running and ready!');
  console.log('📊 Bot info:', {
    token: token ? token.substring(0, 10) + '...' : 'NO TOKEN'
  });
}, 2000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down bot...');
  try {
    bot.stopPolling();
    console.log('✅ Bot stopped gracefully');
  } catch (error) {
    console.error('❌ Error stopping bot:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down bot...');
  try {
    bot.stopPolling();
    console.log('✅ Bot stopped gracefully');
  } catch (error) {
    console.error('❌ Error stopping bot:', error);
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('❌ Stack trace:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 