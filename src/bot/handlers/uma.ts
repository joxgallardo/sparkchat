/**
 * @fileOverview UMA (Universal Money Address) command handlers for Telegram bot
 * 
 * This handler provides UMA functionality for cross-currency payments
 * using addresses like usuario@sparkchat.btc
 */

import TelegramBot from 'node-telegram-bot-api';
import { 
  sendUMAPayment,
  getUMAQuote,
  generateUMAAddress,
  getUMAPaymentHistory,
  validateUMAAddress,
  testUMAConnectivity
} from '@/services/uma';
import { formatErrorMessage } from '../utils/telegram';

export interface UMAOperationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Handle UMA address display
 */
export async function handleUMAAddress(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<UMAOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const umaAddress = await generateUMAAddress(telegramId!);
    
    const message = `🌐 *Tu dirección UMA*

\`${umaAddress}\`

💡 *Usos:*
• Recibir pagos cross-currency
• Envíos desde otros wallets UMA
• Pagos internacionales
• Conversión automática de monedas

🔗 *Comparte esta dirección* para recibir pagos en cualquier moneda`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Dirección UMA obtenida exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener dirección UMA',
      error: errorMessage
    };
  }
}

/**
 * Handle UMA payment sending
 */
export async function handleUMAPayment(
  bot: TelegramBot, 
  chatId: number, 
  amount: number,
  currency: string,
  toUMAAddress: string,
  telegramId?: number
): Promise<UMAOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando pago UMA...');
    
    // Validate currency
    const validCurrencies = ['BTC', 'USD', 'EUR', 'GBP'];
    if (!validCurrencies.includes(currency.toUpperCase())) {
      await bot.sendMessage(chatId, `❌ Moneda no soportada: ${currency}\n\n💡 Monedas soportadas: ${validCurrencies.join(', ')}`);
      return {
        success: false,
        message: 'Moneda no soportada',
        error: `Currency ${currency} not supported`
      };
    }
    
    // Validate UMA address
    if (!validateUMAAddress(toUMAAddress)) {
      await bot.sendMessage(chatId, `❌ Dirección UMA inválida: ${toUMAAddress}\n\n💡 Formato correcto: usuario@dominio.btc`);
      return {
        success: false,
        message: 'Dirección UMA inválida',
        error: 'Invalid UMA address format'
      };
    }
    
    // Get quote first
    const quote = await getUMAQuote(currency, 'BTC', amount);
    
    const quoteMessage = `💱 *Cotización UMA*

💰 Enviar: ${amount} ${currency}
🪙 Recibir: ${quote.convertedAmount.toFixed(8)} BTC
💸 Fee: ${quote.fees.toFixed(8)} BTC
⏱️ Tiempo estimado: ${quote.estimatedTime}
💱 Tipo de cambio: 1 ${currency} = ${quote.exchangeRate.toFixed(8)} BTC

¿Confirmas el envío?`;
    
    await bot.sendMessage(chatId, quoteMessage, { parse_mode: 'Markdown' });
    
    // Send the payment
    const result = await sendUMAPayment(
      telegramId!,
      toUMAAddress,
      amount,
      currency as 'BTC' | 'USD' | 'EUR' | 'GBP'
    );
    
    if (result.success) {
      const successMessage = `✅ *Pago UMA enviado exitosamente*

💰 Cantidad: ${amount} ${currency}
🪙 Convertido: ${result.amount.toFixed(8)} BTC
💸 Fee: ${result.fees.toFixed(8)} BTC
⏱️ Tiempo estimado: ${result.estimatedTime}
🆔 ID de pago: \`${result.paymentId}\`

🌐 *Destinatario:* ${toUMAAddress}

💡 El pago se procesará automáticamente`;
      
      await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: `Pago UMA de ${amount} ${currency} enviado exitosamente`
      };
    } else {
      throw new Error(result.error || 'Pago UMA falló');
    }
    
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar pago UMA',
      error: errorMessage
    };
  }
}

/**
 * Handle UMA quote request
 */
export async function handleUMAQuote(
  bot: TelegramBot, 
  chatId: number, 
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  telegramId?: number
): Promise<UMAOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const quote = await getUMAQuote(fromCurrency, toCurrency, amount);
    
    const message = `💱 *Cotización UMA*

💰 ${amount} ${fromCurrency} → ${quote.convertedAmount.toFixed(8)} ${toCurrency}
💸 Fee: ${quote.fees.toFixed(8)} ${toCurrency}
⏱️ Tiempo estimado: ${quote.estimatedTime}
💱 Tipo de cambio: 1 ${fromCurrency} = ${quote.exchangeRate.toFixed(8)} ${toCurrency}

💡 *Para enviar:* /send_uma ${amount} ${fromCurrency} <dirección_uma>`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Cotización UMA obtenida exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener cotización UMA',
      error: errorMessage
    };
  }
}

/**
 * Handle UMA payment history
 */
export async function handleUMAPaymentHistory(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<UMAOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const history = await getUMAPaymentHistory(telegramId!);
    
    if (history.length === 0) {
      const message = `📋 *Historial de pagos UMA*

No hay pagos UMA registrados.

💡 *Para hacer tu primer pago UMA:*
• Usa /uma_address para ver tu dirección
• Compártela para recibir pagos
• Usa /send_uma para enviar pagos`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: 'No hay pagos UMA registrados'
      };
    }
    
    let message = `📋 *Historial de pagos UMA*\n\n`;
    
    for (const payment of history.slice(0, 5)) { // Show last 5 payments
      const emoji = payment.type === 'sent' ? '📤' : '📥';
      const sign = payment.type === 'sent' ? '-' : '+';
      const date = payment.timestamp.toLocaleDateString('es-ES');
      
      message += `${emoji} *${payment.type === 'sent' ? 'Enviado' : 'Recibido'}*\n`;
      message += `💰 ${sign}${payment.amount} ${payment.currency}\n`;
      message += `👤 ${payment.counterparty}\n`;
      message += `📅 ${date}\n`;
      message += `✅ ${payment.status}\n\n`;
    }
    
    if (history.length > 5) {
      message += `... y ${history.length - 5} pagos más`;
    }
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Historial de ${history.length} pagos UMA mostrado`
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener historial UMA',
      error: errorMessage
    };
  }
}

/**
 * Handle UMA connectivity test
 */
export async function handleUMATest(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<UMAOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const result = await testUMAConnectivity();
    
    if (result.success) {
      const message = `🧪 *Test de conectividad UMA*

✅ Estado: Conectado
🌐 Dominio: ${result.details?.domain}
🔍 Validación de direcciones: ✅
💱 Generación de cotizaciones: ✅
🔧 Modo: ${result.details?.mockMode ? 'Simulación' : 'Producción'}

💡 UMA está funcionando correctamente`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: 'Test de conectividad UMA exitoso'
      };
    } else {
      throw new Error(result.error || 'Test de conectividad UMA falló');
    }
    
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error en test de conectividad UMA',
      error: errorMessage
    };
  }
}

/**
 * Handle UMA help
 */
export async function handleUMAHelp(
  bot: TelegramBot, 
  chatId: number
): Promise<UMAOperationResult> {
  try {
    const message = `🌐 *Ayuda UMA (Universal Money Address)*

*¿Qué es UMA?*
UMA permite enviar y recibir pagos en cualquier moneda usando direcciones como usuario@sparkchat.btc

*Comandos disponibles:*

🔗 */uma_address* - Ver tu dirección UMA
💱 */quote_uma <cantidad> <moneda_origen> <moneda_destino>* - Obtener cotización
📤 */send_uma <cantidad> <moneda> <dirección_uma>* - Enviar pago UMA
📋 */uma_history* - Ver historial de pagos UMA
🧪 */uma_test* - Probar conectividad UMA

*Ejemplos:*
• /uma_address - Ver tu dirección
• /quote_uma 100 USD BTC - Cotizar 100 USD a BTC
• /send_uma 50 USD user123@bitnob.btc - Enviar 50 USD
• /uma_history - Ver pagos recientes

*Monedas soportadas:* BTC, USD, EUR, GBP

💡 *Consejos:*
• Comparte tu dirección UMA para recibir pagos
• Los pagos se convierten automáticamente
• Las fees son mínimas (0.1%)
• Confirmación en 2-5 minutos`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Ayuda UMA mostrada'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al mostrar ayuda UMA',
      error: errorMessage
    };
  }
} 