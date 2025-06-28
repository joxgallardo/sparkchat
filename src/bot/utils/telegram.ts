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
/balance \\- Ver saldos de BTC y USD \\(sincroniza Lightning automáticamente\\)
/transactions \\- Ver historial de transacciones
/status \\- Estado del bot y tu sesión

*⚡ Operaciones Lightning:*
/deposit \\<cantidad\\> \\- Generar factura Lightning para recibir BTC
/deposit \\- Obtener dirección on\\-chain para depósito de BTC
/pay \\<invoice\\> \\- Pagar factura Lightning a otros
/spark\\_address \\- Obtener dirección Spark para transferencias internas

*🔗 Operaciones On\\-Chain:*
/deposit\\_address \\- Obtener dirección on\\-chain \\(mismo que /deposit\\)
/claim \\<txid\\> \\- Reclamar depósito on\\-chain después de confirmaciones
/withdraw \\<cantidad\\> \\<dirección\\> \\- Retirar BTC on\\-chain

*🪙 Operaciones LRC\\-20 Tokens:*
/tokens \\- Ver saldos de tokens LRC\\-20
/transfer \\<token\\> \\<cantidad\\> \\<dirección\\> \\- Transferir tokens LRC\\-20
/tokeninfo \\<pubkey\\> \\- Obtener información de un token

*🌐 Operaciones UMA \\(Cross\\-Currency\\):*
/uma\\_address \\- Ver tu dirección UMA para pagos cross\\-currency
/send\\_uma \\<cantidad\\> \\<moneda\\> \\<dirección\\> \\- Enviar pago UMA
/quote\\_uma \\<cantidad\\> \\<origen\\> \\<destino\\> \\- Obtener cotización UMA
/uma\\_history \\- Ver historial de pagos UMA
/uma\\_test \\- Probar conectividad UMA
/uma\\_help \\- Ayuda específica de UMA

*💵 Operaciones USD \\(Legacy\\):*
/withdraw\\_usd \\<cantidad\\> \\- Retirar USD \\(próximamente con UMA\\)
/convert\\_btc \\<cantidad\\> \\- Convertir BTC a USD \\(próximamente\\)
/convert\\_usd \\<cantidad\\> \\- Convertir USD a BTC \\(próximamente\\)

*🤖 Asistente de ahorro:*
/savings\\_advice \\- Obtener consejos de ahorro personalizados

*📝 Ejemplos de uso Lightning:*
/deposit 0\\.001 \\- Generar invoice Lightning por 0\\.001 BTC
/deposit 100000 sats \\- Generar invoice Lightning por 100,000 satoshis
/deposit \\- Obtener dirección on\\-chain para enviar BTC
/pay lnbc1... \\- Pagar factura Lightning
/claim abc123def456... \\- Reclamar depósito on\\-chain con TXID
/withdraw 0\\.0005 bc1q... \\- Retirar 0\\.0005 BTC a dirección
/spark\\_address \\- Ver tu dirección Spark para transferencias internas

*📝 Ejemplos de uso LRC\\-20:*
/tokens \\- Ver todos tus tokens LRC\\-20
/transfer abc123... 100 bc1q... \\- Transferir 100 tokens
/tokeninfo abc123... \\- Ver información del token

*📝 Ejemplos de uso UMA:*
/uma\\_address \\- Ver tu dirección UMA
/send\\_uma 50 USD user123@bitnob\\.btc \\- Enviar 50 USD
/quote\\_uma 100 USD BTC \\- Cotizar 100 USD a BTC
/uma\\_history \\- Ver pagos UMA recientes

*💡 Consejos Lightning:*
• Los pagos Lightning se confirman en segundos
• Las facturas expiran en 24 horas
• Usa /balance para sincronizar pagos automáticamente
• Asegúrate de estar en la misma red \\(testnet/mainnet\\)

*💡 Consejos LRC\\-20:*
• Los tokens LRC\\-20 son tokens nativos de Bitcoin
• Las transferencias usan la red Bitcoin
• Las fees son mínimas
• Confirmación en 1\\-3 bloques
• Soporta cualquier token LRC\\-20

*💡 Consejos UMA:*
• Comparte tu dirección UMA para recibir pagos
• Los pagos se convierten automáticamente
• Las fees son mínimas \\(0\\.1%\\)
• Confirmación en 2\\-5 minutos
• Soporta BTC, USD, EUR, GBP

*💬 Lenguaje natural:*
También puedes escribir comandos en lenguaje natural:
"Deposita 0\\.001 BTC"
"Retira 50 USD"
"Convierte 0\\.01 BTC a USD"
"¿Cuál es mi saldo?"
"Muéstrame mis transacciones"
"Transfiere 100 tokens"

*🔒 Seguridad:*
• Cada usuario tiene su propio ID único
• Tus datos están seguros y privados
• Las sesiones se manejan automáticamente
• Wallets autocustodiadas con Spark

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