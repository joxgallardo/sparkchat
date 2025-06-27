import TelegramBot from 'node-telegram-bot-api';
import { processSimpleCommand, validateSimpleCommandParams } from '../services/simpleCommandProcessor';
import { 
  handleBalanceCheck,
  handleBTCDeposit,
  handleUSDWithdrawal,
  handleBTCToUSDConversion,
  handleUSDToBTCConversion,
  handleTransactionHistory,
  handleWalletFunding,
  validateWalletOperation
} from './wallet';
import { formatWelcomeMessage, formatHelpMessage, formatSavingsAdviceMessage } from '../utils/telegram';
import { withSession, SessionContext, getSparkChatUserId } from '../middleware/session';

export function setupMessageHandlers(bot: TelegramBot) {
  // Handle text messages (natural language commands)
  bot.on('message', withSession(async (sessionContext: SessionContext) => {
    const msg = sessionContext.message;
    const sparkChatUserId = getSparkChatUserId(sessionContext);
    
    console.log('🔍 MessageHandler: Procesando mensaje:', msg.text);
    
    // Skip if it's a command (starts with /)
    if (msg.text?.startsWith('/')) {
      console.log('🔍 MessageHandler: Saltando comando (empieza con /)');
      return;
    }

    // Skip if it's not a text message
    if (!msg.text) {
      console.log('🔍 MessageHandler: Saltando mensaje no-texto');
      return;
    }

    const chatId = msg.chat.id;
    const userMessage = msg.text.trim();

    console.log('🔍 MessageHandler: Procesando mensaje de texto:', userMessage);

    try {
      // Show typing indicator
      await bot.sendChatAction(chatId, 'typing');

      // Check for special keywords first (BEFORE command processing)
      if (isWelcomeMessage(userMessage)) {
        console.log('🔍 MessageHandler: Detectado mensaje de bienvenida');
        await bot.sendMessage(chatId, formatWelcomeMessage(), { parse_mode: 'Markdown' });
        return;
      }

      if (isHelpRequest(userMessage)) {
        console.log('🔍 MessageHandler: Detectado solicitud de ayuda');
        await bot.sendMessage(chatId, formatHelpMessage(), { parse_mode: 'Markdown' });
        return;
      }

      if (isSavingsAdviceRequest(userMessage)) {
        console.log('🔍 MessageHandler: Detectado solicitud de consejos de ahorro');
        await handleSimpleSavingsAdvice(bot, chatId);
        return;
      }

      console.log('🔍 MessageHandler: Llamando a processSimpleCommand...');
      // Process the command using simple processor (temporary)
      const result = await processSimpleCommand(userMessage);
      console.log('🔍 MessageHandler: Resultado de processSimpleCommand:', result);

      if (!result.success || result.intent === 'unknown') {
        console.log('🔍 MessageHandler: Comando no reconocido, enviando mensaje de error');
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

      // Validate command parameters
      console.log('🔍 MessageHandler: Validando parámetros...');
      const validation = validateSimpleCommandParams(result.intent, result.amount, result.currency);
      console.log('🔍 MessageHandler: Resultado de validación:', validation);
      
      if (!validation.valid) {
        console.log('🔍 MessageHandler: Validación fallida, enviando error');
        await bot.sendMessage(chatId, `❌ ${validation.error}`);
        return;
      }

      console.log('🔍 MessageHandler: Ejecutando intent:', result.intent);
      // Process based on intent using wallet handlers
      switch (result.intent) {
        case 'check_balance':
          await handleBalanceCheck(bot, chatId, sparkChatUserId);
          break;
        
        case 'check_transactions':
          await handleTransactionHistory(bot, chatId, sparkChatUserId);
          break;
        
        case 'deposit':
          if (result.amount) {
            await handleBTCDeposit(bot, chatId, result.amount, sparkChatUserId);
          }
          break;
        
        case 'withdraw':
          if (result.amount) {
            await handleUSDWithdrawal(bot, chatId, result.amount, "default_address", sparkChatUserId);
          }
          break;
        
        case 'convert_to_usd':
          if (result.amount) {
            await handleBTCToUSDConversion(bot, chatId, result.amount, sparkChatUserId);
          }
          break;
        
        case 'convert_to_btc':
          if (result.amount) {
            await handleUSDToBTCConversion(bot, chatId, result.amount, sparkChatUserId);
          }
          break;
        
        case 'fund_wallet':
          if (result.amount) {
            await handleWalletFunding(bot, chatId, result.amount, sparkChatUserId);
          }
          break;
        
        case 'savings_advice':
          await handleSimpleSavingsAdvice(bot, chatId);
          break;
        
        case 'help':
          await bot.sendMessage(chatId, formatHelpMessage(), { parse_mode: 'Markdown' });
          break;
        
        case 'welcome':
          await bot.sendMessage(chatId, formatWelcomeMessage(), { parse_mode: 'Markdown' });
          break;
        
        default:
          console.log('🔍 MessageHandler: Intent no manejado:', result.intent);
          await bot.sendMessage(chatId, 
            '❓ Comando no reconocido. Usa /help para ver comandos disponibles.'
          );
      }

    } catch (error) {
      console.error('❌ MessageHandler: Error procesando mensaje:', error);
      await bot.sendMessage(chatId, 
        '❌ Error al procesar tu comando. Intenta de nuevo o usa /help para ver comandos disponibles.'
      );
    }
  }));
}

/**
 * Handle simple savings advice (without AI)
 */
async function handleSimpleSavingsAdvice(bot: TelegramBot, chatId: number) {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const suggestions = `
• **Diversifica tu portfolio**: Mantén una mezcla de BTC y USD para reducir riesgos
• **DCA (Dollar Cost Averaging)**: Deposita pequeñas cantidades regularmente en lugar de grandes sumas
• **Establece metas claras**: Define objetivos de ahorro a corto, mediano y largo plazo
• **Monitorea el mercado**: Revisa regularmente tus saldos y ajusta tu estrategia
• **Mantén reservas de emergencia**: Ten siempre algo de USD disponible para emergencias
    `.trim();
    
    const advice = `
• **Bitcoin como reserva de valor**: Considera BTC como inversión a largo plazo
• **Timing del mercado**: No intentes predecir picos y valles, mantén una estrategia consistente
• **Educación continua**: Mantente informado sobre las tendencias del mercado crypto
• **Gestión de riesgos**: Nunca inviertas más de lo que puedas permitirte perder
• **Revisión periódica**: Evalúa tu estrategia cada 3-6 meses
    `.trim();
    
    const message = formatSavingsAdviceMessage(suggestions, advice);
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
  } catch (error) {
    console.error('Error getting savings advice:', error);
    await bot.sendMessage(chatId, '❌ Error al obtener consejos de ahorro.');
  }
}

/**
 * Check if message is a welcome request
 */
function isWelcomeMessage(message: string): boolean {
  const welcomeKeywords = [
    'hola', 'hello', 'hi', 'buenos días', 'buenas tardes', 'buenas noches',
    'iniciar', 'empezar', 'comenzar', 'bienvenido', 'welcome'
  ];
  
  return welcomeKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * Check if message is a help request
 */
function isHelpRequest(message: string): boolean {
  const helpKeywords = [
    'ayuda', 'help', 'comandos', 'commands', 'qué puedo hacer', 'what can i do',
    'cómo funciona', 'how does it work', 'instrucciones', 'instructions'
  ];
  
  return helpKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
}

/**
 * Check if message is a savings advice request
 */
function isSavingsAdviceRequest(message: string): boolean {
  const savingsKeywords = [
    'consejos', 'advice', 'sugerencias', 'suggestions', 'ahorro', 'savings',
    'inversión', 'investment', 'finanzas', 'finance', 'tips', 'consejo'
  ];
  
  return savingsKeywords.some(keyword => 
    message.toLowerCase().includes(keyword.toLowerCase())
  );
} 