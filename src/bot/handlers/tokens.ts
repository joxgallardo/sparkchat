/**
 * @fileOverview Token operations handler for Telegram bot
 * 
 * This handler connects the Telegram bot with the LRC-20 token operations
 * to perform token transfers, balance checks, and token information queries.
 */

import TelegramBot from 'node-telegram-bot-api';
import { 
  getLRC20TokenBalancesByTelegramId,
  transferLRC20TokensByTelegramId,
  getTokenInfo
} from '@/services/spark';
import { formatErrorMessage } from '../utils/telegram';

export interface TokenOperationResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Handle token balance check operation
 */
export async function handleTokenBalanceCheck(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<TokenOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const tokenBalances = await getLRC20TokenBalancesByTelegramId(telegramId!);
    
    if (tokenBalances.length === 0) {
      const message = `🪙 *Saldos de Tokens LRC-20*

No tienes tokens LRC-20 en tu wallet.

💡 *Para obtener tokens:*
• Recibe transferencias de otros usuarios
• Participa en airdrops o eventos
• Compra tokens en exchanges que soporten LRC-20

🌐 *Red:* ${process.env.SPARK_NETWORK || 'TESTNET'}
⏰ *Actualizado:* ${new Date().toLocaleString('es-ES')}`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: 'Consulta de saldos de tokens completada'
      };
    }
    
    const tokenList = tokenBalances.map(token => 
      `• **${token.symbol}** (${token.name})\n  └ ${token.balance.toLocaleString()} tokens\n  └ Pubkey: \`${token.tokenPubkey.substring(0, 16)}...\``
    ).join('\n\n');
    
    const message = `🪙 *Saldos de Tokens LRC-20*

${tokenList}

🌐 *Red:* ${process.env.SPARK_NETWORK || 'TESTNET'}
⏰ *Actualizado:* ${new Date().toLocaleString('es-ES')}

💡 *Comandos disponibles:*
• /transfer <token> <amount> <address> - Transferir tokens
• /tokeninfo <pubkey> - Información del token`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Saldos de tokens obtenidos exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener saldos de tokens',
      error: errorMessage
    };
  }
}

/**
 * Handle token transfer operation
 */
export async function handleTokenTransfer(
  bot: TelegramBot, 
  chatId: number, 
  tokenPubkey: string,
  amount: number,
  recipientAddress: string,
  telegramId?: number
): Promise<TokenOperationResult> {
  try {
    await bot.sendMessage(chatId, '⏳ Procesando transferencia de tokens...');
    
    // Validate amount
    if (amount <= 0) {
      await bot.sendMessage(chatId, '❌ *Cantidad inválida*\n\n💡 La cantidad debe ser mayor a 0');
      return {
        success: false,
        message: 'Cantidad inválida',
        error: 'Invalid amount'
      };
    }
    
    // Validate recipient address (basic validation)
    if (!recipientAddress || recipientAddress.length < 10) {
      await bot.sendMessage(chatId, '❌ *Dirección de destinatario inválida*\n\n💡 Proporciona una dirección válida');
      return {
        success: false,
        message: 'Dirección inválida',
        error: 'Invalid recipient address'
      };
    }
    
    // Get token info for display
    let tokenInfo;
    try {
      tokenInfo = await getTokenInfo(tokenPubkey);
    } catch {
      tokenInfo = { name: 'Unknown Token', symbol: 'UNK' };
    }
    
    // Transfer tokens
    const result = await transferLRC20TokensByTelegramId(
      telegramId!,
      tokenPubkey,
      amount,
      recipientAddress
    );
    
    if (result.success) {
      const message = `✅ *Transferencia de tokens exitosa*

🪙 **Token:** ${tokenInfo.symbol} (${tokenInfo.name})
💰 **Cantidad:** ${amount.toLocaleString()} tokens
📍 **Destinatario:** \`${recipientAddress}\`
🆔 **TXID:** \`${result.transactionId}\`

🌐 *Red:* ${process.env.SPARK_NETWORK || 'TESTNET'}
⏰ *Completado:* ${new Date().toLocaleString('es-ES')}

💡 La transacción se ha enviado a la red`;
      
      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      
      return {
        success: true,
        message: `Transferencia de ${amount} ${tokenInfo.symbol} completada exitosamente`
      };
    } else {
      throw new Error(result.error || 'Transferencia falló');
    }
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al procesar transferencia de tokens',
      error: errorMessage
    };
  }
}

/**
 * Handle token information request
 */
export async function handleTokenInfo(
  bot: TelegramBot, 
  chatId: number, 
  tokenPubkey: string
): Promise<TokenOperationResult> {
  try {
    await bot.sendChatAction(chatId, 'typing');
    
    const tokenInfo = await getTokenInfo(tokenPubkey);
    
    const message = `🪙 *Información del Token*

**Nombre:** ${tokenInfo.name}
**Símbolo:** ${tokenInfo.symbol}
**Pubkey:** \`${tokenPubkey}\`
${tokenInfo.totalSupply ? `**Supply Total:** ${tokenInfo.totalSupply.toLocaleString()}` : ''}

🌐 *Red:* ${process.env.SPARK_NETWORK || 'TESTNET'}
⏰ *Consultado:* ${new Date().toLocaleString('es-ES')}

💡 *Comandos disponibles:*
• /tokens - Ver tus saldos de tokens
• /transfer <token> <amount> <address> - Transferir tokens`;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    
    return {
      success: true,
      message: 'Información del token obtenida exitosamente'
    };
  } catch (error) {
    const errorMessage = formatErrorMessage(error);
    await bot.sendMessage(chatId, errorMessage);
    
    return {
      success: false,
      message: 'Error al obtener información del token',
      error: errorMessage
    };
  }
} 