/**
 * @fileOverview Simple command processor that works without AI
 * 
 * This is a temporary solution while the Google AI API key is being configured.
 * It uses regex patterns to understand basic commands.
 */

export interface SimpleCommandResult {
  success: boolean;
  intent: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

/**
 * Simple command processor using regex patterns
 */
export function processSimpleCommand(command: string): SimpleCommandResult {
  console.log('🔍 SimpleCommandProcessor: Procesando comando:', command);
  
  const lowerCommand = command.toLowerCase().trim();
  console.log('🔍 SimpleCommandProcessor: Comando en minúsculas:', lowerCommand);
  
  // Check balance patterns
  if (lowerCommand.includes('saldo') || 
      lowerCommand.includes('balance') || 
      lowerCommand.includes('ver saldo') ||
      lowerCommand.includes('cuánto tengo') ||
      lowerCommand.includes('cuanto tengo') ||
      lowerCommand.includes('mi saldo') ||
      lowerCommand.includes('mostrar saldo')) {
    console.log('🔍 SimpleCommandProcessor: Detectado intent: check_balance');
    return {
      success: true,
      intent: 'check_balance',
      message: 'Comando procesado: Verificar saldos'
    };
  }
  
  // Deposit patterns
  const depositMatch = lowerCommand.match(/(?:deposita|depositar|depósito|deposito)\s+([\d.]+)\s*(?:btc|bitcoin)/i);
  if (depositMatch) {
    const amount = parseFloat(depositMatch[1]);
    console.log('🔍 SimpleCommandProcessor: Detectado intent: deposit, amount:', amount);
    return {
      success: true,
      intent: 'deposit',
      amount: amount,
      currency: 'btc',
      message: `Comando procesado: Depositar ${amount} BTC`
    };
  }
  
  // Withdraw patterns
  const withdrawMatch = lowerCommand.match(/(?:retira|retirar|retiro)\s+([\d.]+)\s*(?:usd|dólares|dolares)/i);
  if (withdrawMatch) {
    const amount = parseFloat(withdrawMatch[1]);
    console.log('🔍 SimpleCommandProcessor: Detectado intent: withdraw, amount:', amount);
    return {
      success: true,
      intent: 'withdraw',
      amount: amount,
      currency: 'usd',
      message: `Comando procesado: Retirar ${amount} USD`
    };
  }
  
  // Convert BTC to USD patterns
  const convertBtcMatch = lowerCommand.match(/(?:convierte|convertir|conversión|conversion)\s+([\d.]+)\s*(?:btc|bitcoin)\s+(?:a|to|en)\s*(?:usd|dólares|dolares)/i);
  if (convertBtcMatch) {
    const amount = parseFloat(convertBtcMatch[1]);
    console.log('🔍 SimpleCommandProcessor: Detectado intent: convert_to_usd, amount:', amount);
    return {
      success: true,
      intent: 'convert_to_usd',
      amount: amount,
      message: `Comando procesado: Convertir ${amount} BTC a USD`
    };
  }
  
  // Convert USD to BTC patterns
  const convertUsdMatch = lowerCommand.match(/(?:convierte|convertir|conversión|conversion)\s+([\d.]+)\s*(?:usd|dólares|dolares)\s+(?:a|to|en)\s*(?:btc|bitcoin)/i);
  if (convertUsdMatch) {
    const amount = parseFloat(convertUsdMatch[1]);
    console.log('🔍 SimpleCommandProcessor: Detectado intent: convert_to_btc, amount:', amount);
    return {
      success: true,
      intent: 'convert_to_btc',
      amount: amount,
      message: `Comando procesado: Convertir ${amount} USD a BTC`
    };
  }
  
  // Fund wallet patterns (for testing)
  const fundMatch = lowerCommand.match(/(?:fondea|fondear|fund)\s+([\d.]+)\s*(?:btc|bitcoin)/i);
  if (fundMatch) {
    const amount = parseFloat(fundMatch[1]);
    console.log('🔍 SimpleCommandProcessor: Detectado intent: fund_wallet, amount:', amount);
    return {
      success: true,
      intent: 'fund_wallet',
      amount: amount,
      currency: 'btc',
      message: `Comando procesado: Fondear wallet con ${amount} BTC`
    };
  }
  
  // Price check patterns (cuánto vale, precio, etc.)
  const priceMatch = lowerCommand.match(/(?:cuánto|cuanto|precio|vale)\s+(?:es|vale)\s+([\d.]+)\s*(?:btc|bitcoin)\s+(?:en|a)\s*(?:usd|dólares|dolares)/i);
  if (priceMatch) {
    const amount = parseFloat(priceMatch[1]);
    console.log('🔍 SimpleCommandProcessor: Detectado intent: convert_to_usd (price check), amount:', amount);
    return {
      success: true,
      intent: 'convert_to_usd',
      amount: amount,
      message: `Comando procesado: Ver precio de ${amount} BTC en USD`
    };
  }
  
  // Transactions patterns
  if (lowerCommand.includes('transacciones') || 
      lowerCommand.includes('historial') || 
      lowerCommand.includes('movimientos') ||
      lowerCommand.includes('mis transacciones') ||
      lowerCommand.includes('ver transacciones')) {
    console.log('🔍 SimpleCommandProcessor: Detectado intent: check_transactions');
    return {
      success: true,
      intent: 'check_transactions',
      message: 'Comando procesado: Ver transacciones'
    };
  }
  
  // Savings advice patterns
  if (lowerCommand.includes('consejos') || 
      lowerCommand.includes('ahorro') || 
      lowerCommand.includes('savings') ||
      lowerCommand.includes('inversión') ||
      lowerCommand.includes('inversion') ||
      lowerCommand.includes('tips') ||
      lowerCommand.includes('sugerencias')) {
    console.log('🔍 SimpleCommandProcessor: Detectado intent: savings_advice');
    return {
      success: true,
      intent: 'savings_advice',
      message: 'Comando procesado: Consejos de ahorro'
    };
  }
  
  // Help patterns
  if (lowerCommand.includes('ayuda') || 
      lowerCommand.includes('help') || 
      lowerCommand.includes('comandos') ||
      lowerCommand.includes('qué puedo hacer') ||
      lowerCommand.includes('que puedo hacer')) {
    console.log('🔍 SimpleCommandProcessor: Detectado intent: help');
    return {
      success: true,
      intent: 'help',
      message: 'Comando procesado: Ayuda'
    };
  }
  
  // Welcome patterns
  if (lowerCommand.includes('hola') || 
      lowerCommand.includes('hello') || 
      lowerCommand.includes('hi') ||
      lowerCommand.includes('buenos días') ||
      lowerCommand.includes('buenas tardes') ||
      lowerCommand.includes('buenas noches')) {
    console.log('🔍 SimpleCommandProcessor: Detectado intent: welcome');
    return {
      success: true,
      intent: 'welcome',
      message: 'Comando procesado: Mensaje de bienvenida'
    };
  }
  
  console.log('🔍 SimpleCommandProcessor: Comando no reconocido');
  return {
    success: false,
    intent: 'unknown',
    error: 'Comando no reconocido'
  };
}

/**
 * Validate command parameters
 */
export function validateSimpleCommandParams(
  intent: string, 
  amount?: number, 
  currency?: string
): { valid: boolean; error?: string } {
  
  // Validate amount for operations that require it
  if (['deposit', 'withdraw', 'convert_to_usd', 'convert_to_btc', 'fund_wallet'].includes(intent)) {
    if (!amount || amount <= 0) {
      return { 
        valid: false, 
        error: 'Por favor especifica una cantidad válida mayor a 0' 
      };
    }
  }
  
  // Validate currency for deposit/withdraw operations
  if (intent === 'deposit' && currency?.toLowerCase() !== 'btc') {
    return { 
      valid: false, 
      error: 'Solo se pueden depositar Bitcoin (BTC)' 
    };
  }
  
  if (intent === 'withdraw' && currency?.toLowerCase() !== 'usd') {
    return { 
      valid: false, 
      error: 'Solo se pueden retirar USD' 
    };
  }
  
  if (intent === 'fund_wallet' && currency?.toLowerCase() !== 'btc') {
    return { 
      valid: false, 
      error: 'Solo se puede fondear con Bitcoin (BTC)' 
    };
  }
  
  return { valid: true };
} 