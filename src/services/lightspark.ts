// src/services/lightspark.ts
'use server';

/**
 * @fileOverview Placeholder service for Lightspark interactions.
 * Replace the mock implementations with actual Lightspark SDK calls.
 * Ensure API keys and sensitive configurations are handled securely,
 * typically via environment variables (see .env.example).
 */

import type { Transaction } from '@/components/spark-chat/TransactionHistoryCard';

// --- MOCK DATA ---
// These are placeholders. In a real app, this data would come from Lightspark.
let MOCK_BTC_BALANCE = 0.05;
let MOCK_USD_BALANCE = 1000;
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_init_1',
    type: 'deposit',
    amount: 0.02,
    currency: 'BTC',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    description: 'Initial mock BTC deposit',
  },
  {
    id: 'tx_init_2',
    type: 'deposit',
    amount: 500,
    currency: 'USD',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    description: 'Initial mock USD deposit (converted)',
  },
];
const BITCOIN_TO_USD_RATE = 50000; // Example static rate for mock conversions

// --- HELPER (Illustrative) ---
// function getLightsparkClient() {
//   // const clientId = process.env.LIGHTSPARK_API_TOKEN_CLIENT_ID;
//   // const clientSecret = process.env.LIGHTSPARK_API_TOKEN_CLIENT_SECRET;
//   // const nodeId = process.env.LIGHTSPARK_NODE_ID;
//   // if (!clientId || !clientSecret || !nodeId) {
//   //   throw new Error('Lightspark API credentials not configured.');
//   // }
//   // Initialize and return Lightspark SDK client here
//   // return new LightsparkClient({ apiKey: apiToken, serverUrl: process.env.LIGHTSPARK_BASE_URL });
//   console.warn('Lightspark client is not implemented. Using mock data.');
//   return null; // Placeholder
// }

// --- SERVICE FUNCTIONS ---

export async function getLightsparkBalances(): Promise<{ btc: number; usd: number }> {
  console.log('SERVICE: Attempting to fetch Lightspark balances (MOCK)');
  // TODO: Replace with actual Lightspark SDK call
  // const client = getLightsparkClient();
  // const balances = await client.getAccountBalances(); // Example SDK call
  // return { btc: balances.btc, usd: balances.fiat.usd };
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  return { btc: MOCK_BTC_BALANCE, usd: MOCK_USD_BALANCE };
}

export async function getLightsparkTransactionHistory(): Promise<Transaction[]> {
  console.log('SERVICE: Attempting to fetch Lightspark transaction history (MOCK)');
  // TODO: Replace with actual Lightspark SDK call
  // const client = getLightsparkClient();
  // const history = await client.getTransactions(); // Example SDK call
  // return history.map(tx => ({ /* map to Transaction type */ }));
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_TRANSACTIONS].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export async function depositBTCWithLightspark(amount: number): Promise<{ newBtcBalance: number; transaction: Transaction }> {
  console.log(`SERVICE: Attempting to deposit ${amount} BTC via Lightspark (MOCK)`);
  if (amount <= 0) throw new Error('Deposit amount must be positive.');
  // TODO: Replace with actual Lightspark SDK call
  // const client = getLightsparkClient();
  // const invoice = await client.createInvoice(amount, 'BTC', 'SparkChat Deposit'); // Example
  // console.log('SERVICE: Generated Lightspark invoice:', invoice.paymentRequest);
  // For this mock, we'll just update the balance. In reality, you'd wait for payment to the invoice.
  MOCK_BTC_BALANCE += amount;
  const newTransaction: Transaction = {
    id: `tx_${crypto.randomUUID()}`,
    type: 'deposit',
    amount,
    currency: 'BTC',
    timestamp: new Date(),
    description: `Deposited ${amount} BTC`,
  };
  MOCK_TRANSACTIONS.push(newTransaction);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { newBtcBalance: MOCK_BTC_BALANCE, transaction: newTransaction };
}

export async function withdrawUSDWithLightspark(amount: number): Promise<{ newUsdBalance: number; transaction: Transaction }> {
  console.log(`SERVICE: Attempting to withdraw ${amount} USD via Lightspark (MOCK)`);
  if (amount <= 0) throw new Error('Withdrawal amount must be positive.');
  if (MOCK_USD_BALANCE < amount) throw new Error('Insufficient USD balance.');
  // TODO: Replace with actual Lightspark SDK call
  // const client = getLightsparkClient();
  // const payment = await client.sendPaymentToFiatAddress(amount, 'USD', 'user_bank_details'); // Example
  MOCK_USD_BALANCE -= amount;
  const newTransaction: Transaction = {
    id: `tx_${crypto.randomUUID()}`,
    type: 'withdraw',
    amount,
    currency: 'USD',
    timestamp: new Date(),
    description: `Withdrew ${amount} USD`,
  };
  MOCK_TRANSACTIONS.push(newTransaction);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { newUsdBalance: MOCK_USD_BALANCE, transaction: newTransaction };
}

export async function convertBTCToUSDWithLightspark(btcAmount: number): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: Transaction }> {
  console.log(`SERVICE: Attempting to convert ${btcAmount} BTC to USD via Lightspark (MOCK)`);
  if (btcAmount <= 0) throw new Error('Conversion amount must be positive.');
  if (MOCK_BTC_BALANCE < btcAmount) throw new Error('Insufficient BTC balance.');
  // TODO: Replace with actual Lightspark SDK call for sell/conversion
  // const client = getLightsparkClient();
  // const conversionResult = await client.sellBitcoin(btcAmount); // Example
  const convertedUsd = btcAmount * BITCOIN_TO_USD_RATE; // Using mock rate
  MOCK_BTC_BALANCE -= btcAmount;
  MOCK_USD_BALANCE += convertedUsd;
  const newTransaction: Transaction = {
    id: `tx_${crypto.randomUUID()}`,
    type: 'convert_to_usd',
    amount: btcAmount,
    currency: 'BTC',
    convertedAmount: convertedUsd,
    convertedCurrency: 'USD',
    timestamp: new Date(),
    description: `Converted ${btcAmount} BTC to ${convertedUsd.toFixed(2)} USD`,
  };
  MOCK_TRANSACTIONS.push(newTransaction);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { newBtcBalance: MOCK_BTC_BALANCE, newUsdBalance: MOCK_USD_BALANCE, transaction: newTransaction };
}

export async function convertUSDToBTCWithLightspark(usdAmount: number): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: Transaction }> {
  console.log(`SERVICE: Attempting to convert ${usdAmount} USD to BTC via Lightspark (MOCK)`);
  if (usdAmount <= 0) throw new Error('Conversion amount must be positive.');
  if (MOCK_USD_BALANCE < usdAmount) throw new Error('Insufficient USD balance.');
  // TODO: Replace with actual Lightspark SDK call for buy/conversion
  // const client = getLightsparkClient();
  // const conversionResult = await client.buyBitcoin(usdAmount); // Example
  const convertedBtc = usdAmount / BITCOIN_TO_USD_RATE; // Using mock rate
  MOCK_USD_BALANCE -= usdAmount;
  MOCK_BTC_BALANCE += convertedBtc;
  const newTransaction: Transaction = {
    id: `tx_${crypto.randomUUID()}`,
    type: 'convert_to_btc',
    amount: usdAmount,
    currency: 'USD',
    convertedAmount: convertedBtc,
    convertedCurrency: 'BTC',
    timestamp: new Date(),
    description: `Converted ${usdAmount} USD to ${convertedBtc.toFixed(8)} BTC`,
  };
  MOCK_TRANSACTIONS.push(newTransaction);
  await new Promise(resolve => setTimeout(resolve, 500));
  return { newUsdBalance: MOCK_USD_BALANCE, newBtcBalance: MOCK_BTC_BALANCE, transaction: newTransaction };
}
