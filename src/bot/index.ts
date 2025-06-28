import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { setupCommandHandlers } from './handlers/commands';
import { setupMessageHandlers } from './handlers/messages';
// import { authMiddleware } from './middleware/auth';

// Load environment variables
dotenv.config();

// Get bot token from environment
const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  console.error('Please set TELEGRAM_BOT_TOKEN in your .env.local file');
  process.exit(1);
}

// Create bot instance
const bot = new TelegramBot(botToken, { polling: true });

// Make bot instance globally accessible for rate limiting middleware
(global as any).bot = bot;

console.log('🤖 SparkChat Bot starting...');

// Bot startup message
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error);
});

// Bot ready event
bot.on('polling_start', () => {
  console.log('✅ Bot polling started successfully');
  console.log('🤖 Bot is ready to receive messages');
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

// Export bot instance for use in other modules
export { bot }; 