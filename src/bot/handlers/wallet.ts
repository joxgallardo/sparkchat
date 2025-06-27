/**
 * @fileOverview Wallet operations handler for Telegram bot
 * 
 * This handler connects the Telegram bot with the existing actions.ts
 * to perform wallet operations like deposits, withdrawals, and conversions.
 */

import TelegramBot from 'node-telegram-bot-api';
import { 
  fetchBalancesAction,
  fetchTransactionsAction,
  depositBTCAction,
  withdrawUSDAction,
  convertBTCToUSDAction,
  convertUSDToBTCAction
} from '@/app/actions';
import { fundWalletWithSimulatedBTC, fundWalletWithRealBTC } from '@/services/lightspark';
import { formatBalanceMessage, formatTransactionMessage, formatErrorMessage } from '../utils/telegram';

export interface WalletOperationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Handle balance check operation
 */
export async function handleBalanceCheck(
  bot: TelegramBot, 
  chatId: number, 
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const balances = await fetchBalancesAction(userId);
    const message = formatBalanceMessage(balances);
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Saldos obtenidos exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener saldos',
      error: errorMessage
    };
  }
}

/**
 * Handle transaction history operation
 */
export async function handleTransactionHistory(
  bot: TelegramBot, 
  chatId: number, 
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const transactions = await fetchTransactionsAction(userId);
    const message = formatTransactionMessage(transactions);
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Historial de transacciones obtenido exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener historial de transacciones',
      error: errorMessage
    };
  }
}

/**
 * Handle BTC deposit operation
 */
export async function handleBTCDeposit(
  bot: TelegramBot, 
  chatId: number, 
  amount: number, 
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando depósito de Bitcoin...');
    
    const result = await depositBTCAction(amount, userId);
    
    const message = `✅ *Depósito exitoso*

💰 ${amount} BTC depositado
💳 Saldo BTC: ${result.newBtcBalance} BTC
📝 ${result.transaction.description}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    if (result.invoice) {
      await bot.sendMessage(chatId, `🔗 *Factura:* ${result.invoice.substring(0, 100)}...`, { 
        parse_mode: 'Markdown' 
      });
    }
    
    return {
      success: true,
      message: `Depósito de ${amount} BTC procesado exitosamente`
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar depósito de Bitcoin',
      error: errorMessage
    };
  }
}

/**
 * Handle USD withdrawal operation
 */
export async function handleUSDWithdrawal(
  bot: TelegramBot, 
  chatId: number, 
  amount: number, 
  targetAddress: string = "default_address",
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando retiro de USD...');
    
    const result = await withdrawUSDAction(amount, targetAddress, userId);
    
    const message = `✅ *Retiro exitoso*

💰 $${amount} USD retirado
💳 Saldo USD: $${result.newUsdBalance} USD
📝 ${result.transaction.description}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Retiro de $${amount} USD procesado exitosamente`
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient USD balance')) {
      const insufficientMessage = `❌ *Saldo insuficiente*

💳 Saldo disponible: $0 USD
💰 Cantidad solicitada: $${amount} USD

💡 *Sugerencias:*
• Deposita Bitcoin primero
• Convierte BTC a USD
• Verifica tu saldo con /balance`;
      
      await bot.sendMessage(chatId, insufficientMessage, { parse_mode: 'Markdown' });
      
      return {
        success: false,
        message: 'Saldo USD insuficiente',
        error: 'Insufficient USD balance'
      };
    }
    
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar retiro de USD',
      error: errorMessage
    };
  }
}

/**
 * Handle BTC to USD conversion
 */
export async function handleBTCToUSDConversion(
  bot: TelegramBot, 
  chatId: number, 
  btcAmount: number, 
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando conversión BTC → USD...');
    
    const result = await convertBTCToUSDAction(btcAmount, userId);
    
    const message = `✅ *Conversión exitosa*

💰 ${btcAmount} BTC → $${result.newUsdBalance} USD
💳 Saldo BTC: ${result.newBtcBalance} BTC
💳 Saldo USD: $${result.newUsdBalance} USD`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Conversión de ${btcAmount} BTC a USD procesada exitosamente`
    };
  } catch (error) {
    // Manejo especial para saldo insuficiente
    if (error instanceof Error && error.message.includes('Insufficient BTC balance')) {
      const insufficientMessage = `❌ *Saldo BTC insuficiente*

🪙 Saldo disponible: 0 BTC
💰 Cantidad solicitada: ${btcAmount} BTC

💡 *Sugerencias:*
• Deposita Bitcoin primero con /deposit
• Verifica tu saldo con /balance`;
      
      await bot.sendMessage(chatId, insufficientMessage, { parse_mode: 'Markdown' });
      
      return {
        success: false,
        message: 'Saldo BTC insuficiente',
        error: 'Insufficient BTC balance'
      };
    }
    
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar conversión BTC → USD',
      error: errorMessage
    };
  }
}

/**
 * Handle USD to BTC conversion
 */
export async function handleUSDToBTCConversion(
  bot: TelegramBot, 
  chatId: number, 
  usdAmount: number, 
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando conversión USD → BTC...');
    
    const result = await convertUSDToBTCAction(usdAmount, userId);
    
    const message = `✅ *Conversión exitosa*

💰 $${usdAmount} USD → ${result.newBtcBalance} BTC
💳 Saldo USD: $${result.newUsdBalance} USD
💳 Saldo BTC: ${result.newBtcBalance} BTC`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Conversión de $${usdAmount} USD a BTC procesada exitosamente`
    };
  } catch (error) {
    // Manejo especial para saldo insuficiente
    if (error instanceof Error && error.message.includes('Insufficient USD balance')) {
      const insufficientMessage = `❌ *Saldo USD insuficiente*

💵 Saldo disponible: $0 USD
💰 Cantidad solicitada: $${usdAmount} USD

💡 *Sugerencias:*
• Deposita Bitcoin primero
• Convierte BTC a USD
• Verifica tu saldo con /balance`;
      
      await bot.sendMessage(chatId, insufficientMessage, { parse_mode: 'Markdown' });
      
      return {
        success: false,
        message: 'Saldo USD insuficiente',
        error: 'Insufficient USD balance'
      };
    }
    
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar conversión USD → BTC',
      error: errorMessage
    };
  }
}

/**
 * Validate wallet operation parameters
 */
export function validateWalletOperation(
  operation: string,
  amount?: number,
  currency?: string
): { valid: boolean; error?: string } {
  
  if (!amount || amount <= 0) {
    return {
      valid: false,
      error: 'La cantidad debe ser mayor a 0'
    };
  }
  
  switch (operation) {
    case 'deposit':
      if (currency?.toLowerCase() !== 'btc') {
        return {
          valid: false,
          error: 'Solo se pueden depositar Bitcoin (BTC)'
        };
      }
      break;
      
    case 'withdraw':
      if (currency?.toLowerCase() !== 'usd') {
        return {
          valid: false,
          error: 'Solo se pueden retirar USD'
        };
      }
      break;
      
    case 'convert_btc_to_usd':
      if (amount < 0.00001) {
        return {
          valid: false,
          error: 'La cantidad mínima para conversión es 0.00001 BTC'
        };
      }
      break;
      
    case 'convert_usd_to_btc':
      if (amount < 1) {
        return {
          valid: false,
          error: 'La cantidad mínima para conversión es $1 USD'
        };
      }
      break;
      
    case 'fund_wallet':
      if (currency?.toLowerCase() !== 'btc') {
        return {
          valid: false,
          error: 'Solo se puede fondear con Bitcoin (BTC)'
        };
      }
      break;
  }
  
  return { valid: true };
}

/**
 * Handle wallet funding operation (for testing)
 */
export async function handleWalletFunding(
  bot: TelegramBot, 
  chatId: number, 
  amount: number, 
  userId?: string
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Fondear wallet con Bitcoin...');
    
    const result = await fundWalletWithRealBTC(userId || 'default-user', amount);
    
    if (result.success) {
      let message: string;
      
      if (result.fundingMethod === 'fundNode') {
        message = `✅ *Wallet fondeado exitosamente*

💰 ${amount} BTC agregado al wallet
💳 Nuevo saldo: ${result.newBalance} BTC
📝 ${result.message}`;
      } else {
        message = `📋 *Dirección de fondeo generada*

💰 Cantidad solicitada: ${amount} BTC
💳 Saldo actual: ${result.newBalance} BTC
📍 Dirección: \`${result.fundingAddress}\`

📝 *Instrucciones:*
1. Envía exactamente ${amount} BTC a la dirección arriba
2. Espera las confirmaciones de la red
3. El saldo se actualizará automáticamente

⚠️ *Importante:* Solo envía BTC de testnet a esta dirección`;
      }
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: result.fundingMethod === 'fundNode' 
          ? `Wallet fondeado con ${amount} BTC exitosamente`
          : `Dirección de fondeo generada para ${amount} BTC`
      };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al fondear wallet',
      error: errorMessage
    };
  }
} 