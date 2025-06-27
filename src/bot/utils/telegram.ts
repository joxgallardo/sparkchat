import type { Transaction } from '@/components/spark-chat/TransactionHistoryCard';

export function formatBalanceMessage(balances: { btc: number; usd: number }): string {
  return `
💰 *Saldos actuales*

🪙 Bitcoin: ${balances.btc.toFixed(8)} BTC
💵 USD: $${balances.usd.toFixed(2)} USD
  `.trim();
}

export function formatTransactionMessage(transactions: Transaction[]): string {
  if (transactions.length === 0) {
    return '📋 *No hay transacciones recientes*';
  }

  const recentTransactions = transactions.slice(0, 5); // Show only last 5
  let message = '📋 *Transacciones recientes*\n\n';

  recentTransactions.forEach((tx, index) => {
    const emoji = getTransactionEmoji(tx.type);
    const amount = formatTransactionAmount(tx);
    const date = new Date(tx.timestamp).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    message += `${emoji} *${tx.type}* - ${amount}\n`;
    message += `📅 ${date}\n`;
    message += `📝 ${tx.description}\n\n`;
  });

  if (transactions.length > 5) {
    message += `... y ${transactions.length - 5} transacciones más`;
  }

  return message.trim();
}

function getTransactionEmoji(type: string): string {
  switch (type.toLowerCase()) {
    case 'deposit':
      return '💰';
    case 'withdrawal':
      return '💸';
    case 'conversion':
      return '🔄';
    case 'transfer':
      return '📤';
    default:
      return '📊';
  }
}

function formatTransactionAmount(tx: Transaction): string {
  if (tx.currency === 'BTC') {
    return `${tx.amount.toFixed(8)} BTC`;
  } else if (tx.currency === 'USD') {
    return `$${tx.amount.toFixed(2)} USD`;
  }
  return `${tx.amount} ${tx.currency}`;
}

export function formatErrorMessage(error: any): string {
  console.error('Telegram bot error:', error);
  
  if (typeof error === 'string') {
    return `❌ ${error}`;
  }
  
  if (error?.message) {
    return `❌ ${error.message}`;
  }
  
  return '❌ Error inesperado. Intenta de nuevo.';
}

export function formatSuccessMessage(action: string, details: string): string {
  return `✅ *${action}*\n${details}`;
}

export function formatProcessingMessage(action: string): string {
  return `⏳ Procesando ${action}...`;
}

/**
 * Format welcome message for new users
 */
export function formatWelcomeMessage(): string {
  return `🤖 *¡Bienvenido a SparkChat Bot\\!*

Tu asistente personal para gestionar Bitcoin y USD de forma inteligente\\.

✅ *Tu cuenta ha sido registrada automáticamente*
🆔 Cada usuario tiene su propio ID único
🔒 Tus datos están seguros y privados

*¿Qué puedes hacer?*
• 💰 Depositar y retirar Bitcoin
• 💵 Convertir entre BTC y USD
• 📊 Ver saldos y transacciones
• 🤖 Obtener consejos de ahorro con IA
• 👤 Ver tu perfil con /profile

*Comandos principales:*
/start \\- Iniciar el bot
/help \\- Ver todos los comandos
/profile \\- Ver tu perfil
/balance \\- Ver saldos
/transactions \\- Historial de transacciones

*También puedes escribir en lenguaje natural:*
"Deposita 0\\.001 BTC"
"Retira 50 USD"
"Convierte 0\\.01 BTC a USD"
"¿Cuál es mi saldo?"

¡Comienza a usar el bot escribiendo cualquier comando\\!`;
}

/**
 * Format help message with all available commands
 */
export function formatHelpMessage(): string {
  return `🤖 *SparkChat Bot \\- Comandos disponibles*

*👤 Perfil y cuenta:*
/start \\- Iniciar el bot
/register \\- Ver información de registro
/profile \\- Ver tu perfil completo
/help \\- Mostrar esta ayuda

*📊 Información:*
/balance \\- Ver saldos de BTC y USD
/transactions \\- Ver historial de transacciones
/status \\- Estado del bot y tu sesión

*💰 Operaciones de wallet:*
/deposit \\<cantidad\\> \\- Depositar BTC
/withdraw \\<cantidad\\> \\- Retirar USD
/convert\\_btc \\<cantidad\\> \\- Convertir BTC a USD
/convert\\_usd \\<cantidad\\> \\- Convertir USD a BTC

*🤖 Asistente de ahorro:*
/savings\\_advice \\- Obtener consejos de ahorro personalizados

*📝 Ejemplos de uso:*
/deposit 0\\.001
/withdraw 50
/convert\\_btc 0\\.01
/convert\\_usd 100

*💬 Lenguaje natural:*
También puedes escribir comandos en lenguaje natural:
"Deposita 0\\.001 BTC"
"Retira 50 USD"
"Convierte 0\\.01 BTC a USD"
"¿Cuál es mi saldo?"
"Muéstrame mis transacciones"

*🔒 Seguridad:*
• Cada usuario tiene su propio ID único
• Tus datos están seguros y privados
• Las sesiones se manejan automáticamente

*❓ ¿Necesitas ayuda?*
Si tienes problemas, escribe /help o contacta al soporte\\.`;
}

/**
 * Format savings advice message
 */
export function formatSavingsAdviceMessage(suggestions: string, advice: string): string {
  return `🤖 *Consejos de Ahorro Personalizados*

💡 *Sugerencias de ahorro:*
${suggestions}

📈 *Consejos de inversión:*
${advice}

💡 *Tip:* Usa /savings\\_advice para obtener consejos actualizados basados en tu historial\\.`;
}

/**
 * Format operation confirmation message
 */
export function formatOperationConfirmation(
  operation: string,
  amount: number,
  currency: string,
  estimatedFee?: number
): string {
  let message = `⚠️ *Confirmar operación*

🔄 Operación: ${operation}
💰 Cantidad: ${amount} ${currency}`;

  if (estimatedFee) {
    message += `\n💸 Tarifa estimada: ${estimatedFee} ${currency}`;
  }

  message += `

✅ Para confirmar, responde "SI" o "CONFIRMAR"
❌ Para cancelar, responde "NO" o "CANCELAR"`;

  return message;
}

/**
 * Format operation summary message
 */
export function formatOperationSummary(
  operation: string,
  amount: number,
  currency: string,
  newBalance: number,
  transactionId?: string
): string {
  let message = `✅ *${operation} exitoso*

💰 Cantidad: ${amount} ${currency}
💳 Nuevo saldo: ${newBalance} ${currency}`;

  if (transactionId) {
    message += `\n📝 Transacción: ${transactionId}`;
  }

  return message;
}

/**
 * Format deposit success message
 */
export function formatDepositSuccessMessage(
  amount: number,
  newBalance: number,
  invoiceId: string,
  paymentLink?: string
): string {
  let message = `✅ *Depósito de Bitcoin exitoso*

💰 Cantidad depositada: ${amount} BTC
💳 Nuevo saldo BTC: ${newBalance} BTC
📝 Transacción: Deposited ${amount} BTC \\(mock invoice: ${invoiceId}\\)`;

  if (paymentLink) {
    message += `\n\n🔗 Factura de pago: ${paymentLink}`;
  }

  return message;
}

/**
 * Format withdrawal success message
 */
export function formatWithdrawalSuccessMessage(
  amount: number,
  newBalance: number,
  transactionId: string
): string {
  return `✅ *Retiro de USD exitoso*

💰 Cantidad retirada: $${amount} USD
💳 Nuevo saldo USD: $${newBalance} USD
📝 Transacción: ${transactionId}`;
}

/**
 * Format conversion success message
 */
export function formatConversionSuccessMessage(
  fromAmount: number,
  fromCurrency: string,
  toAmount: number,
  toCurrency: string,
  newBalance: number,
  transactionId: string
): string {
  return `✅ *Conversión exitosa*

🔄 Convertido: ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}
💳 Nuevo saldo ${toCurrency}: ${newBalance} ${toCurrency}
📝 Transacción: ${transactionId}`;
} 