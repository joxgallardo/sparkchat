
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

// In a real app, you'd get userId from authentication context (e.g., session, token)
// For this prototype, we'll simulate it or expect it to be passed.
const MOCK_USER_ID = 'test-user-123'; // Replace with actual user ID mechanism

export async function fetchBalancesAction(userId: string = MOCK_USER_ID): Promise<{ btc: number; usd: number }> {
  return getLightsparkBalances(userId);
}

export async function fetchTransactionsAction(userId: string = MOCK_USER_ID): Promise<Transaction[]> {
  return getLightsparkTransactionHistory(userId);
}

export async function depositBTCAction(amount: number, userId: string = MOCK_USER_ID): Promise<{ newBtcBalance: number; transaction: Transaction; invoice?: string }> {
  return depositBTCWithLightspark(userId, amount);
}

// For withdrawal, targetAddress (e.g. bank details, another crypto address) would be needed.
// Adding it as a placeholder. The command understanding AI would need to extract this.
export async function withdrawUSDAction(amount: number, targetAddress: string = "mock_target_address", userId: string = MOCK_USER_ID): Promise<{ newUsdBalance: number; transaction: Transaction }> {
  return withdrawUSDWithLightspark(userId, amount, targetAddress);
}

export async function convertBTCToUSDAction(btcAmount: number, userId: string = MOCK_USER_ID): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: Transaction }> {
  return convertBTCToUSDWithLightspark(userId, btcAmount);
}

export async function convertUSDToBTCAction(usdAmount: number, userId: string = MOCK_USER_ID): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: Transaction }> {
  return convertUSDToBTCWithLightspark(userId, usdAmount);
}
