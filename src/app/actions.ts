
'use server';

import type { Transaction } from '@/components/spark-chat/TransactionHistoryCard';
import { 
  getLightsparkBalances,
  getLightsparkTransactionHistory,
  depositBTCWithLightspark,
  withdrawUSDWithLightspark,
  convertBTCToUSDWithLightspark,
  convertUSDToBTCWithLightspark,
} from '@/services/lightspark';

export async function fetchBalancesAction(): Promise<{ btc: number; usd: number }> {
  return getLightsparkBalances();
}

export async function fetchTransactionsAction(): Promise<Transaction[]> {
  return getLightsparkTransactionHistory();
}

export async function depositBTCAction(amount: number): Promise<{ newBtcBalance: number; transaction: Transaction }> {
  return depositBTCWithLightspark(amount);
}

export async function withdrawUSDAction(amount: number): Promise<{ newUsdBalance: number; transaction: Transaction }> {
  return withdrawUSDWithLightspark(amount);
}

export async function convertBTCToUSDAction(btcAmount: number): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: Transaction }> {
  return convertBTCToUSDWithLightspark(btcAmount);
}

export async function convertUSDToBTCAction(usdAmount: number): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: Transaction }> {
  return convertUSDToBTCWithLightspark(usdAmount);
}
