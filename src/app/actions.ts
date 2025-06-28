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

// In a real app, you'd get userId from authentication context (e.g., session, token)
// For this prototype, we'll simulate it or expect it to be passed.
const MOCK_TELEGRAM_ID = 950870644; // Replace with actual user ID mechanism

export async function fetchBalancesAction(telegramId: number = MOCK_TELEGRAM_ID): Promise<{ btc: number; usd: number }> {
  try {
    const { balance, tokenBalances } = await getSparkBalanceByTelegramId(telegramId);
    
    // Convert satoshis to BTC
    const btcBalance = balance / 100_000_000;
    
    // For now, USD balance is 0 (will be implemented with UMA/tokens later)
    // TODO: Calculate USD balance from tokenBalances when UMA is implemented
    const usdBalance = 0;
    
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
    // For now, USD withdrawals are not implemented (will be implemented with UMA)
    // This is a placeholder for future UMA integration
    throw new Error('USD withdrawals not yet implemented - will be available with UMA integration');
  } catch (error) {
    console.error('Error processing USD withdrawal:', error);
    throw new Error(`Failed to process USD withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function convertBTCToUSDAction(btcAmount: number, telegramId: number = MOCK_TELEGRAM_ID): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: Transaction }> {
  try {
    // For now, BTC to USD conversion is not implemented (will be implemented with UMA)
    // This is a placeholder for future UMA integration
    throw new Error('BTC to USD conversion not yet implemented - will be available with UMA integration');
  } catch (error) {
    console.error('Error processing BTC to USD conversion:', error);
    throw new Error(`Failed to process BTC to USD conversion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function convertUSDToBTCAction(usdAmount: number, telegramId: number = MOCK_TELEGRAM_ID): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: Transaction }> {
  try {
    // For now, USD to BTC conversion is not implemented (will be implemented with UMA)
    // This is a placeholder for future UMA integration
    throw new Error('USD to BTC conversion not yet implemented - will be available with UMA integration');
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
