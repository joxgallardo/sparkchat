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
import { getSavingsAdvice } from '../services/commandProcessor';
import { 
  formatWelcomeMessage, 
  formatHelpMessage, 
  formatSavingsAdviceMessage,
  formatErrorMessage 
} from '../utils/telegram';
import { withSession, SessionContext, getSparkChatUserId } from '../middleware/session';
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
  // /start command - Welcome and registration
  bot.onText(/\/start/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const user = sessionContext.userContext.user;
    
    const welcomeMessage = `
🎉 *¡Bienvenido a SparkChat!*

👋 Hola ${user.firstName || user.username || 'Usuario'}!

✅ Tu cuenta ha sido registrada automáticamente
🆔 Tu ID de usuario: \`${user.sparkChatUserId}\`
🔢 Número de cuenta Spark: \`${user.accountNumber}\`
🌐 Tu dirección UMA: \`${user.umaAddress}\`
📅 Registrado: ${user.createdAt.toLocaleDateString('es-ES')}

💡 Usa /help para ver todos los comandos disponibles
💰 Usa /balance para verificar tu saldo
👤 Usa /profile para ver tu información completa

*¡Disfruta usando SparkChat!*
    `.trim();
    
    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
  }));

  // /register command - Manual registration (for future use)
  bot.onText(/\/register/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const user = sessionContext.userContext.user;
    
    const registerMessage = `
📝 *Registro de Usuario*

✅ Ya estás registrado en SparkChat
👤 Usuario: ${user.firstName || user.username || 'Sin nombre'}
🆔 ID: \`${user.sparkChatUserId}\`
🔢 Número de cuenta Spark: \`${user.accountNumber}\`
🌐 Dirección UMA: \`${user.umaAddress}\`
📅 Registrado: ${user.createdAt.toLocaleDateString('es-ES')}
🕐 Última actividad: ${user.lastSeen.toLocaleString('es-ES')}

*Tu cuenta está activa y lista para usar!*
    `.trim();
    
    await bot.sendMessage(chatId, registerMessage, { parse_mode: 'Markdown' });
  }));

  // /profile command - Show user profile
  bot.onText(/\/profile/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    
    try {
      const stats = await getUserStats(telegramId);
      
      if (!stats) {
        await bot.sendMessage(chatId, '❌ No se pudo obtener la información del perfil');
        return;
      }
      
      const profileMessage = `
👤 *Perfil de Usuario*

📱 *Información de Telegram:*
• Usuario: @${stats.username || 'Sin username'}
• Nombre: ${stats.firstName || 'Sin nombre'} ${stats.lastName || ''}
• ID de Telegram: \`${stats.telegramId}\`

💼 *Información de SparkChat:*
• ID de Usuario: \`${sparkChatUserId}\`
• Número de cuenta Spark: \`${stats.accountNumber}\`
• Estado: ${stats.isActive ? '✅ Activo' : '❌ Inactivo'}
• Autenticado: ${stats.isAuthenticated ? '✅ Sí' : '❌ No'}

🌐 *Dirección UMA:*
• \`${stats.umaAddress}\`
• *Comparte esta dirección para recibir pagos cross-currency*

📅 *Actividad:*
• Registrado: ${stats.createdAt.toLocaleDateString('es-ES')}
• Última vez visto: ${stats.lastSeen.toLocaleString('es-ES')}
• Última actividad: ${stats.lastActivity.toLocaleString('es-ES')}

⚙️ *Preferencias:*
• Idioma: ${stats.preferences?.language || 'Español'}
• Notificaciones: ${stats.preferences?.notifications ? '✅ Activadas' : '❌ Desactivadas'}
      `.trim();
      
      await bot.sendMessage(chatId, profileMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /help command
  bot.onText(/\/help/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const helpMessage = formatHelpMessage();
    
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }));

  // /balance command
  bot.onText(/\/balance/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleBalanceCheck(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /transactions command
  bot.onText(/\/transactions/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleTransactionHistory(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /deposit command - Lightning deposit (improved regex to capture amounts with units)
  bot.onText(/\/deposit\s+(.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amountString = match![1].trim();
    
    console.log(`DEPOSIT COMMAND: Parsing amount string: "${amountString}"`);
    
    // Parse amount - support both BTC and sats
    let amount: number;
    let isSats = false;
    
    if (amountString.toLowerCase().includes('sat') || amountString.toLowerCase().includes('sats')) {
      // Parse as satoshis
      const satsMatch = amountString.match(/(\d+(?:\.\d+)?)/);
      if (satsMatch) {
        const satsAmount = parseFloat(satsMatch[1]);
        amount = satsAmount / 100_000_000; // Convert sats to BTC
        isSats = true;
        console.log(`DEPOSIT COMMAND: Parsed as ${satsAmount} sats = ${amount} BTC`);
      } else {
        await bot.sendMessage(chatId, '❌ *Formato inválido*\n\n💡 Ejemplos válidos:\n• `/deposit 0.001` (BTC)\n• `/deposit 100000 sats` (satoshis)\n• `/deposit 0.0001 BTC`');
        return;
      }
    } else {
      // Parse as BTC
      amount = parseFloat(amountString);
      console.log(`DEPOSIT COMMAND: Parsed as ${amount} BTC`);
    }
    
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await bot.sendMessage(chatId, '❌ *Cantidad inválida*\n\n💡 Ejemplos válidos:\n• `/deposit 0.001` (BTC)\n• `/deposit 100000 sats` (satoshis)\n• `/deposit 0.0001 BTC`');
      return;
    }
    
    const validation = validateWalletOperation('deposit', amount, 'btc');
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleBTCDeposit(bot, chatId, amount, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /deposit command without amount - Get on-chain deposit address
  bot.onText(/\/deposit$/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleDepositAddress(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /deposit_address command - Get on-chain deposit address
  bot.onText(/\/deposit_address/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    
    try {
      await handleDepositAddress(bot, chatId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /claim command - Claim on-chain deposit
  bot.onText(/\/claim (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const txId = match![1];
    
    try {
      await handleClaimDeposit(bot, chatId, txId, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /withdraw command - BTC withdrawal on-chain
  bot.onText(/\/withdraw (.+) (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    const btcAddress = match![2];
    
    // Validate amount
    if (!amount || amount <= 0) {
      await bot.sendMessage(chatId, '❌ La cantidad debe ser mayor a 0');
      return;
    }
    
    // Validate Bitcoin address format
    if (!isValidBitcoinAddress(btcAddress)) {
      await bot.sendMessage(chatId, '❌ Dirección Bitcoin inválida. Debe ser una dirección válida (bc1, tb1, etc.)');
      return;
    }

    try {
      await handleBTCWithdrawal(bot, chatId, amount, btcAddress, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /withdraw_usd command - USD withdrawal (placeholder for UMA)
  bot.onText(/\/withdraw_usd (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('withdraw', amount, 'usd');
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleUSDWithdrawal(bot, chatId, amount, undefined, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /pay command - Pay Lightning invoice
  bot.onText(/\/pay (.+)/, withSession(async (sessionContext: SessionContext, match) => {
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

  // /savings_advice command
  bot.onText(/\/savings_advice/, withSession(async (sessionContext: SessionContext) => {
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

  // /convert_btc command - Convert BTC to USD
  bot.onText(/\/convert_btc (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('convert_btc_to_usd', amount);
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleBTCToUSDConversion(bot, chatId, amount, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /convert_usd command - Convert USD to BTC
  bot.onText(/\/convert_usd (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const telegramId = sessionContext.telegramId;
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('convert_usd_to_btc', amount);
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleUSDToBTCConversion(bot, chatId, amount, telegramId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));
} 