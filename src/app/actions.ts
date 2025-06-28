'use server';

import type { Transaction } from '@/components/spark-chat/TransactionHistoryCard';
import { 
  getSparkBalanceByTelegramId,
  getSparkTransfersByTelegramId,
  getSparkDepositAddressByTelegramId,
  createSparkLightningInvoiceByTelegramId,
  withdrawSparkOnChainByTelegramId,
  paySparkLightningInvoiceByTelegramId,
  claimSparkDepositByTelegramId,
  getSparkAddressByTelegramId
} from '@/services/spark';
import { 
  sendUMAPayment, 
  getUMAQuote, 
  generateUMAAddress,
  validateUMAAddress 
} from '@/services/uma';

// In a real app, you'd get userId from authentication context (e.g., session, token)
// For this prototype, we'll simulate it or expect it to be passed.
const MOCK_TELEGRAM_ID = 950870644; // Replace with actual user ID mechanism

export async function fetchBalancesAction(telegramId: number = MOCK_TELEGRAM_ID): Promise<{ btc: number; usd: number }> {
  try {
    const { balance, tokenBalances } = await getSparkBalanceByTelegramId(telegramId);
    
    // Convert satoshis to BTC
    const btcBalance = balance / 100_000_000;
    
    // Calculate USD balance from UMA conversions
    // For now, we'll use a mock USD balance based on BTC holdings
    // In production, this would be tracked separately via UMA
    const btcToUsdQuote = await getUMAQuote('BTC', 'USD', btcBalance);
    const usdBalance = btcToUsdQuote.convertedAmount;
    
    return {
      btc: btcBalance,
      usd: usdBalance
    };
  } catch (error) {
    console.error('Error fetching balances:', error);
    throw new Error(`Failed to fetch balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function fetchTransactionsAction(telegramId: number = MOCK_TELEGRAM_ID): Promise<Transaction[]> {
  try {
    return await getSparkTransfersByTelegramId(telegramId);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function depositBTCAction(amount: number, telegramId: number = MOCK_TELEGRAM_ID): Promise<{ newBtcBalance: number; transaction: Transaction; invoice?: string }> {
  try {
    // Convert BTC to satoshis
    const amountSats = Math.round(amount * 100_000_000);
    
    // Create Lightning invoice for deposit
    const invoice = await createSparkLightningInvoiceByTelegramId(telegramId, amountSats, `Depósito de ${amount} BTC`);
    
    // Get updated balance
    const { balance } = await getSparkBalanceByTelegramId(telegramId);
    const newBtcBalance = balance / 100_000_000;
    
    // Create transaction record
    const transaction: Transaction = {
      id: `deposit_${Date.now()}`,
      type: 'deposit',
      amount: amount,
      currency: 'BTC',
      timestamp: new Date(),
      description: `Depósito Lightning de ${amount} BTC`,
      status: 'PENDING'
    };
    
    return {
      newBtcBalance,
      transaction,
      invoice
    };
  } catch (error) {
    console.error('Error processing BTC deposit:', error);
    throw new Error(`Failed to process BTC deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function withdrawUSDAction(amount: number, targetAddress: string = "mock_target_address", telegramId: number = MOCK_TELEGRAM_ID): Promise<{ newUsdBalance: number; transaction: Transaction }> {
  try {
    console.log(`UMA ACTION: Processing USD withdrawal of ${amount} USD to ${targetAddress}`);
    
    // Validate if targetAddress is a UMA address
    if (!validateUMAAddress(targetAddress)) {
      throw new Error('Invalid UMA address format. Expected format: username@domain.btc');
    }
    
    // Get current balances
    const { btc: currentBtc, usd: currentUsd } = await fetchBalancesAction(telegramId);
    
    // Check if user has sufficient USD balance
    if (currentUsd < amount) {
      throw new Error(`Insufficient USD balance. Required: ${amount} USD, Available: ${currentUsd} USD`);
    }
    
    // Send UMA payment for USD withdrawal
    const umaResult = await sendUMAPayment(telegramId, targetAddress, amount, 'USD', 'USD withdrawal');
    
    if (!umaResult.success) {
      throw new Error(`UMA payment failed: ${umaResult.error}`);
    }
    
    // Calculate new USD balance (subtract withdrawn amount)
    const newUsdBalance = currentUsd - amount;
    
    // Create transaction record
    const transaction: Transaction = {
      id: umaResult.paymentId || `withdraw_usd_${Date.now()}`,
      type: 'withdrawal',
      amount: amount,
      currency: 'USD',
      timestamp: new Date(),
      description: `Retiro USD de ${amount} USD a ${targetAddress}`,
      status: 'COMPLETED'
    };
    
    return {
      newUsdBalance,
      transaction
    };
  } catch (error) {
    console.error('Error processing USD withdrawal:', error);
    throw new Error(`Failed to process USD withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function convertBTCToUSDAction(btcAmount: number, telegramId: number = MOCK_TELEGRAM_ID): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: Transaction }> {
  try {
    console.log(`UMA ACTION: Converting ${btcAmount} BTC to USD`);
    
    // Get current balances
    const { btc: currentBtc, usd: currentUsd } = await fetchBalancesAction(telegramId);
    
    // Check if user has sufficient BTC balance
    if (currentBtc < btcAmount) {
      throw new Error(`Insufficient BTC balance. Required: ${btcAmount} BTC, Available: ${currentBtc} BTC`);
    }
    
    // Get UMA quote for BTC to USD conversion
    const quote = await getUMAQuote('BTC', 'USD', btcAmount);
    
    // Calculate new balances
    const newBtcBalance = currentBtc - btcAmount;
    const newUsdBalance = currentUsd + quote.convertedAmount;
    
    // Create transaction record
    const transaction: Transaction = {
      id: `convert_btc_usd_${Date.now()}`,
      type: 'conversion',
      amount: btcAmount,
      currency: 'BTC',
      timestamp: new Date(),
      description: `Conversión de ${btcAmount} BTC a ${quote.convertedAmount.toFixed(2)} USD (Tasa: ${quote.exchangeRate.toFixed(2)})`,
      status: 'COMPLETED'
    };
    
    return {
      newBtcBalance,
      newUsdBalance,
      transaction
    };
  } catch (error) {
    console.error('Error processing BTC to USD conversion:', error);
    throw new Error(`Failed to process BTC to USD conversion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function convertUSDToBTCAction(usdAmount: number, telegramId: number = MOCK_TELEGRAM_ID): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: Transaction }> {
  try {
    console.log(`UMA ACTION: Converting ${usdAmount} USD to BTC`);
    
    // Get current balances
    const { btc: currentBtc, usd: currentUsd } = await fetchBalancesAction(telegramId);
    
    // Check if user has sufficient USD balance
    if (currentUsd < usdAmount) {
      throw new Error(`Insufficient USD balance. Required: ${usdAmount} USD, Available: ${currentUsd} USD`);
    }
    
    // Get UMA quote for USD to BTC conversion
    const quote = await getUMAQuote('USD', 'BTC', usdAmount);
    
    // Calculate new balances
    const newUsdBalance = currentUsd - usdAmount;
    const newBtcBalance = currentBtc + quote.convertedAmount;
    
    // Create transaction record
    const transaction: Transaction = {
      id: `convert_usd_btc_${Date.now()}`,
      type: 'conversion',
      amount: usdAmount,
      currency: 'USD',
      timestamp: new Date(),
      description: `Conversión de ${usdAmount} USD a ${quote.convertedAmount.toFixed(8)} BTC (Tasa: ${quote.exchangeRate.toFixed(8)})`,
      status: 'COMPLETED'
    };
    
    return {
      newUsdBalance,
      newBtcBalance,
      transaction
    };
  } catch (error) {
    console.error('Error processing USD to BTC conversion:', error);
    throw new Error(`Failed to process USD to BTC conversion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// New Spark-specific actions

export async function getDepositAddressAction(telegramId: number = MOCK_TELEGRAM_ID): Promise<string> {
  try {
    return await getSparkDepositAddressByTelegramId(telegramId);
  } catch (error) {
    console.error('Error getting deposit address:', error);
    throw new Error(`Failed to get deposit address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function claimDepositAction(txId: string, telegramId: number = MOCK_TELEGRAM_ID): Promise<boolean> {
  try {
    return await claimSparkDepositByTelegramId(telegramId, txId);
  } catch (error) {
    console.error('Error claiming deposit:', error);
    throw new Error(`Failed to claim deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function withdrawBTCAction(amount: number, btcAddress: string, telegramId: number = MOCK_TELEGRAM_ID): Promise<{ success: boolean; requestId?: string }> {
  try {
    // Convert BTC to satoshis
    const amountSats = Math.round(amount * 100_000_000);
    
    return await withdrawSparkOnChainByTelegramId(telegramId, amountSats, btcAddress);
  } catch (error) {
    console.error('Error processing BTC withdrawal:', error);
    throw new Error(`Failed to process BTC withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function payLightningInvoiceAction(invoice: string, maxFeeSats: number = 5, telegramId: number = MOCK_TELEGRAM_ID): Promise<boolean> {
  try {
    return await paySparkLightningInvoiceByTelegramId(telegramId, invoice, maxFeeSats);
  } catch (error) {
    console.error('Error paying Lightning invoice:', error);
    throw new Error(`Failed to pay Lightning invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getSparkAddressAction(telegramId: number = MOCK_TELEGRAM_ID): Promise<string> {
  try {
    return await getSparkAddressByTelegramId(telegramId);
  } catch (error) {
    console.error('Error getting Spark address:', error);
    throw new Error(`Failed to get Spark address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// New UMA-specific actions

export async function getUMAAddressAction(telegramId: number = MOCK_TELEGRAM_ID): Promise<string> {
  try {
    return await generateUMAAddress(telegramId);
  } catch (error) {
    console.error('Error getting UMA address:', error);
    throw new Error(`Failed to get UMA address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function sendUMAPaymentAction(
  toUMAAddress: string, 
  amount: number, 
  currency: 'BTC' | 'USD' | 'EUR' | 'GBP',
  memo?: string,
  telegramId: number = MOCK_TELEGRAM_ID
): Promise<{ success: boolean; paymentId?: string; transaction: Transaction }> {
  try {
    const umaResult = await sendUMAPayment(telegramId, toUMAAddress, amount, currency, memo);
    
    if (!umaResult.success) {
      throw new Error(`UMA payment failed: ${umaResult.error}`);
    }
    
    // Create transaction record
    const transaction: Transaction = {
      id: umaResult.paymentId || `uma_payment_${Date.now()}`,
      type: 'payment',
      amount: amount,
      currency: currency,
      timestamp: new Date(),
      description: `Pago UMA de ${amount} ${currency} a ${toUMAAddress}${memo ? ` - ${memo}` : ''}`,
      status: 'COMPLETED'
    };
    
    return {
      success: true,
      paymentId: umaResult.paymentId,
      transaction
    };
  } catch (error) {
    console.error('Error sending UMA payment:', error);
    throw new Error(`Failed to send UMA payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
