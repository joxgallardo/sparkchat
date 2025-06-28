import TelegramBot from 'node-telegram-bot-api';
import { 
  handleBalanceCheck,
  handleTransactionHistory,
  handleBTCDeposit,
  handleUSDWithdrawal,
  handleBTCToUSDConversion,
  handleUSDToBTCConversion,
  handleDepositAddress,
  handleClaimDeposit,
  handleBTCWithdrawal,
  handleLightningPayment,
  handleSparkAddress,
  validateWalletOperation
} from './wallet';
import { 
  handleUMAAddress,
  handleUMAPayment,
  handleUMAQuote,
  handleUMAPaymentHistory,
  handleUMATest,
  handleUMAHelp
} from './uma';
import {
  handleTokenBalanceCheck,
  handleTokenTransfer,
  handleTokenInfo
} from './tokens';
import { getSavingsAdvice } from '../services/commandProcessor';
import { 
  formatWelcomeMessage, 
  formatHelpMessage, 
  formatSavingsAdviceMessage,
  formatErrorMessage 
} from '../utils/telegram';
import { withSession, withRateLimitAndSession, SessionContext, getSparkChatUserId } from '../middleware/session';
import { getUserStats } from '@/services/userManager';

/**
 * Validate Bitcoin address format
 * Supports mainnet (bc1, 1, 3) and testnet (tb1, 2, m, n) addresses
 */
function isValidBitcoinAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const trimmedAddress = address.trim();
  
  // Check for valid Bitcoin address prefixes
  const validPrefixes = [
    // Mainnet
    'bc1', // Bech32 (SegWit)
    '1',   // Legacy
    '3',   // P2SH (SegWit)
    // Testnet
    'tb1', // Bech32 testnet
    '2',   // Legacy testnet
    'm',   // Legacy testnet
    'n',   // Legacy testnet
    // Regtest
    'bcrt1' // Bech32 regtest
  ];
  
  const hasValidPrefix = validPrefixes.some(prefix => 
    trimmedAddress.toLowerCase().startsWith(prefix)
  );
  
  if (!hasValidPrefix) {
    return false;
  }
  
  // Basic length validation
  // Legacy addresses: 26-35 characters
  // SegWit addresses: 42-62 characters (Bech32)
  const length = trimmedAddress.length;
  if (length < 26 || length > 62) {
    return false;
  }
  
  // Check for valid characters (alphanumeric, no confusing characters)
  const validChars = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
  if (!validChars.test(trimmedAddress)) {
    return false;
  }
  
  return true;
}

export function setupCommandHandlers(bot: TelegramBot) {
  // /start command - Welcome and user registration
  bot.onText(/\/start/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    
    const welcomeMessage = formatWelcomeMessage();
    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }));

  // /help command - Show help message
  bot.onText(/\/help/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const helpMessage = formatHelpMessage();
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }));

  // /balance command - Check balance (with rate limiting)
  bot.onText(/\/balance/, withRateLimitAndSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleBalanceCheck(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /history command - Show transaction history
  bot.onText(/\/history/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleTransactionHistory(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /deposit command - Generate deposit address (with rate limiting)
  bot.onText(/\/deposit/, withRateLimitAndSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleDepositAddress(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /claim command - Claim deposit (with rate limiting)
  bot.onText(/\/claim (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const txid = match![1];
    
    try {
      await handleClaimDeposit(bot, chatId, txid, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /withdraw_btc command - Withdraw BTC (with rate limiting)
  bot.onText(/\/withdraw_btc (.+) (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    const address = match![2];
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }
    
    // Validate Bitcoin address
    if (!isValidBitcoinAddress(address)) {
      await bot.sendMessage(chatId, '❌ Dirección de Bitcoin inválida');
      return;
    }

    try {
      await handleBTCWithdrawal(bot, chatId, amount, address, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /withdraw_usd command - Withdraw USD (with rate limiting)
  bot.onText(/\/withdraw_usd (.+) (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    const umaAddress = match![2];
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await handleUSDWithdrawal(bot, chatId, amount, umaAddress, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /convert_btc_to_usd command - Convert BTC to USD (with rate limiting)
  bot.onText(/\/convert_btc_to_usd (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await handleBTCToUSDConversion(bot, chatId, amount, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /convert_usd_to_btc command - Convert USD to BTC (with rate limiting)
  bot.onText(/\/convert_usd_to_btc (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await handleUSDToBTCConversion(bot, chatId, amount, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /pay command - Pay Lightning invoice (with rate limiting)
  bot.onText(/\/pay (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const invoice = match![1];
    
    try {
      await handleLightningPayment(bot, chatId, invoice, 5, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /spark_address command - Get Spark address
  bot.onText(/\/spark_address/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleSparkAddress(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /savings_advice command (with rate limiting due to AI processing)
  bot.onText(/\/savings_advice/, withRateLimitAndSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    
    try {
      await bot.sendChatAction(chatId, 'typing');
      
      // For now, using mock data. In a real app, this would come from user's transaction history
      const mockSavingsPatterns = "El usuario realiza depósitos regulares de Bitcoin y ocasionalmente convierte a USD";
      const mockFinancialGoals = "Ahorro a largo plazo y diversificación de inversiones";
      
      const result = await getSavingsAdvice(mockSavingsPatterns, mockFinancialGoals);
      
      if (result.success && result.suggestions && result.advice) {
        const message = formatSavingsAdviceMessage(result.suggestions, result.advice);
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } else {
        await bot.sendMessage(chatId, '❌ Error al obtener consejos de ahorro. Intenta de nuevo.');
      }
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /status command - Show bot status
  bot.onText(/\/status/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const user = sessionContext.userContext.user;
    
    const statusMessage = `
🤖 *Estado del Bot*

✅ Bot funcionando correctamente
🔄 Conectado a Lightspark
💾 Base de datos operativa
🤖 IA de procesamiento activa

👤 *Tu sesión:*
• Usuario: ${user.firstName || user.username || 'Sin nombre'}
• ID: \`${user.sparkChatUserId}\`
• Estado: ${user.isActive ? '✅ Activo' : '❌ Inactivo'}

*Última actualización:* ${new Date().toLocaleString('es-ES')}
    `.trim();
    
    await bot.sendMessage(chatId, statusMessage, { parse_mode: 'Markdown' });
  }));

  // /profile command - Show user profile
  bot.onText(/\/profile/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      const userStats = await getUserStats(telegramId);
      
      if (!userStats) {
        await bot.sendMessage(chatId, '❌ No se pudo obtener la información del perfil');
        return;
      }
      
      const profileMessage = `
👤 *Tu Perfil*

📱 *Información de Telegram:*
• Usuario: ${sessionContext.userContext.user.firstName || sessionContext.userContext.user.username || 'Sin nombre'}
• ID: \`${sessionContext.userContext.user.sparkChatUserId}\`
• Cuenta: #${sessionContext.userContext.user.accountNumber || 'N/A'}
• UMA: \`${sessionContext.userContext.user.umaAddress || 'N/A'}\`

📊 *Estadísticas:*
• Registrado: ${userStats.createdAt.toLocaleDateString('es-ES')}
• Última actividad: ${userStats.lastSeen.toLocaleString('es-ES')}
• Estado: ${userStats.isActive ? '✅ Activo' : '❌ Inactivo'}

💡 *Comandos útiles:*
• /balance - Ver saldos
• /history - Historial de transacciones
• /help - Ayuda completa
      `.trim();
      
      await bot.sendMessage(chatId, profileMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // UMA Commands (with rate limiting for financial operations)

  // /uma_address command - Get UMA address
  bot.onText(/\/uma_address/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleUMAAddress(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /uma_test command - Test UMA connectivity
  bot.onText(/\/uma_test/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleUMATest(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /uma_help command - Show UMA help
  bot.onText(/\/uma_help/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    
    try {
      await handleUMAHelp(bot, chatId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /send_uma command - Send UMA payment (with rate limiting)
  bot.onText(/\/send_uma (.+) (.+) (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    const currency = match![2].toUpperCase();
    const toUMAAddress = match![3];
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await handleUMAPayment(bot, chatId, amount, currency, toUMAAddress, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /quote_uma command - Get UMA quote (with rate limiting)
  bot.onText(/\/quote_uma (.+) (.+) (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    const fromCurrency = match![2].toUpperCase();
    const toCurrency = match![3].toUpperCase();
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }

    try {
      await handleUMAQuote(bot, chatId, amount, fromCurrency, toCurrency, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /uma_history command - Show UMA payment history
  bot.onText(/\/uma_history/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleUMAPaymentHistory(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // LRC-20 Token Commands (with rate limiting for transfers)

  // /tokens command - Show token balances
  bot.onText(/\/tokens/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleTokenBalanceCheck(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /transfer command - Transfer LRC-20 tokens (with rate limiting)
  bot.onText(/\/transfer (.+) (.+) (.+)/, withRateLimitAndSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const tokenPubkey = match![1];
    const amount = parseFloat(match![2]);
    const recipientAddress = match![3];
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }
    
    // Validate token pubkey (basic validation)
    if (!tokenPubkey || tokenPubkey.length < 10) {
      await bot.sendMessage(chatId, '❌ Token pubkey inválido');
      return;
    }

    try {
      await handleTokenTransfer(bot, chatId, tokenPubkey, amount, recipientAddress, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /tokeninfo command - Get token information
  bot.onText(/\/tokeninfo (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const tokenPubkey = match![1];
    
    // Validate token pubkey (basic validation)
    if (!tokenPubkey || tokenPubkey.length < 10) {
      await bot.sendMessage(chatId, '❌ Token pubkey inválido');
      return;
    }

    try {
      await handleTokenInfo(bot, chatId, tokenPubkey);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));
} 