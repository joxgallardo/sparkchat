/**
 * @fileOverview Wallet operations handler for Telegram bot
 * 
 * This handler connects the Telegram bot with the Spark SDK actions
 * to perform wallet operations like deposits, withdrawals, and conversions.
 */

import TelegramBot from 'node-telegram-bot-api';
import { 
  fetchBalancesAction,
  fetchTransactionsAction,
  depositBTCAction,
  withdrawUSDAction,
  convertBTCToUSDAction,
  convertUSDToBTCAction,
  getDepositAddressAction,
  claimDepositAction,
  withdrawBTCAction,
  payLightningInvoiceAction,
  getSparkAddressAction
} from '@/app/actions';
// Import Spark functions directly for Lightning operations
import { 
  createSparkLightningInvoiceByTelegramId,
  getSparkBalanceByTelegramId
} from '@/services/spark';
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
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    // Get balance with forceRefetch to sync Lightning payments and on-chain deposits
    const { balance, tokenBalances } = await getSparkBalanceByTelegramId(telegramId!, true);
    const btcBalance = balance / 100_000_000;
    
    // Format balance message with Lightning sync info
    const message = `💰 *Saldos actualizados*

🪙 **Bitcoin (BTC):** ${btcBalance.toFixed(8)} BTC
💡 *Sincronizado con Lightning Network*

${tokenBalances.size > 0 ? '\n🪙 **Tokens:**\n' + Array.from(tokenBalances.entries())
  .map(([token, amount]) => `• ${token}: ${amount}`)
  .join('\n') : ''}

🌐 *Red:* ${process.env.SPARK_NETWORK || 'TESTNET'}
⏰ *Actualizado:* ${new Date().toLocaleString('es-ES')}

💡 *Nota:* Los pagos Lightning se sincronizan automáticamente al consultar el saldo`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Saldos obtenidos y sincronizados exitosamente'
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
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const transactions = await fetchTransactionsAction(telegramId);
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
 * Handle BTC deposit operation (Lightning)
 */
export async function handleBTCDeposit(
  bot: TelegramBot, 
  chatId: number, 
  amount: number, 
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando depósito Lightning...');
    
    console.log(`HANDLER: Received amount: ${amount} (type: ${typeof amount})`);
    
    // The amount is already in BTC (converted from the command parser)
    // Convert to satoshis for the Spark SDK
    const amountSats = Math.round(amount * 100_000_000);
    const displayAmount = `${amount} BTC`;
    
    console.log(`HANDLER: Converting to ${amountSats} sats for Spark SDK`);
    
    // Validate minimum amount (1 sat = 0.00000001 BTC)
    if (amountSats < 1) {
      await bot.sendMessage(chatId, '❌ *Cantidad mínima no válida*\n\n💡 La cantidad mínima es 1 satoshi (0.00000001 BTC)');
      return {
        success: false,
        message: 'Cantidad mínima no válida',
        error: 'Amount too small'
      };
    }
    
    // Create Lightning invoice
    const invoice = await createSparkLightningInvoiceByTelegramId(
      telegramId!, 
      amountSats, 
      `Depósito Lightning de ${displayAmount}`
    );
    
    // Get current balance for comparison
    const { balance } = await getSparkBalanceByTelegramId(telegramId!);
    const currentBalanceBTC = balance / 100_000_000;
    
    const message = `✅ *Factura Lightning generada*

💰 Cantidad: ${displayAmount} (${amountSats} sats)
💳 Saldo actual: ${currentBalanceBTC.toFixed(8)} BTC
⏰ Expira en: 24 horas

🔗 *Factura Lightning:*
\`${invoice}\`

💡 *Instrucciones:*
• Copia la factura y págala desde otra wallet Lightning
• El pago se acreditará automáticamente en tu wallet
• Usa /balance para verificar tu saldo después del pago
• Las facturas expiran en 24 horas por seguridad

🌐 *Red:* ${process.env.SPARK_NETWORK || 'TESTNET'}`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    // Send additional helpful message
    const helpMessage = `💡 *Consejos para pagos Lightning:*
• Asegúrate de que tu wallet Lightning esté conectada a la misma red (${process.env.SPARK_NETWORK || 'TESTNET'})
• Los pagos Lightning suelen confirmarse en segundos
• Si tienes problemas, verifica que la factura no haya expirado
• Para depósitos on-chain, usa /deposit sin cantidad`;
    
    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: `Factura Lightning generada para ${displayAmount}`
    };
  } catch (error) {
    console.error('Error creating Lightning invoice:', error);
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al generar factura Lightning',
      error: errorMessage
    };
  }
}

/**
 * Handle on-chain deposit address request
 */
export async function handleDepositAddress(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const address = await getDepositAddressAction(telegramId);
    
    const message = `📍 *Dirección de depósito on-chain*

\`${address}\`

💡 *Instrucciones:*
• Envía BTC a esta dirección
• Espera 3 confirmaciones
• Usa /claim <txid> para reclamar`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Dirección de depósito generada exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al generar dirección de depósito',
      error: errorMessage
    };
  }
}

/**
 * Handle deposit claim operation
 */
export async function handleClaimDeposit(
  bot: TelegramBot, 
  chatId: number, 
  txId: string, 
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Reclamando depósito...');
    
    const success = await claimDepositAction(txId, telegramId);
    
    if (success) {
      const message = `✅ *Depósito reclamado exitosamente*

🔗 TXID: \`${txId}\`
💡 Usa /balance para ver tu saldo actualizado`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: 'Depósito reclamado exitosamente'
      };
    } else {
      throw new Error('Failed to claim deposit');
    }
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al reclamar depósito',
      error: errorMessage
    };
  }
}

/**
 * Handle BTC withdrawal operation
 */
export async function handleBTCWithdrawal(
  bot: TelegramBot, 
  chatId: number, 
  amount: number, 
  btcAddress: string, 
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando retiro de Bitcoin...');
    
    // Convert BTC to satoshis for balance check
    const amountSats = Math.round(amount * 100_000_000);
    
    // Check user balance before processing withdrawal
    const balanceResult = await fetchBalancesAction(telegramId);
    const userBalanceSats = Math.round(balanceResult.btc * 100_000_000);
    
    if (userBalanceSats < amountSats) {
      const insufficientMessage = `❌ *Saldo BTC insuficiente*

🪙 Saldo disponible: ${balanceResult.btc} BTC
💰 Cantidad solicitada: ${amount} BTC
💸 Cantidad faltante: ${(amount - balanceResult.btc).toFixed(8)} BTC

💡 *Sugerencias:*
• Deposita más Bitcoin con /deposit
• Verifica tu saldo con /balance
• Usa una cantidad menor`;
      
      await bot.sendMessage(chatId, insufficientMessage, { parse_mode: 'Markdown' });
      
      return {
        success: false,
        message: 'Saldo BTC insuficiente',
        error: 'Insufficient BTC balance'
      };
    }
    
    const result = await withdrawBTCAction(amount, btcAddress, telegramId);
    
    if (result.success) {
      const message = `✅ *Retiro iniciado exitosamente*

💰 ${amount} BTC
📍 Dirección: \`${btcAddress}\`
🆔 ID: ${result.requestId || 'N/A'}

💡 La transacción será procesada en unos minutos
📊 Usa /balance para ver tu saldo actualizado`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: `Retiro de ${amount} BTC iniciado exitosamente`
      };
    } else {
      throw new Error('Withdrawal failed');
    }
  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('Insufficient')) {
        const insufficientMessage = `❌ *Saldo insuficiente*

💡 Verifica tu saldo con /balance antes de retirar`;
        await bot.sendMessage(chatId, insufficientMessage, { parse_mode: 'Markdown' });
      } else if (error.message.includes('address') || error.message.includes('Address')) {
        const addressError = `❌ *Dirección Bitcoin inválida*

📍 Dirección proporcionada: \`${btcAddress}\`
💡 Asegúrate de usar una dirección Bitcoin válida`;
        await bot.sendMessage(chatId, addressError, { parse_mode: 'Markdown' });
      } else if (error.message.includes('fee') || error.message.includes('Fee')) {
        const feeError = `❌ *Error de comisión*

💸 No se pudo calcular la comisión de red
💡 Intenta con una cantidad menor o más tarde`;
        await bot.sendMessage(chatId, feeError, { parse_mode: 'Markdown' });
      } else {
        const errorMessage = formatErrorMessage(error);
        await bot.sendMessage(chatId, errorMessage);
      }
    } else {
      const errorMessage = formatErrorMessage(error);
      await bot.sendMessage(chatId, errorMessage);
    }
    
    return {
      success: false,
      message: 'Error al procesar retiro de Bitcoin',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle Lightning payment operation
 */
export async function handleLightningPayment(
  bot: TelegramBot, 
  chatId: number, 
  invoice: string, 
  maxFeeSats: number = 5, 
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando pago Lightning...');
    
    const success = await payLightningInvoiceAction(invoice, maxFeeSats, telegramId);
    
    if (success) {
      const message = `✅ *Pago Lightning exitoso*

🔗 Invoice procesado
💸 Fee máximo: ${maxFeeSats} sats

💡 Usa /balance para ver tu saldo actualizado`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: 'Pago Lightning procesado exitosamente'
      };
    } else {
      throw new Error('Lightning payment failed');
    }
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar pago Lightning',
      error: errorMessage
    };
  }
}

/**
 * Handle Spark address request
 */
export async function handleSparkAddress(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const address = await getSparkAddressAction(telegramId);
    
    const message = `📍 *Tu dirección Spark*

\`${address}\`

💡 *Usos:*
• Recibir pagos Spark internos
• Transferencias entre usuarios
• Integración con UMA`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Dirección Spark obtenida exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener dirección Spark',
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
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando retiro de USD...');
    
    const result = await withdrawUSDAction(amount, targetAddress, telegramId);
    
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
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando conversión BTC → USD...');
    
    const result = await convertBTCToUSDAction(btcAmount, telegramId);
    
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
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando conversión USD → BTC...');
    
    const result = await convertUSDToBTCAction(usdAmount, telegramId);
    
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
• Deposita Bitcoin primero y convierte a USD
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
      if (currency?.toLowerCase() === 'btc') {
        // Validate minimum BTC withdrawal amount (0.00001 BTC = 1000 sats)
        if (amount < 0.00001) {
          return {
            valid: false,
            error: 'La cantidad mínima para retiro BTC es 0.00001 BTC'
          };
        }
      } else if (currency?.toLowerCase() === 'usd') {
        // USD withdrawal validation (existing logic)
        if (amount < 1) {
          return {
            valid: false,
            error: 'La cantidad mínima para retiro USD es $1'
          };
        }
      } else {
        return {
          valid: false,
          error: 'Solo se pueden retirar Bitcoin (BTC) o USD'
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
  telegramId?: number
): Promise<WalletOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Fondear wallet con Bitcoin...');
    
    // TODO: Migrate to Spark funding functions
    // const result = await fundWalletWithRealBTC(telegramId || 'default-user', amount);
    
    // Temporary implementation until Spark funding is ready
    const message = `🚧 *Función en desarrollo*

La función de fondeo está siendo migrada al nuevo SDK de Spark.
Próximamente estará disponible.`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: false,
      message: 'Función de fondeo en desarrollo'
    };
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