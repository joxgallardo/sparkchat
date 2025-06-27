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
    
    const message = `
✅ *Depósito de Bitcoin exitoso*

💰 Cantidad depositada: ${amount} BTC
💳 Nuevo saldo BTC: ${result.newBtcBalance} BTC
📝 Transacción: ${result.transaction.description}

${result.invoice ? `🔗 *Factura de pago:* ${result.invoice}` : ''}
    `.trim();
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
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
    
    const message = `
✅ *Retiro de USD exitoso*

💰 Cantidad retirada: $${amount} USD
💳 Nuevo saldo USD: $${result.newUsdBalance} USD
📝 Transacción: ${result.transaction.description}
📍 Dirección destino: ${targetAddress}
    `.trim();
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Retiro de $${amount} USD procesado exitosamente`
    };
  } catch (error) {
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
    
    const message = `
✅ *Conversión BTC → USD exitosa*

💰 Convertido: ${btcAmount} BTC → $${result.newUsdBalance} USD
💳 Nuevo saldo BTC: ${result.newBtcBalance} BTC
💳 Nuevo saldo USD: $${result.newUsdBalance} USD
📝 Transacción: ${result.transaction.description}
    `.trim();
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Conversión de ${btcAmount} BTC a USD procesada exitosamente`
    };
  } catch (error) {
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
    
    const message = `
✅ *Conversión USD → BTC exitosa*

💰 Convertido: $${usdAmount} USD → ${result.newBtcBalance} BTC
💳 Nuevo saldo USD: $${result.newUsdBalance} USD
💳 Nuevo saldo BTC: ${result.newBtcBalance} BTC
📝 Transacción: ${result.transaction.description}
    `.trim();
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Conversión de $${usdAmount} USD a BTC procesada exitosamente`
    };
  } catch (error) {
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
  }
  
  return { valid: true };
} 