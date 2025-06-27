/**
 * @fileOverview Service that processes natural language commands using AI flows
 * 
 * This service acts as a bridge between the Telegram bot and the AI flows,
 * providing a unified interface for command processing and intent recognition.
 */

import { understandCommand, type UnderstandCommandOutput } from '@/ai/flows/understand-command';
import { getSavingsSuggestions } from '@/ai/flows/savings-assistant';

export interface CommandProcessorResult {
  success: boolean;
  intent: string;
  amount?: number;
  currency?: string;
  message?: string;
  error?: string;
}

export interface SavingsAssistantResult {
  success: boolean;
  suggestions?: string;
  advice?: string;
  error?: string;
}

/**
 * Process natural language commands using the understandCommand AI flow
 */
export async function processCommand(command: string): Promise<CommandProcessorResult> {
  console.log('🔍 CommandProcessor: Procesando comando:', command);
  
  try {
    console.log('🔍 CommandProcessor: Llamando a understandCommand...');
    const result: UnderstandCommandOutput = await understandCommand({ command });
    console.log('🔍 CommandProcessor: Resultado de understandCommand:', result);
    
    const processorResult = {
      success: result.intent !== 'unknown',
      intent: result.intent,
      amount: result.amount,
      currency: result.currency,
      message: `Comando procesado: ${result.intent}${result.amount ? ` - ${result.amount} ${result.currency || ''}` : ''}`
    };
    
    console.log('🔍 CommandProcessor: Resultado final:', processorResult);
    return processorResult;
  } catch (error) {
    console.error('❌ CommandProcessor: Error procesando comando:', error);
    return {
      success: false,
      intent: 'unknown',
      error: 'Error al procesar el comando'
    };
  }
}

/**
 * Get savings suggestions using the savings assistant AI flow
 */
export async function getSavingsAdvice(
  savingsPatterns: string, 
  financialGoals: string
): Promise<SavingsAssistantResult> {
  try {
    const result = await getSavingsSuggestions({
      savingsPatterns,
      financialGoals
    });
    
    return {
      success: true,
      suggestions: result.savingsSuggestions,
      advice: result.investmentAdvice
    };
  } catch (error) {
    console.error('Error getting savings advice:', error);
    return {
      success: false,
      error: 'Error al obtener consejos de ahorro'
    };
  }
}

/**
 * Validate command parameters
 */
export function validateCommandParams(
  intent: string, 
  amount?: number, 
  currency?: string
): { valid: boolean; error?: string } {
  
  // Validate amount for operations that require it
  if (['deposit', 'withdraw', 'convert_to_usd', 'convert_to_btc'].includes(intent)) {
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
  
  return { valid: true };
}

/**
 * Get human-readable intent description
 */
export function getIntentDescription(intent: string): string {
  const descriptions: Record<string, string> = {
    'check_balance': 'Verificar saldos',
    'deposit': 'Depositar Bitcoin',
    'withdraw': 'Retirar USD',
    'convert_to_usd': 'Convertir BTC a USD',
    'convert_to_btc': 'Convertir USD a BTC',
    'unknown': 'Comando no reconocido'
  };
  
  return descriptions[intent] || 'Operación desconocida';
} 