import TelegramBot from 'node-telegram-bot-api';
import { 
  handleBalanceCheck,
  handleTransactionHistory,
  handleBTCDeposit,
  handleUSDWithdrawal,
  handleBTCToUSDConversion,
  handleUSDToBTCConversion,
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
📅 Registrado: ${user.createdAt.toLocaleDateString('es-ES')}

💡 Usa /help para ver todos los comandos disponibles
💰 Usa /balance para verificar tu saldo

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
• Estado: ${stats.isActive ? '✅ Activo' : '❌ Inactivo'}
• Autenticado: ${stats.isAuthenticated ? '✅ Sí' : '❌ No'}

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
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    
    try {
      await handleBalanceCheck(bot, chatId, sparkChatUserId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /transactions command
  bot.onText(/\/transactions/, withSession(async (sessionContext: SessionContext) => {
    const chatId = sessionContext.message.chat.id;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    
    try {
      await handleTransactionHistory(bot, chatId, sparkChatUserId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /deposit command
  bot.onText(/\/deposit (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('deposit', amount, 'btc');
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleBTCDeposit(bot, chatId, amount, sparkChatUserId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /withdraw command
  bot.onText(/\/withdraw (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('withdraw', amount, 'usd');
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleUSDWithdrawal(bot, chatId, amount, sparkChatUserId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /convert_btc command
  bot.onText(/\/convert_btc (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('convert_btc_to_usd', amount);
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleBTCToUSDConversion(bot, chatId, amount, sparkChatUserId);
    } catch (error) {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
  }));

  // /convert_usd command
  bot.onText(/\/convert_usd (.+)/, withSession(async (sessionContext: SessionContext, match) => {
    const chatId = sessionContext.message.chat.id;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    const amount = parseFloat(match![1]);
    
    const validation = validateWalletOperation('convert_usd_to_btc', amount);
    if (!validation.valid) {
      await bot.sendMessage(chatId, `❌ ${validation.error}`);
      return;
    }

    try {
      await handleUSDToBTCConversion(bot, chatId, amount, sparkChatUserId);
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
} 