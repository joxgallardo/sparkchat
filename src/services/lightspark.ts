
// src/services/lightspark.ts
'use server';

/**
 * @fileOverview Service for Lightspark interactions.
 * This file contains functions to interact with the Lightspark SDK.
 * It uses a placeholder client and mock implementations.
 * Replace these with actual Lightspark SDK calls and error handling.
 * API keys and sensitive configurations are handled via environment variables.
 */

import { LightsparkClient, AccountTokenAuthProvider, BitcoinNetwork, TransactionStatus } from '@lightsparkdev/wallet-sdk';
import type { CurrencyAmount, Transaction as LightsparkSdkTransaction } from '@lightsparkdev/wallet-sdk';
import type { Transaction as AppTransaction } from '@/components/spark-chat/TransactionHistoryCard'; // Our app's Transaction type
import { getUserLightsparkConfig } from '@/services/database'; // To get user-specific walletId

// --- Lightspark Client Initialization ---
let lightsparkClientInstance: LightsparkClient | null = null;

function getLightsparkClient(): LightsparkClient {
  if (!lightsparkClientInstance) {
    const apiTokenClientId = process.env.LIGHTSPARK_API_TOKEN_CLIENT_ID;
    const apiTokenClientSecret = process.env.LIGHTSPARK_API_TOKEN_CLIENT_SECRET;
    const baseUrl = process.env.LIGHTSPARK_BASE_URL; // e.g., "api.lightspark.com"

    if (!apiTokenClientId || !apiTokenClientSecret) {
      throw new Error('Lightspark API client ID or secret not configured in .env');
    }

    // Initialize the Lightspark Client
    // lightsparkClientInstance = new LightsparkClient(
    //   new AccountTokenAuthProvider(apiTokenClientId, apiTokenClientSecret),
    //   baseUrl // If undefined, SDK might use a default
    // );
    
    // Using MOCK client for now to avoid runtime errors if SDK isn't fully stubbed for all methods.
    // TODO: Remove this mock client and use the actual LightsparkClient initialization above once ready.
    console.warn("LIGHTSPARK SERVICE: Using MOCK LightsparkClient. Replace with actual SDK initialization.");
    lightsparkClientInstance = {
      getCurrentWallet: async () => {
        console.log("MOCK SDK: getCurrentWallet called");
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simulate a wallet object. Structure based on potential SDK responses.
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
      getWalletDashboard: async (walletId: string, networks: BitcoinNetwork[] = [BitcoinNetwork.MAINNET]) => {
        console.log(`MOCK SDK: getWalletDashboard called for wallet ${walletId}`);
        await new Promise(resolve => setTimeout(resolve, 100));
        // Simulate dashboard data. Structure based on potential SDK responses.
        return {
          id: walletId,
          status: "READY",
          balances: {
            ownedBalance: { value: MOCK_INTERNAL_STATE.btcBalance * 100_000_000, unit: 'SATOSHI', preferredCurrencyUnit: 'USD', preferredCurrencyValueRounded: MOCK_INTERNAL_STATE.usdBalance } as any, // Simplified mock
             // Add other balance types if needed by your UI
          },
          paymentRequests: { count: 0, entities: [] }, // Recent payment requests
          transactions: { count: MOCK_INTERNAL_STATE.transactions.length, entities: MOCK_INTERNAL_STATE.transactions.map(t => ({...t, createdAt: t.timestamp, resolvedAt: t.timestamp, status: TransactionStatus.SUCCESS} as unknown as LightsparkSdkTransaction)) }, // Recent transactions
        };
      },
      getTransactions: async (walletId: string, /* other options */) => {
        console.log(`MOCK SDK: getTransactions called for wallet ${walletId}`);
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
            count: MOCK_INTERNAL_STATE.transactions.length,
            entities: MOCK_INTERNAL_STATE.transactions.map(t => ({
                id: t.id,
                createdAt: t.timestamp,
                resolvedAt: t.timestamp,
                amount: { originalValue: t.amount * (t.currency === 'BTC' ? 100_000_000 : 100), originalUnit: t.currency === 'BTC' ? 'SATOSHI' : 'USD_CENTS' } as CurrencyAmount,
                status: TransactionStatus.SUCCESS,
                type: t.type === 'deposit' ? 'INCOMING_PAYMENT' : t.type === 'withdraw' ? 'OUTGOING_PAYMENT' : 'INTERNAL_TRANSFER', // Example mapping
                // ... other relevant fields from LightsparkSdkTransaction
            }) as unknown as LightsparkSdkTransaction) // Cast for mock
        };
      },
      createInvoice: async (walletId: string, amountMsats: number, memo?: string) => {
        console.log(`MOCK SDK: createInvoice called for wallet ${walletId}, amountMsats: ${amountMsats}, memo: ${memo}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          data: {
            encodedPaymentRequest: `lnbc${amountMsats}mockinvoice...`, // Mock lightning invoice
            bitcoinAddress: 'mockBitcoinAddress...', // for on-chain if applicable
          },
          id: `invoice_${crypto.randomUUID()}`
        };
      },
      sendPayment: async (walletId: string, encodedInvoice: string, timeoutSecs: number, amountMsats?: number) => {
         console.log(`MOCK SDK: sendPayment (for withdrawal) called for wallet ${walletId}, invoice: ${encodedInvoice}`);
         await new Promise(resolve => setTimeout(resolve, 500));
         // This is highly simplified. Real payment involves complex state.
         return { id: `payment_${crypto.randomUUID()}`, status: TransactionStatus.SUCCESS };
      },
      requestWithdrawal: async (walletId: string, amount: CurrencyAmount, bitcoinAddress: string) => {
        console.log(`MOCK SDK: requestWithdrawal for ${amount.originalValue} ${amount.originalUnit} to ${bitcoinAddress}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { id: `withdrawal_${crypto.randomUUID()}`, status: "CREATED" }; // Mock response
      },
      // TODO: Add more mock methods as needed for other SDK functionalities like currency conversion, etc.
      // For example, Lightspark might have specific methods for buying/selling Bitcoin which would handle conversion.
      // Or you might fetch exchange rates and do the math.
      // For now, conversion logic remains in this service layer using a mock rate.
    } as any; // Cast to LightsparkClient for mocking
  }
  return lightsparkClientInstance;
}

// --- MOCK DATA STORE (Simulates backend state for the mock client) ---
// This is for the MOCK client above. Remove when using real SDK.
const MOCK_INTERNAL_STATE = {
  btcBalance: 0.05, // in BTC
  usdBalance: 1000, // in USD
  transactions: [
    { id: 'mock_tx_1', type: 'deposit', amount: 0.02, currency: 'BTC', timestamp: new Date(Date.now() - 86400000), description: 'Initial mock BTC deposit' },
    { id: 'mock_tx_2', type: 'convert_to_usd', amount: 0.01, currency: 'BTC', convertedAmount: 500, convertedCurrency: 'USD', timestamp: new Date(Date.now() - 3600000), description: 'Mock BTC to USD conversion' },
  ] as AppTransaction[],
};
const MOCK_BTC_TO_USD_RATE = 60000; // Example static rate for mock conversions


// --- Helper to get user's wallet ID ---
async function getUserWalletId(userId: string): Promise<string> {
  const config = await getUserLightsparkConfig(userId);
  if (!config?.lightsparkWalletId) {
    // In a real app, you might trigger an onboarding flow for the user to connect/create a Lightspark wallet
    // or throw an error if a wallet is expected.
    console.error(`Lightspark wallet ID not found for user ${userId}. Using a default or potentially failing.`);
    // For now, fallback to a generic node ID from env if user-specific isn't found, or throw.
    // This part needs to align with how your app manages user wallets with Lightspark.
    // If each user has their own wallet registered with Lightspark, this ID is crucial.
    // throw new Error(`Lightspark wallet for user ${userId} not configured.`);
    return process.env.LIGHTSPARK_NODE_ID || 'fallback-node-id-if-no-user-wallet'; // Or throw error.
  }
  return config.lightsparkWalletId;
}


// --- SERVICE FUNCTIONS ---

export async function getLightsparkBalances(userId: string): Promise<{ btc: number; usd: number }> {
  console.log(`LIGHTSPARK SERVICE: Fetching balances for user ${userId}`);
  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId); // Get user's specific wallet ID

  try {
    // TODO: Replace with actual Lightspark SDK call using userWalletId.
    // Example: const dashboard = await client.getWalletDashboard(userWalletId, [BitcoinNetwork.MAINNET]);
    // const btcBalance = (dashboard.balances?.ownedBalance.value || 0) / 100_000_000; // Assuming value is in SATOSHI
    // const usdBalance = dashboard.balances?.ownedBalance.preferredCurrencyValueRounded || 0; // Assuming this is in USD if preferred currency is USD

    // Using MOCK_INTERNAL_STATE for now
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    return { btc: MOCK_INTERNAL_STATE.btcBalance, usd: MOCK_INTERNAL_STATE.usdBalance };
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error fetching balances for user ${userId}:`, error);
    throw new Error('Failed to fetch Lightspark balances.');
  }
}

export async function getLightsparkTransactionHistory(userId: string): Promise<AppTransaction[]> {
  console.log(`LIGHTSPARK SERVICE: Fetching transaction history for user ${userId}`);
  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId);

  try {
    // TODO: Replace with actual Lightspark SDK call.
    // const sdkTransactionsResponse = await client.getTransactions(userWalletId, { first: 20 /*, etc */ });
    // const appTransactions = sdkTransactionsResponse.entities.map(tx => ({
    //   id: tx.id,
    //   type: mapSdkTxTypeToAppTxType(tx.type), // You'll need a mapping function
    //   amount: parseFloat(tx.amount.value) / (tx.amount.unit === 'SATOSHI' ? 100_000_000 : 100), // Example conversion
    //   currency: tx.amount.unit === 'SATOSHI' ? 'BTC' : 'USD', // Example mapping
    //   timestamp: new Date(tx.createdAt),
    //   description: tx.memo || `Transaction ${tx.id}`,
    //   // ... map other fields like convertedAmount if applicable
    // }));
    // return appTransactions;

    // Using MOCK_INTERNAL_STATE for now
    await new Promise(resolve => setTimeout(resolve, 300));
    return [...MOCK_INTERNAL_STATE.transactions].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  try {
    // TODO: Replace with actual Lightspark SDK call to create an invoice.
    // const amountMsats = Math.round(amountBTC * 100_000_000 * 1000); // Convert BTC to millisatoshis
    // const invoiceData = await client.createInvoice(userWalletId, amountMsats, `Deposit for user ${userId}`);
    // const lightningInvoice = invoiceData.data.encodedPaymentRequest;
    // console.log('LIGHTSPARK SERVICE: Generated Lightspark invoice:', lightningInvoice);
    // In a real app, you'd display this invoice to the user. The balance updates after the invoice is paid.
    // For this mock, we'll just update the balance.
    
    // MOCK Logic
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
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error depositing BTC for user ${userId}:`, error);
    throw new Error('Failed to process BTC deposit with Lightspark.');
  }
}

export async function withdrawUSDWithLightspark(userId: string, amountUSD: number, targetAddress: string /* e.g. bank details or crypto address if Lightspark supports fiat-to-crypto withdrawal */): Promise<{ newUsdBalance: number; transaction: AppTransaction }> {
  console.log(`LIGHTSPARK SERVICE: Withdrawing ${amountUSD} USD for user ${userId} to ${targetAddress}`);
  if (amountUSD <= 0) throw new Error('Withdrawal amount must be positive.');
  if (MOCK_INTERNAL_STATE.usdBalance < amountUSD) throw new Error('Insufficient USD balance (mock).'); // Check real balance via SDK

  const client = getLightsparkClient();
  const userWalletId = await getUserWalletId(userId);

  try {
    // TODO: Replace with actual Lightspark SDK call for withdrawal.
    // This could be client.sendPayment if withdrawing to a Lightning invoice representing USD,
    // or a specific withdrawal function like client.requestWithdrawal if sending to a bank or other address.
    // Example for a generic payment (if withdrawing via Lightning):
    // const paymentResult = await client.sendPayment(userWalletId, targetAddress /* encoded invoice for USD */, timeout_secs, amountUSD_in_msats_equivalent);
    // Or for fiat withdrawal:
    // const currencyAmount: CurrencyAmount = { value: amountUSD * 100, unit: 'USD_CENTS' }; // Check SDK for correct unit
    // const withdrawal = await client.requestWithdrawal(userWalletId, currencyAmount, targetAddress /* bank details / bitcoin address */);
    // console.log('LIGHTSPARK SERVICE: Withdrawal request created:', withdrawal.id);

    // MOCK Logic
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
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error withdrawing USD for user ${userId}:`, error);
    throw new Error('Failed to process USD withdrawal with Lightspark.');
  }
}

export async function convertBTCToUSDWithLightspark(userId: string, btcAmount: number): Promise<{ newBtcBalance: number; newUsdBalance: number; transaction: AppTransaction }> {
  console.log(`LIGHTSPARK SERVICE: Converting ${btcAmount} BTC to USD for user ${userId}`);
  if (btcAmount <= 0) throw new Error('Conversion amount must be positive.');
  if (MOCK_INTERNAL_STATE.btcBalance < btcAmount) throw new Error('Insufficient BTC balance (mock).'); // Check real balance

  const client = getLightsparkClient(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const userWalletId = await getUserWalletId(userId); // eslint-disable-line @typescript-eslint/no-unused-vars

  try {
    // TODO: Replace with actual Lightspark SDK call for selling/converting BTC to USD.
    // Lightspark might have a specific function like `client.sellBitcoin(userWalletId, btcAmountToSell)`
    // or you might need to get a quote and then execute the trade.
    // The result would give you the USD amount and update balances.

    // MOCK Logic
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
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error converting BTC to USD for user ${userId}:`, error);
    throw new Error('Failed to convert BTC to USD with Lightspark.');
  }
}

export async function convertUSDToBTCWithLightspark(userId: string, usdAmount: number): Promise<{ newUsdBalance: number; newBtcBalance: number; transaction: AppTransaction }> {
  console.log(`LIGHTSPARK SERVICE: Converting ${usdAmount} USD to BTC for user ${userId}`);
  if (usdAmount <= 0) throw new Error('Conversion amount must be positive.');
  if (MOCK_INTERNAL_STATE.usdBalance < usdAmount) throw new Error('Insufficient USD balance (mock).'); // Check real balance

  const client = getLightsparkClient(); // eslint-disable-line @typescript-eslint/no-unused-vars
  const userWalletId = await getUserWalletId(userId); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  try {
    // TODO: Replace with actual Lightspark SDK call for buying/converting USD to BTC.
    // Similar to above, Lightspark might have `client.buyBitcoin(userWalletId, usdAmountToSpend)`
    // or a quote and execute mechanism.

    // MOCK Logic
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
  } catch (error) {
    console.error(`LIGHTSPARK SERVICE: Error converting USD to BTC for user ${userId}:`, error);
    throw new Error('Failed to convert USD to BTC with Lightspark.');
  }
}

// TODO: Add other Lightspark service functions as needed, for example:
// - Getting fee estimates for transactions
// - Managing Lightning Addresses
// - Fetching specific transaction details
// - etc.

/**
 * Helper function to map Lightspark SDK transaction types to your app's transaction types.
 * This is an example and will need to be adjusted based on the actual SDK types.
 */
// function mapSdkTxTypeToAppTxType(sdkType: string): AppTransaction['type'] {
//   switch (sdkType) {
//     case 'INCOMING_PAYMENT': return 'deposit';
//     case 'OUTGOING_PAYMENT': return 'withdraw';
//     case 'INTERNAL_TRANSFER': // Could be a conversion
//     case 'LN_SWAP': // Could represent a conversion if it involves different assets on LS side
//       return 'convert_to_usd'; // Or 'convert_to_btc' - needs more logic based on assets
//     default:
//       console.warn(`Unknown Lightspark transaction type: ${sdkType}`);
//       return 'deposit'; // Fallback or throw error
//   }
// }
