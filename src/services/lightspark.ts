
// src/services/lightspark.ts
'use server';

/**
 * @fileOverview Service for Lightspark interactions.
 * This file contains functions to interact with the Lightspark SDK.
 * It uses a placeholder client and mock implementations.
 * Replace these with actual Lightspark SDK calls and error handling.
 * API keys and sensitive configurations are handled via environment variables.
 */

// Note: The 'AccountTokenAuthProvider' was removed from this import because it was causing a compile error.
// You will need to find the correct authentication provider from the Lightspark SDK documentation for your version.
import { LightsparkClient, BitcoinNetwork, TransactionStatus } from '@lightsparkdev/wallet-sdk';
import type { CurrencyAmount, Transaction as LightsparkSdkTransaction } from '@lightsparkdev/wallet-sdk';
import type { Transaction as AppTransaction } from '@/components/spark-chat/TransactionHistoryCard'; // Our app's Transaction type
import { getUserLightsparkConfig } from '@/services/database'; // To get user-specific walletId

// --- Lightspark Client Initialization ---
let lightsparkClientInstance: LightsparkClient | null = null;

function getLightsparkClient(): LightsparkClient {
  if (lightsparkClientInstance) {
    return lightsparkClientInstance;
  }

  // To use the real Lightspark SDK, set USE_MOCK_CLIENT to "false" or remove it from your .env file
  // and ensure your Lightspark credentials are set.
  if (process.env.USE_MOCK_CLIENT === 'true') {
    console.warn("LIGHTSPARK SERVICE: Using MOCK LightsparkClient. All data is simulated.");
    lightsparkClientInstance = createMockClient();
    return lightsparkClientInstance;
  }

  const apiTokenClientId = process.env.LIGHTSPARK_API_TOKEN_CLIENT_ID;
  const apiTokenClientSecret = process.env.LIGHTSPARK_API_TOKEN_CLIENT_SECRET;
  const baseUrl = process.env.LIGHTSPARK_BASE_URL; // e.g., "api.lightspark.com"

  if (!apiTokenClientId || !apiTokenClientSecret) {
    throw new Error('Lightspark API client ID or secret not configured in .env. To run with mock data, set USE_MOCK_CLIENT=true in .env');
  }

  // Initialize the real Lightspark Client
  console.log("LIGHTSPARK SERVICE: Initializing REAL LightsparkClient.");

  // =================================================================================
  // TODO: Fix Authentication
  // The 'AccountTokenAuthProvider' class was not found in the installed SDK version,
  // likely due to a version mismatch or a breaking change in the SDK.
  // You need to replace the commented-out code below with the correct authentication
  // method for your SDK version, using the apiTokenClientId and apiTokenClientSecret.
  //
  // 1. Consult the Lightspark SDK documentation for your specific version (^0.12.0).
  // 2. Find the correct class for server-side API token authentication.
  // 3. Import it and instantiate it below.
  //
  // Example of what needs to be fixed (the class name is likely incorrect):
  //
  // import { TheCorrectAuthProvider } from '@lightsparkdev/wallet-sdk';
  // lightsparkClientInstance = new LightsparkClient(
  //   new TheCorrectAuthProvider(apiTokenClientId, apiTokenClientSecret),
  //   baseUrl
  // );
  // =================================================================================

  // Throw an error to prevent the app from running with an uninitialized client.
  // Once you've implemented the authentication above, you can remove this error.
  throw new Error('Real LightsparkClient is not initialized. Please complete the TODO in src/services/lightspark.ts');
  
  // After fixing the TODO above, you can return the client instance.
  // return lightsparkClientInstance;
}

// --- MOCK DATA STORE (Simulates backend state for the mock client) ---
const MOCK_INTERNAL_STATE = {
  btcBalance: 0.05, // in BTC
  usdBalance: 1000, // in USD
  transactions: [
    { id: 'mock_tx_1', type: 'deposit', amount: 0.02, currency: 'BTC', timestamp: new Date(Date.now() - 86400000), description: 'Initial mock BTC deposit' },
    { id: 'mock_tx_2', type: 'convert_to_usd', amount: 0.01, currency: 'BTC', convertedAmount: 500, convertedCurrency: 'USD', timestamp: new Date(Date.now() - 3600000), description: 'Mock BTC to USD conversion' },
  ] as AppTransaction[],
};
const MOCK_BTC_TO_USD_RATE = 60000; // Example static rate for mock conversions

function createMockClient(): LightsparkClient {
  return {
    getCurrentWallet: async () => {
      console.log("MOCK SDK: getCurrentWallet called");
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        id: "mock-wallet-from-sdk-getcurrentwallet",
        status: "READY",
        balances: {
          ownedBalance: { originalValue: 5000000, originalUnit: 'SATOSHI', preferredCurrencyUnit: 'SATOSHI', preferredCurrencyValueApprox: 5000000 } as CurrencyAmount,
          availableToSendBalance: { originalValue: 4800000, originalUnit: 'SATOSHI', preferredCurrencyUnit: 'SATOSHI', preferredCurrencyValueApprox: 4800000 } as CurrencyAmount,
          availableToWithdrawBalance: { originalValue: 4800000, originalUnit: 'SATOSHI', preferredCurrencyUnit: 'SATOSHI', preferredCurrencyValueApprox: 4800000 } as CurrencyAmount,
        }
      };
    },
    getWalletDashboard: async (walletId: string) => {
      console.log(`MOCK SDK: getWalletDashboard called for wallet ${walletId}`);
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        id: walletId,
        status: "READY",
        balances: {
          ownedBalance: { value: MOCK_INTERNAL_STATE.btcBalance * 100_000_000, unit: 'SATOSHI', preferredCurrencyUnit: 'USD', preferredCurrencyValueRounded: MOCK_INTERNAL_STATE.usdBalance } as any,
        },
        paymentRequests: { count: 0, entities: [] },
        transactions: { count: MOCK_INTERNAL_STATE.transactions.length, entities: MOCK_INTERNAL_STATE.transactions.map(t => ({...t, createdAt: t.timestamp, resolvedAt: t.timestamp, status: TransactionStatus.SUCCESS} as unknown as LightsparkSdkTransaction)) },
      };
    },
    createInvoice: async (walletId: string, amountMsats: number, memo?: string) => {
      console.log(`MOCK SDK: createInvoice called for wallet ${walletId}, amountMsats: ${amountMsats}, memo: ${memo}`);
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        data: {
          encodedPaymentRequest: `lnbc${amountMsats}mockinvoice...`,
          bitcoinAddress: 'mockBitcoinAddress...',
        },
        id: `invoice_${crypto.randomUUID()}`
      };
    },
  } as any;
}


// --- Helper to get user's wallet ID ---
async function getUserWalletId(userId: string): Promise<string> {
  const config = await getUserLightsparkConfig(userId);
  if (!config?.lightsparkWalletId) {
    console.error(`Lightspark wallet ID not found for user ${userId}. Using a default or potentially failing.`);
    return process.env.LIGHTSPARK_NODE_ID || 'fallback-node-id-if-no-user-wallet';
  }
  return config.lightsparkWalletId;
}


// --- SERVICE FUNCTIONS ---

export async function getLightsparkBalances(userId: string): Promise<{ btc: number; usd: number }> {
  console.log(`LIGHTSPARK SERVICE: Fetching balances for user ${userId}`);
  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId);

  if (process.env.USE_MOCK_CLIENT === 'true') {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { btc: MOCK_INTERNAL_STATE.btcBalance, usd: MOCK_INTERNAL_STATE.usdBalance };
  }

  try {
    // TODO: Implement actual Lightspark SDK call.
    // Example:
    // const dashboard = await client.getWalletDashboard(userWalletId, [BitcoinNetwork.MAINNET]);
    // const btcBalance = (dashboard.balances?.ownedBalance.value || 0) / 100_000_000;
    // const usdBalance = dashboard.balances?.ownedBalance.preferredCurrencyValueRounded || 0;
    // return { btc: btcBalance, usd: usdBalance };
    throw new Error('getLightsparkBalances not implemented for real client');
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error fetching balances for user ${userId}:`, error);
    throw new Error('Failed to fetch Lightspark balances.');
  }
}

export async function getLightsparkTransactionHistory(userId: string): Promise<AppTransaction[]> {
  console.log(`LIGHTSPARK SERVICE: Fetching transaction history for user ${userId}`);
  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId);

  if (process.env.USE_MOCK_CLIENT === 'true') {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...MOCK_INTERNAL_STATE.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  try {
    // TODO: Implement actual Lightspark SDK call.
    throw new Error('getLightsparkTransactionHistory not implemented for real client');
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error fetching transaction history for user ${userId}:`, error);
    throw new Error('Failed to fetch Lightspark transaction history.');
  }
}

export async function depositBTCWithLightspark(userId: string, amountBTC: number): Promise<{ newBtcBalance: number; transaction: AppTransaction; invoice?: string }> {
  console.log(`LIGHTSPARK SERVICE: Depositing ${amountBTC} BTC for user ${userId}`);
  if (amountBTC <= 0) throw new Error('Deposit amount must be positive.');
  
  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId);

  if (process.env.USE_MOCK_CLIENT === 'true') {
    const lightningInvoice = `mock_lnbc_for_${amountBTC}_btc_user_${userId}`;
    MOCK_INTERNAL_STATE.btcBalance += amountBTC;
    const newTransaction: AppTransaction = {
      id: `tx_deposit_${crypto.randomUUID()}`,
      type: 'deposit',
      amount: amountBTC,
      currency: 'BTC',
      timestamp: new Date(),
      description: `Deposited ${amountBTC} BTC (mock invoice: ${lightningInvoice.substring(0,20)}...)`,
    };
    MOCK_INTERNAL_STATE.transactions.push(newTransaction);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { newBtcBalance: MOCK_INTERNAL_STATE.btcBalance, transaction: newTransaction, invoice: lightningInvoice };
  }

  try {
    // TODO: Implement actual Lightspark SDK call.
    throw new Error('depositBTCWithLightspark not implemented for real client');
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error depositing BTC for user ${userId}:`, error);
    throw new Error('Failed to process BTC deposit with Lightspark.');
  }
}

export async function withdrawUSDWithLightspark(userId: string, amountUSD: number, targetAddress: string): Promise<{ newUsdBalance: number; transaction: AppTransaction }> {
  console.log(`LIGHTSPARK SERVICE: Withdrawing ${amountUSD} USD for user ${userId} to ${targetAddress}`);
  if (amountUSD <= 0) throw new Error('Withdrawal amount must be positive.');
  
  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId);

  if (process.env.USE_MOCK_CLIENT === 'true') {
    if (MOCK_INTERNAL_STATE.usdBalance < amountUSD) throw new Error('Insufficient USD balance (mock).');
    MOCK_INTERNAL_STATE.usdBalance -= amountUSD;
    const newTransaction: AppTransaction = {
      id: `tx_withdraw_${crypto.randomUUID()}`,
      type: 'withdraw',
      amount: amountUSD,
      currency: 'USD',
      timestamp: new Date(),
      description: `Withdrew ${amountUSD} USD to ${targetAddress}`,
    };
    MOCK_INTERNAL_STATE.transactions.push(newTransaction);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { newUsdBalance: MOCK_INTERNAL_STATE.usdBalance, transaction: newTransaction };
  }

  try {
    // TODO: Implement actual Lightspark SDK call.
    throw new Error('withdrawUSDWithLightspark not implemented for real client');
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error withdrawing USD for user ${userId}:`, error);
    throw new Error('Failed to process USD withdrawal with Lightspark.');
  }
}

export async function convertBTCToUSDWithLightspark(userId: string, btcAmount: number): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: AppTransaction }> {
  console.log(`LIGHTSPARK SERVICE: Converting ${btcAmount} BTC to USD for user ${userId}`);
  if (btcAmount <= 0) throw new Error('Conversion amount must be positive.');

  if (process.env.USE_MOCK_CLIENT === 'true') {
    if (MOCK_INTERNAL_STATE.btcBalance < btcAmount) throw new Error('Insufficient BTC balance (mock).');
    const convertedUsd = btcAmount * MOCK_BTC_TO_USD_RATE;
    MOCK_INTERNAL_STATE.btcBalance -= btcAmount;
    MOCK_INTERNAL_STATE.usdBalance += convertedUsd;
    const newTransaction: AppTransaction = {
      id: `tx_btc_to_usd_${crypto.randomUUID()}`,
      type: 'convert_to_usd',
      amount: btcAmount,
      currency: 'BTC',
      convertedAmount: convertedUsd,
      convertedCurrency: 'USD',
      timestamp: new Date(),
      description: `Converted ${btcAmount} BTC to ${convertedUsd.toFixed(2)} USD`,
    };
    MOCK_INTERNAL_STATE.transactions.push(newTransaction);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { newBtcBalance: MOCK_INTERNAL_STATE.btcBalance, newUsdBalance: MOCK_INTERNAL_STATE.usdBalance, transaction: newTransaction };
  }

  try {
    // TODO: Implement actual Lightspark SDK call.
    throw new Error('convertBTCToUSDWithLightspark not implemented for real client');
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error converting BTC to USD for user ${userId}:`, error);
    throw new Error('Failed to convert BTC to USD with Lightspark.');
  }
}

export async function convertUSDToBTCWithLightspark(userId: string, usdAmount: number): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: AppTransaction }> {
  console.log(`LIGHTSPARK SERVICE: Converting ${usdAmount} USD to BTC for user ${userId}`);
  if (usdAmount <= 0) throw new Error('Conversion amount must be positive.');
  
  if (process.env.USE_MOCK_CLIENT === 'true') {
    if (MOCK_INTERNAL_STATE.usdBalance < usdAmount) throw new Error('Insufficient USD balance (mock).');
    const convertedBtc = usdAmount / MOCK_BTC_TO_USD_RATE;
    MOCK_INTERNAL_STATE.usdBalance -= usdAmount;
    MOCK_INTERNAL_STATE.btcBalance += convertedBtc;
    const newTransaction: AppTransaction = {
      id: `tx_usd_to_btc_${crypto.randomUUID()}`,
      type: 'convert_to_btc',
      amount: usdAmount,
      currency: 'USD',
      convertedAmount: convertedBtc,
      convertedCurrency: 'BTC',
      timestamp: new Date(),
      description: `Converted ${usdAmount} USD to ${convertedBtc.toFixed(8)} BTC`,
    };
    MOCK_INTERNAL_STATE.transactions.push(newTransaction);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { newUsdBalance: MOCK_INTERNAL_STATE.usdBalance, newBtcBalance: MOCK_INTERNAL_STATE.btcBalance, transaction: newTransaction };
  }

  try {
    // TODO: Implement actual Lightspark SDK call.
    throw new Error('convertUSDToBTCWithLightspark not implemented for real client');
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error converting USD to BTC for user ${userId}:`, error);
    throw new Error('Failed to convert USD to BTC with Lightspark.');
  }
}
