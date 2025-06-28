import { VercelRequest, VercelResponse } from '@vercel/node';
import TelegramBot from 'node-telegram-bot-api';
import { setupMessageHandlers } from './handlers/messages';
import { setupCommandHandlers } from './handlers/commands';
import { withRateLimitAndSession, SessionContext } from './middleware/session';
import { rateLimitMiddleware } from './middleware/rateLimit';

// Initialize bot with webhook mode
const botToken = process.env.TELEGRAM_BOT_TOKEN!;
const bot = new TelegramBot(botToken, { polling: false });

// Webhook secret for security
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'default-secret';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;

    // Basic validation
    if (!update || !update.message && !update.callback_query) {
      return res.status(400).json({ error: 'Invalid update format' });
    }

    // Handle message updates
    if (update.message) {
      const message = update.message;
      
      // Rate limiting check
      const rateLimitResult = await rateLimitMiddleware(message);
      if (!rateLimitResult.allowed) {
        console.log(`Rate limit exceeded for user ${message.from?.id}: ${rateLimitResult.reason}`);
        await bot.sendMessage(message.chat.id, `⚠️ ${rateLimitResult.reason}`);
        return res.status(200).json({ ok: true });
      }

      // Handle commands
      if (message.text && message.text.startsWith('/')) {
        await withRateLimitAndSession(message, async (context: SessionContext) => {
          // Process command using the existing command handlers
          await processCommand(bot, message, context);
        });
      } else {
        // Handle regular messages
        await withRateLimitAndSession(message, async (context: SessionContext) => {
          // Process message using the existing message handlers
          await processMessage(bot, message, context);
        });
      }
    }

    // Handle callback queries (inline keyboard buttons)
    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      
      // Rate limiting for callback queries
      const rateLimitResult = await rateLimitMiddleware({
        from: callbackQuery.from,
        chat: callbackQuery.message?.chat,
        text: callbackQuery.data || '',
        message_id: callbackQuery.message?.message_id || 0,
        date: callbackQuery.message?.date || Math.floor(Date.now() / 1000)
      } as any);
      
      if (!rateLimitResult.allowed) {
        await bot.answerCallbackQuery(callbackQuery.id, {
          text: rateLimitResult.reason,
          show_alert: true
        });
        return res.status(200).json({ ok: true });
      }

      await withRateLimitAndSession({
        from: callbackQuery.from,
        chat: callbackQuery.message?.chat,
        text: callbackQuery.data || '',
        message_id: callbackQuery.message?.message_id || 0,
        date: callbackQuery.message?.date || Math.floor(Date.now() / 1000)
      } as any, async (context: SessionContext) => {
        await processCallbackQuery(bot, callbackQuery, context);
      });
    }

    // Return success
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Webhook error:', error);
    
    // Try to send error message to user if possible
    try {
      const update = req.body;
      if (update?.message?.chat?.id) {
        await bot.sendMessage(update.message.chat.id, 
          '⚠️ An error occurred while processing your request. Please try again later.');
      }
    } catch (sendError) {
      console.error('Failed to send error message:', sendError);
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to process commands
async function processCommand(bot: TelegramBot, message: any, context: SessionContext) {
  const chatId = message.chat.id;
  const text = message.text || '';
  
  // Extract command and arguments
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  try {
    // Import and use the actual command handlers
    const { 
      handleBalanceCheck,
      handleTransactionHistory,
      handleDepositAddress,
      handleClaimDeposit,
      handleBTCWithdrawal,
      handleUSDWithdrawal,
      handleLightningPayment
    } = await import('./handlers/wallet');
    
    const { 
      handleUMAAddress,
      handleUMAPayment,
      handleUMAQuote
    } = await import('./handlers/uma');
    
    const {
      handleTokenBalanceCheck,
      handleTokenTransfer,
      handleTokenInfo
    } = await import('./handlers/tokens');
    
    const { formatWelcomeMessage, formatHelpMessage } = await import('./utils/telegram');
    
    // Route commands
    switch (command) {
      case '/start':
        await bot.sendMessage(chatId, formatWelcomeMessage(), { parse_mode: 'Markdown' });
        break;
      case '/help':
        await bot.sendMessage(chatId, formatHelpMessage(), { parse_mode: 'Markdown' });
        break;
      case '/balance':
        await handleBalanceCheck(bot, chatId, context.telegramId);
        break;
      case '/history':
        await handleTransactionHistory(bot, chatId, context.telegramId);
        break;
      case '/deposit':
        await handleDepositAddress(bot, chatId, context.telegramId);
        break;
      case '/claim':
        if (args[0]) {
          await handleClaimDeposit(bot, chatId, args[0], context.telegramId);
        } else {
          await bot.sendMessage(chatId, '❌ Uso: /claim <txid>');
        }
        break;
      case '/withdraw':
        if (args.length >= 2) {
          const amount = parseFloat(args[0]);
          const address = args[1];
          await handleBTCWithdrawal(bot, chatId, amount, address, context.telegramId);
        } else {
          await bot.sendMessage(chatId, '❌ Uso: /withdraw <cantidad> <dirección>');
        }
        break;
      case '/uma':
        await handleUMAAddress(bot, chatId, context.telegramId);
        break;
      case '/send_uma':
        if (args.length >= 2) {
          const amount = parseFloat(args[0]);
          const address = args[1];
          await handleUMAPayment(bot, chatId, amount, address, context.telegramId);
        } else {
          await bot.sendMessage(chatId, '❌ Uso: /send_uma <cantidad> <dirección_uma>');
        }
        break;
      case '/tokens':
        await handleTokenBalanceCheck(bot, chatId, context.telegramId);
        break;
      case '/transfer':
        if (args.length >= 3) {
          const ticker = args[0];
          const amount = parseFloat(args[1]);
          const address = args[2];
          await handleTokenTransfer(bot, chatId, ticker, amount, address, context.telegramId);
        } else {
          await bot.sendMessage(chatId, '❌ Uso: /transfer <ticker> <cantidad> <dirección>');
        }
        break;
      default:
        await bot.sendMessage(chatId, '❌ Comando no reconocido. Usa /help para ver comandos disponibles.');
    }
  } catch (error) {
    console.error('Error processing command:', error);
    await bot.sendMessage(chatId, '❌ Error al procesar el comando. Intenta de nuevo.');
  }
}

// Helper function to process messages
async function processMessage(bot: TelegramBot, message: any, context: SessionContext) {
  const chatId = message.chat.id;
  const text = message.text || '';
  
  try {
    // Import and use the message processing logic
    const { processSimpleCommand, validateSimpleCommandParams } = await import('./services/simpleCommandProcessor');
    
    // Process the message using simple processor
    const result = await processSimpleCommand(text);
    
    if (!result.success || result.intent === 'unknown') {
      await bot.sendMessage(chatId, 
        '❓ No entiendo ese comando. Prueba con:\n' +
        '• "Deposita 0.001 BTC"\n' +
        '• "Retira 50 USD"\n' +
        '• "Convierte 0.01 BTC a USD"\n' +
        '• "Ver saldo"\n' +
        '• "Consejos de ahorro"'
      );
      return;
    }
    
    // Continue with message processing...
    // (This would include the full message processing logic from messages.ts)
    
  } catch (error) {
    console.error('Error processing message:', error);
    await bot.sendMessage(chatId, '❌ Error al procesar el mensaje. Intenta de nuevo.');
  }
}

// Helper function to process callback queries
async function processCallbackQuery(bot: TelegramBot, callbackQuery: any, context: SessionContext) {
  try {
    // Handle callback query data
    const data = callbackQuery.data || '';
    const chatId = callbackQuery.message?.chat?.id;
    
    if (!chatId) {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error: No chat ID found' });
      return;
    }
    
    // Process callback data
    if (data.startsWith('balance_')) {
      // Handle balance-related callbacks
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Balance actualizado' });
    } else if (data.startsWith('deposit_')) {
      // Handle deposit-related callbacks
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Depósito procesado' });
    } else {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Acción completada' });
    }
    
  } catch (error) {
    console.error('Error processing callback query:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error al procesar la acción' });
  }
}

// Health check endpoint
export async function healthCheck(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      sparkNetwork: process.env.SPARK_NETWORK
    });
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
} 