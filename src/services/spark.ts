'use server';

/**
 * @fileOverview Service for Spark SDK integration.
 * This file contains functions to interact with the official Spark SDK.
 * It provides self-custodial wallet functionality for users.
 * 
 * Spark SDK: @buildonspark/spark-sdk
 * LRC-20 SDK: @buildonspark/lrc20-sdk
 * UMA SDK: @uma-sdk/core
 */

import { SparkWallet } from '@buildonspark/spark-sdk';
import { LRCWallet, NetworkType, type LRC20WalletApiConfig, Lrc20TransactionDto } from '@buildonspark/lrc20-sdk';
import * as bip39 from 'bip39';
// ExitSpeed puede no estar exportado directamente, así que usamos el string literal si es necesario
// import { ExitSpeed } from '@buildonspark/spark-sdk/dist/enums';

import type { Transaction as AppTransaction } from '@/components/spark-chat/TransactionHistoryCard';
import { getMasterMnemonic, getUserWalletInfo } from './userManager';

// --- Spark Configuration ---
const SPARK_NETWORK = process.env.SPARK_NETWORK || 'TESTNET';

// --- LRC-20 Configuration ---
const LRC20_NODE_URL = process.env.LRC20_NODE_URL || 'https://lrc20-node.buildonspark.com';
const ELECTRS_URL = process.env.ELECTRS_URL || 'https://electrs.buildonspark.com';

// --- Hermetic Mode Detection ---
function isHermeticMode(): boolean {
  try {
    const fs = require('fs');
    return (fs?.existsSync?.("/tmp/spark_hermetic") ?? false) || 
           process.env.HERMETIC_TEST === "true";
  } catch {
    return process.env.HERMETIC_TEST === "true";
  }
}

// --- Wallet Cache ---
const walletCache = new Map<string, SparkWallet>();
const lrc20WalletCache = new Map<string, LRCWallet>();

// --- Types ---
interface SparkTransfer {
  id?: string;
  transferDirection: 'INCOMING' | 'OUTGOING';
  totalValue: number;
  createdTime?: Date;
  memo?: string;
  status: string;
}

interface TokenBalance {
  tokenPubkey: string;
  balance: number;
  name: string;
  symbol: string;
}

interface TokenTransferResult {
  success: boolean;
  transactionId?: string;
  amount: number;
  tokenPubkey: string;
  recipient: string;
  error?: string;
}

// --- Helper Functions ---

/**
 * Get or create a Spark wallet for a user
 */
async function getUserWallet(userId: string, accountNumber: number): Promise<SparkWallet> {
  const cacheKey = `${userId}_${accountNumber}`;
  
  // Clear cache to ensure wallets are reinitialized with correct network config
  if (walletCache.has(cacheKey)) {
    console.log(`SPARK SERVICE: Clearing cached wallet for user ${userId} to reinitialize with network config`);
    walletCache.delete(cacheKey);
  }

  console.log(`SPARK SERVICE: Initializing wallet for user ${userId} with account ${accountNumber}`);
  console.log(`SPARK SERVICE: Using network: ${SPARK_NETWORK}`);
  console.log(`SPARK SERVICE: Hermetic mode: ${isHermeticMode() ? 'ENABLED' : 'DISABLED'}`);

  try {
    // Get master mnemonic from userManager
    const masterMnemonic = await getMasterMnemonic();
    
    // Convert mnemonic to seed (hex string) - this is what the SDK expects
    const seedBuffer = await bip39.mnemonicToSeed(masterMnemonic);
    const seedHex = seedBuffer.toString('hex');
    
    console.log(`SPARK SERVICE: Converted mnemonic to seed hex (first 8 chars): ${seedHex.substring(0, 8)}...`);
    
    // Initialize wallet with seed hex and user's account number
    // Configure network based on SPARK_NETWORK environment variable
    const networkConfig = SPARK_NETWORK === 'TESTNET' ? 'TESTNET' : 
                         SPARK_NETWORK === 'MAINNET' ? 'MAINNET' : 
                         SPARK_NETWORK === 'SIGNET' ? 'SIGNET' : 
                         SPARK_NETWORK === 'REGTEST' ? 'REGTEST' : 'TESTNET';
    
    console.log(`SPARK SERVICE: Attempting to initialize wallet with network: ${networkConfig}`);
    
    const { wallet } = await SparkWallet.initialize({
      mnemonicOrSeed: seedHex,
      accountNumber: accountNumber,
      options: {
        network: networkConfig
      }
    });

    walletCache.set(cacheKey, wallet);
    console.log(`SPARK SERVICE: Wallet initialized successfully for user ${userId} on network: ${networkConfig}`);
    
    return wallet;
  } catch (error) {
    console.error(`SPARK SERVICE: Failed to initialize wallet for user ${userId}:`, error);
    
    // Provide more specific error messages based on the error type and mode
    if (error instanceof Error) {
      if (error.message.includes('Authentication failed') || error.message.includes('AuthenticationError')) {
        if (isHermeticMode()) {
          throw new Error(`Spark authentication failed in hermetic mode. This might indicate a configuration issue. Error: ${error.message}`);
        } else {
          throw new Error(`Spark authentication failed. Please check your network configuration and ensure Spark services are accessible. Error: ${error.message}`);
        }
      } else if (error.message.includes('Connection') || error.message.includes('Network')) {
        if (isHermeticMode()) {
          throw new Error(`Network connection error in hermetic mode. This is unexpected. Error: ${error.message}`);
        } else {
          throw new Error(`Network connection error. Please check your internet connection and Spark service availability. Error: ${error.message}`);
        }
      } else if (error.message.includes('Invalid mnemonic') || error.message.includes('seed')) {
        throw new Error(`Invalid master mnemonic. Please check your SPARK_MASTER_MNEMONIC configuration. Error: ${error.message}`);
      } else {
        throw new Error(`Failed to initialize Spark wallet: ${error.message}`);
      }
    }
    
    throw new Error(`Failed to initialize Spark wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get or create an LRC-20 wallet for a user
 */
async function getUserLRC20Wallet(userId: string, accountNumber: number): Promise<LRCWallet> {
  const cacheKey = `lrc20_${userId}_${accountNumber}`;
  
  if (lrc20WalletCache.has(cacheKey)) {
    console.log(`SPARK SERVICE: Using cached LRC-20 wallet for user ${userId}`);
    return lrc20WalletCache.get(cacheKey)!;
  }

  console.log(`SPARK SERVICE: Initializing LRC-20 wallet for user ${userId} with account ${accountNumber}`);
  console.log(`SPARK SERVICE: Using network: ${SPARK_NETWORK}`);

  try {
    // Get master mnemonic from userManager
    const masterMnemonic = await getMasterMnemonic();
    
    // Convert mnemonic to seed
    const seedBuffer = await bip39.mnemonicToSeed(masterMnemonic);
    
    // Determine network type
    const networkType = SPARK_NETWORK === 'TESTNET' ? NetworkType.TESTNET : 
                       SPARK_NETWORK === 'MAINNET' ? NetworkType.MAINNET : 
                       SPARK_NETWORK === 'REGTEST' ? NetworkType.REGTEST : 
                       NetworkType.TESTNET;
    
    // Create token signer with proper key derivation
    const tokenSigner = {
      getIdentityPublicKey: async (): Promise<Uint8Array> => {
        // Use proper BIP32 derivation for identity key
        const { BIP32Factory } = require('bip32');
        const ecc = require('tiny-secp256k1');
        const bip32 = BIP32Factory(ecc);
        
        // Derive path: m/86'/1'/0'/0/0 for testnet (86' is for Taproot, 1' for testnet)
        // For mainnet it would be m/86'/0'/0'/0/0
        const path = networkType === NetworkType.TESTNET ? 
          `m/86'/1'/0'/0/${accountNumber}` : 
          `m/86'/0'/0'/0/${accountNumber}`;
        
        const root = bip32.fromSeed(seedBuffer);
        const child = root.derivePath(path);
        
        // Return the public key (32 bytes for Taproot)
        return child.publicKey;
      },
      signMessageWithIdentityKey: async (message: Uint8Array): Promise<Uint8Array> => {
        // Use proper signing with the derived key
        const { BIP32Factory } = require('bip32');
        const ecc = require('tiny-secp256k1');
        const bip32 = BIP32Factory(ecc);
        
        const path = networkType === NetworkType.TESTNET ? 
          `m/86'/1'/0'/0/${accountNumber}` : 
          `m/86'/0'/0'/0/${accountNumber}`;
        
        const root = bip32.fromSeed(seedBuffer);
        const child = root.derivePath(path);
        
        // Sign the message
        const signature = ecc.sign(message, child.privateKey!);
        return signature;
      },
      signSchnorrWithIdentityKey: async (message: Uint8Array): Promise<Uint8Array> => {
        // Use proper Schnorr signing with the derived key
        const { BIP32Factory } = require('bip32');
        const ecc = require('tiny-secp256k1');
        const bip32 = BIP32Factory(ecc);
        
        const path = networkType === NetworkType.TESTNET ? 
          `m/86'/1'/0'/0/${accountNumber}` : 
          `m/86'/0'/0'/0/${accountNumber}`;
        
        const root = bip32.fromSeed(seedBuffer);
        const child = root.derivePath(path);
        
        // Sign with Schnorr (Taproot uses Schnorr signatures)
        const signature = ecc.signSchnorr(message, child.privateKey!);
        return signature;
      },
      generateMnemonic: async (): Promise<string> => masterMnemonic,
      createSparkWalletFromSeed: async (seed: Uint8Array | string): Promise<string> => {
        // Return a wallet identifier
        return `wallet_${userId}_${accountNumber}`;
      },
      mnemonicToSeed: async (mnemonic: string): Promise<Uint8Array> => {
        const seedBuffer = await bip39.mnemonicToSeed(mnemonic);
        return new Uint8Array(seedBuffer);
      },
      signPsbt: async (psbt: any, input: number): Promise<any> => {
        // Use proper PSBT signing
        const { BIP32Factory } = require('bip32');
        const ecc = require('tiny-secp256k1');
        const bip32 = BIP32Factory(ecc);
        
        const path = networkType === NetworkType.TESTNET ? 
          `m/86'/1'/0'/0/${accountNumber}` : 
          `m/86'/0'/0'/0/${accountNumber}`;
        
        const root = bip32.fromSeed(seedBuffer);
        const child = root.derivePath(path);
        
        // Sign the PSBT input
        psbt.signInput(input, child);
        return psbt;
      }
    };

    // Configure LRC-20 API
    const apiConfig: LRC20WalletApiConfig = {
      lrc20NodeUrl: LRC20_NODE_URL,
      electrsUrl: ELECTRS_URL
    };

    // Create LRC-20 wallet
    const lrc20Wallet = await LRCWallet.create(
      require('bitcoinjs-lib').networks[SPARK_NETWORK.toLowerCase()] || require('bitcoinjs-lib').networks.testnet,
      networkType,
      apiConfig,
      tokenSigner
    );

    lrc20WalletCache.set(cacheKey, lrc20Wallet);
    console.log(`SPARK SERVICE: LRC-20 wallet initialized successfully for user ${userId}`);
    
    return lrc20Wallet;
  } catch (error) {
    console.error(`SPARK SERVICE: Failed to initialize LRC-20 wallet for user ${userId}:`, error);
    throw new Error(`Failed to initialize LRC-20 wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Spark wallet for a user by Telegram ID
 * This is the main function to get a user's wallet
 */
export async function getUserSparkWallet(telegramId: number): Promise<SparkWallet> {
  const walletInfo = await getUserWalletInfo(telegramId);
  return await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
}

// --- Service Functions ---

/**
 * Get balance for a user's wallet using Telegram ID
 * @param telegramId - Telegram user ID
 * @param forceRefetch - If true, forces wallet sync and claims pending deposits (not supported by current SDK)
 */
export async function getSparkBalanceByTelegramId(
  telegramId: number, 
  forceRefetch: boolean = false
): Promise<{ 
  balance: number; // in satoshis
  tokenBalances: Map<string, number>;
}> {
  console.log(`SPARK SERVICE: Getting balance for Telegram ID: ${telegramId}, forceRefetch: ${forceRefetch}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    
    // Note: Current Spark SDK doesn't support forceRefetch parameter
    // Users need to manually claim deposits using /claim <txid>
    const balanceInfo = await wallet.getBalance();
    
    // Convert bigint to number for balance
    const balance = typeof balanceInfo.balance === 'bigint' ? Number(balanceInfo.balance) : balanceInfo.balance;
    // Convert tokenBalances Map<string, { balance: bigint }> to Map<string, number>
    const tokenBalances = new Map<string, number>();
    if (balanceInfo.tokenBalances) {
      for (const [key, value] of balanceInfo.tokenBalances.entries()) {
        tokenBalances.set(key, typeof value.balance === 'bigint' ? Number(value.balance) : value.balance);
      }
    }
    
    console.log(`SPARK SERVICE: Balance retrieved - ${balance} sats (forceRefetch: ${forceRefetch})`);
    
    return {
      balance,
      tokenBalances
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting balance for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get balance for a user's wallet (legacy function for backward compatibility)
 * @param userId - User ID
 * @param accountNumber - Account number
 * @param forceRefetch - If true, forces wallet sync and claims pending deposits (not supported by current SDK)
 */
export async function getSparkBalance(
  userId: string, 
  accountNumber: number,
  forceRefetch: boolean = false
): Promise<{ 
  balance: number; // in satoshis
  tokenBalances: Map<string, number>;
}> {
  console.log(`SPARK SERVICE: Getting balance for user ${userId}, account ${accountNumber}, forceRefetch: ${forceRefetch}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    
    // Note: Current Spark SDK doesn't support forceRefetch parameter
    // Users need to manually claim deposits using /claim <txid>
    const balanceInfo = await wallet.getBalance();
    
    // Convert bigint to number for balance
    const balance = typeof balanceInfo.balance === 'bigint' ? Number(balanceInfo.balance) : balanceInfo.balance;
    // Convert tokenBalances Map<string, { balance: bigint }> to Map<string, number>
    const tokenBalances = new Map<string, number>();
    if (balanceInfo.tokenBalances) {
      for (const [key, value] of balanceInfo.tokenBalances.entries()) {
        tokenBalances.set(key, typeof value.balance === 'bigint' ? Number(value.balance) : value.balance);
      }
    }
    
    console.log(`SPARK SERVICE: Balance retrieved - ${balance} sats (forceRefetch: ${forceRefetch})`);
    
    return {
      balance,
      tokenBalances
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting balance for user ${userId}:`, error);
    throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get deposit address for a user using Telegram ID
 */
export async function getSparkDepositAddressByTelegramId(telegramId: number): Promise<string> {
  console.log(`SPARK SERVICE: Getting deposit address for Telegram ID: ${telegramId}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    const address = await wallet.getSingleUseDepositAddress();
    
    console.log(`SPARK SERVICE: Deposit address generated: ${address}`);
    
    return address;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting deposit address for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to get deposit address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get deposit address for a user (legacy function for backward compatibility)
 */
export async function getSparkDepositAddress(userId: string, accountNumber: number): Promise<string> {
  console.log(`SPARK SERVICE: Getting deposit address for user ${userId}, account ${accountNumber}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    const address = await wallet.getSingleUseDepositAddress();
    
    console.log(`SPARK SERVICE: Deposit address generated: ${address}`);
    
    return address;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting deposit address for user ${userId}:`, error);
    throw new Error(`Failed to get deposit address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Claim an on-chain deposit using Telegram ID
 */
export async function claimSparkDepositByTelegramId(telegramId: number, txId: string): Promise<boolean> {
  console.log(`SPARK SERVICE: Claiming deposit for Telegram ID: ${telegramId}, txId: ${txId}`);
  
  try {
    // Validate TXID format first
    if (!txId || txId.length !== 64 || !/^[a-fA-F0-9]+$/.test(txId)) {
      throw new Error(`Invalid TXID format. Expected 64-character hex string, got: ${txId}`);
    }
    
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    
    console.log(`SPARK SERVICE: Attempting to claim deposit with valid TXID format`);
    await wallet.claimDeposit(txId);
    
    console.log(`SPARK SERVICE: Deposit claimed successfully`);
    
    return true;
  } catch (error) {
    console.error(`SPARK SERVICE: Error claiming deposit for Telegram ID ${telegramId}:`, error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('Invalid TXID format')) {
        throw new Error(`Invalid TXID format. Please provide a valid 64-character transaction ID.`);
      } else if (error.message.includes('Invalid transaction hex') || error.message.includes('Invalid transaction ID')) {
        throw new Error(`Invalid transaction ID. Please ensure the TXID is correct and the transaction has sufficient confirmations.`);
      } else if (error.message.includes('No user found')) {
        throw new Error(`User not found. Please ensure you are registered with the bot.`);
      } else {
        throw new Error(`Failed to claim deposit: ${error.message}`);
      }
    }
    
    throw new Error(`Failed to claim deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Claim an on-chain deposit (legacy function for backward compatibility)
 */
export async function claimSparkDeposit(userId: string, accountNumber: number, txId: string): Promise<boolean> {
  console.log(`SPARK SERVICE: Claiming deposit for user ${userId}, account ${accountNumber}, txId: ${txId}`);
  
  try {
    // Validate TXID format first
    if (!txId || txId.length !== 64 || !/^[a-fA-F0-9]+$/.test(txId)) {
      throw new Error(`Invalid TXID format. Expected 64-character hex string, got: ${txId}`);
    }
    
    const wallet = await getUserWallet(userId, accountNumber);
    
    console.log(`SPARK SERVICE: Attempting to claim deposit with valid TXID format`);
    await wallet.claimDeposit(txId);
    
    console.log(`SPARK SERVICE: Deposit claimed successfully`);
    
    return true;
  } catch (error) {
    console.error(`SPARK SERVICE: Error claiming deposit for user ${userId}:`, error);
    
    // Provide more specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('Invalid TXID format')) {
        throw new Error(`Invalid TXID format. Please provide a valid 64-character transaction ID.`);
      } else if (error.message.includes('Invalid transaction hex') || error.message.includes('Invalid transaction ID')) {
        throw new Error(`Invalid transaction ID. Please ensure the TXID is correct and the transaction has sufficient confirmations.`);
      } else {
        throw new Error(`Failed to claim deposit: ${error.message}`);
      }
    }
    
    throw new Error(`Failed to claim deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create Lightning invoice using Telegram ID
 */
export async function createSparkLightningInvoiceByTelegramId(
  telegramId: number, 
  amountSats: number, 
  memo?: string
): Promise<string> {
  console.log(`SPARK SERVICE: Creating Lightning invoice for Telegram ID: ${telegramId}, amount: ${amountSats} sats`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    const invoice = await wallet.createLightningInvoice({
      amountSats,
      memo: memo || `SparkChat deposit for user ${walletInfo.userId}`,
    });
    
    console.log(`SPARK SERVICE: Lightning invoice created successfully`);
    console.log(`SPARK SERVICE: Invoice object:`, JSON.stringify(invoice, null, 2));
    
    // Try different ways to extract the BOLT11 invoice string
    let bolt11Invoice: string;
    
    if (typeof invoice === 'string') {
      // If it's already a string, use it directly
      bolt11Invoice = invoice;
    } else if (invoice && typeof invoice === 'object') {
      // Try different possible property names based on the actual SDK response
      bolt11Invoice = (invoice as any).invoice?.encodedInvoice || 
                     (invoice as any).paymentRequest || 
                     (invoice as any).invoice || 
                     (invoice as any).bolt11 || 
                     (invoice as any).request || 
                     (invoice as any).payment_request ||
                     (invoice as any).toString();
    } else {
      throw new Error('Invalid invoice format returned from SDK');
    }
    
    // Validate that we got a proper BOLT11 invoice
    if (!bolt11Invoice || typeof bolt11Invoice !== 'string') {
      throw new Error('Could not extract BOLT11 invoice string from SDK response');
    }
    
    if (!bolt11Invoice.startsWith('ln')) {
      throw new Error(`Invalid BOLT11 invoice format: ${bolt11Invoice.substring(0, 20)}...`);
    }
    
    console.log(`SPARK SERVICE: Extracted BOLT11 invoice: ${bolt11Invoice.substring(0, 50)}...`);
    
    return bolt11Invoice;
  } catch (error) {
    console.error(`SPARK SERVICE: Error creating Lightning invoice for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to create Lightning invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create Lightning invoice (legacy function for backward compatibility)
 */
export async function createSparkLightningInvoice(
  userId: string, 
  accountNumber: number, 
  amountSats: number, 
  memo?: string
): Promise<string> {
  console.log(`SPARK SERVICE: Creating Lightning invoice for user ${userId}, account ${accountNumber}, amount: ${amountSats} sats`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    const invoice = await wallet.createLightningInvoice({
      amountSats,
      memo: memo || `SparkChat deposit for user ${userId}`,
    });
    
    console.log(`SPARK SERVICE: Lightning invoice created successfully`);
    
    // Return the BOLT11 invoice string
    const inv = invoice as any;
    return inv.paymentRequest || inv.invoice;
  } catch (error) {
    console.error(`SPARK SERVICE: Error creating Lightning invoice for user ${userId}:`, error);
    throw new Error(`Failed to create Lightning invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pay Lightning invoice using Telegram ID
 */
export async function paySparkLightningInvoiceByTelegramId(
  telegramId: number, 
  invoice: string, 
  maxFeeSats?: number
): Promise<boolean> {
  console.log(`SPARK SERVICE: Paying Lightning invoice for Telegram ID: ${telegramId}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    await wallet.payLightningInvoice({
      invoice,
      maxFeeSats: maxFeeSats || 5, // Default max fee of 5 sats
    });
    
    console.log(`SPARK SERVICE: Lightning payment completed successfully`);
    
    return true;
  } catch (error) {
    console.error(`SPARK SERVICE: Error paying Lightning invoice for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to pay Lightning invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pay Lightning invoice (legacy function for backward compatibility)
 */
export async function paySparkLightningInvoice(
  userId: string, 
  accountNumber: number, 
  invoice: string, 
  maxFeeSats?: number
): Promise<boolean> {
  console.log(`SPARK SERVICE: Paying Lightning invoice for user ${userId}, account ${accountNumber}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    await wallet.payLightningInvoice({
      invoice,
      maxFeeSats: maxFeeSats || 5, // Default max fee of 5 sats
    });
    
    console.log(`SPARK SERVICE: Lightning payment completed successfully`);
    
    return true;
  } catch (error) {
    console.error(`SPARK SERVICE: Error paying Lightning invoice for user ${userId}:`, error);
    throw new Error(`Failed to pay Lightning invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Withdraw on-chain using Telegram ID
 */
export async function withdrawSparkOnChainByTelegramId(
  telegramId: number, 
  amountSats: number, 
  btcAddress: string
): Promise<{ success: boolean; requestId?: string }> {
  console.log(`SPARK SERVICE: Withdrawing on-chain for Telegram ID: ${telegramId}, amount: ${amountSats} sats to ${btcAddress}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    const result = await wallet.withdraw({
      onchainAddress: btcAddress,
      amountSats,
      exitSpeed: ("MEDIUM" as any), // Cast para evitar error de tipo
    });
    
    if (!result || !result.id) {
      throw new Error('Withdrawal request could not be completed.');
    }
    
    console.log(`SPARK SERVICE: On-chain withdrawal initiated successfully`);
    
    return {
      success: true,
      requestId: result.id
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error withdrawing on-chain for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to withdraw on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Withdraw on-chain (legacy function for backward compatibility)
 */
export async function withdrawSparkOnChain(
  userId: string, 
  accountNumber: number, 
  amountSats: number, 
  btcAddress: string
): Promise<{ success: boolean; requestId?: string }> {
  console.log(`SPARK SERVICE: Withdrawing on-chain for user ${userId}, account ${accountNumber}, amount: ${amountSats} sats to ${btcAddress}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    const result = await wallet.withdraw({
      onchainAddress: btcAddress,
      amountSats,
      exitSpeed: ("MEDIUM" as any), // Cast para evitar error de tipo
    });
    
    if (!result || !result.id) {
      throw new Error('Withdrawal request could not be completed.');
    }
    
    console.log(`SPARK SERVICE: On-chain withdrawal initiated successfully`);
    
    return {
      success: true,
      requestId: result.id
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error withdrawing on-chain for user ${userId}:`, error);
    throw new Error(`Failed to withdraw on-chain: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Spark address for a user using Telegram ID
 */
export async function getSparkAddressByTelegramId(telegramId: number): Promise<string> {
  console.log(`SPARK SERVICE: Getting Spark address for Telegram ID: ${telegramId}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    const address = await wallet.getSparkAddress();
    
    console.log(`SPARK SERVICE: Spark address retrieved: ${address}`);
    
    return address;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting Spark address for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to get Spark address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get Spark address for a user (legacy function for backward compatibility)
 */
export async function getSparkAddress(userId: string, accountNumber: number): Promise<string> {
  console.log(`SPARK SERVICE: Getting Spark address for user ${userId}, account ${accountNumber}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    const address = await wallet.getSparkAddress();
    
    console.log(`SPARK SERVICE: Spark address retrieved: ${address}`);
    
    return address;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting Spark address for user ${userId}:`, error);
    throw new Error(`Failed to get Spark address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get user's identity public key using Telegram ID
 */
export async function getSparkIdentityPublicKeyByTelegramId(telegramId: number): Promise<string> {
  console.log(`SPARK SERVICE: Getting identity public key for Telegram ID: ${telegramId}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    const publicKey = await wallet.getIdentityPublicKey();
    
    console.log(`SPARK SERVICE: Identity public key retrieved`);
    
    return publicKey;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting identity public key for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to get identity public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get user's identity public key (legacy function for backward compatibility)
 */
export async function getSparkIdentityPublicKey(userId: string, accountNumber: number): Promise<string> {
  console.log(`SPARK SERVICE: Getting identity public key for user ${userId}, account ${accountNumber}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    const publicKey = await wallet.getIdentityPublicKey();
    
    console.log(`SPARK SERVICE: Identity public key retrieved`);
    
    return publicKey;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting identity public key for user ${userId}:`, error);
    throw new Error(`Failed to get identity public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get transfer history for a user using Telegram ID
 */
export async function getSparkTransfersByTelegramId(telegramId: number): Promise<AppTransaction[]> {
  console.log(`SPARK SERVICE: Getting transfers for Telegram ID: ${telegramId}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const wallet = await getUserWallet(walletInfo.userId, walletInfo.accountNumber);
    const { transfers } = await wallet.getTransfers();
    
    // Transform Spark transfers to our AppTransaction format
    const transactions: AppTransaction[] = transfers.map((transfer: any) => ({
      id: transfer.id || `transfer_${Date.now()}`,
      type: transfer.transferDirection === 'INCOMING' ? 'deposit' : 'withdraw',
      amount: typeof transfer.totalValue === 'bigint' ? Number(transfer.totalValue) / 100_000_000 : transfer.totalValue / 100_000_000, // Convert sats to BTC
      currency: 'BTC',
      timestamp: transfer.createdTime ? new Date(transfer.createdTime) : new Date(),
      description: transfer.memo || `Spark transfer ${transfer.transferDirection?.toLowerCase?.()}`,
      status: transfer.status === 'TRANSFER_STATUS_COMPLETED' ? 'COMPLETED' : 'PENDING'
    }));
    
    console.log(`SPARK SERVICE: Retrieved ${transactions.length} transfers`);
    
    return transactions;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting transfers for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to get transfers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get transfer history for a user (legacy function for backward compatibility)
 */
export async function getSparkTransfers(userId: string, accountNumber: number): Promise<AppTransaction[]> {
  console.log(`SPARK SERVICE: Getting transfers for user ${userId}, account ${accountNumber}`);
  
  try {
    const wallet = await getUserWallet(userId, accountNumber);
    const { transfers } = await wallet.getTransfers();
    
    // Transform Spark transfers to our AppTransaction format
    const transactions: AppTransaction[] = transfers.map((transfer: any) => ({
      id: transfer.id || `transfer_${Date.now()}`,
      type: transfer.transferDirection === 'INCOMING' ? 'deposit' : 'withdraw',
      amount: typeof transfer.totalValue === 'bigint' ? Number(transfer.totalValue) / 100_000_000 : transfer.totalValue / 100_000_000, // Convert sats to BTC
      currency: 'BTC',
      timestamp: transfer.createdTime ? new Date(transfer.createdTime) : new Date(),
      description: transfer.memo || `Spark transfer ${transfer.transferDirection?.toLowerCase?.()}`,
      status: transfer.status === 'TRANSFER_STATUS_COMPLETED' ? 'COMPLETED' : 'PENDING'
    }));
    
    console.log(`SPARK SERVICE: Retrieved ${transactions.length} transfers`);
    
    return transactions;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting transfers for user ${userId}:`, error);
    throw new Error(`Failed to get transfers: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear wallet cache (useful for testing or when wallets need to be reinitialized)
 */
export async function clearWalletCache(): Promise<void> {
  console.log('SPARK SERVICE: Clearing wallet cache');
  walletCache.clear();
}

/**
 * Get wallet cache size (for debugging)
 */
export async function getWalletCacheSize(): Promise<number> {
  return walletCache.size;
}

/**
 * Diagnostic function to test Spark SDK connectivity
 */
export async function testSparkConnectivity(): Promise<{ success: boolean; error?: string; details?: any }> {
  console.log('SPARK SERVICE: Testing Spark SDK connectivity...');
  
  try {
    // Test with a simple wallet initialization
    const testMnemonic = 'test test test test test test test test test test test junk';
    const seedBuffer = await bip39.mnemonicToSeed(testMnemonic);
    const seedHex = seedBuffer.toString('hex');
    
    console.log('SPARK SERVICE: Attempting to initialize test wallet...');
    
    // Configure network based on SPARK_NETWORK environment variable
    const networkConfig = SPARK_NETWORK === 'TESTNET' ? 'TESTNET' : 
                         SPARK_NETWORK === 'MAINNET' ? 'MAINNET' : 
                         SPARK_NETWORK === 'SIGNET' ? 'SIGNET' : 
                         SPARK_NETWORK === 'REGTEST' ? 'REGTEST' : 'TESTNET';
    
    const { wallet } = await SparkWallet.initialize({
      mnemonicOrSeed: seedHex,
      accountNumber: 0,
      options: {
        network: networkConfig
      }
    });
    
    console.log(`SPARK SERVICE: Test wallet initialized successfully on network: ${networkConfig}`);
    
    // Try to get balance to test connectivity
    const balance = await wallet.getBalance();
    console.log('SPARK SERVICE: Balance retrieved successfully:', balance);
    
    // Convert BigInt to number for serialization
    const serializableBalance = {
      balance: typeof balance.balance === 'bigint' ? Number(balance.balance) : balance.balance,
      tokenBalances: balance.tokenBalances ? Array.from(balance.tokenBalances.entries()).map(([key, value]) => ({
        key,
        balance: typeof value.balance === 'bigint' ? Number(value.balance) : value.balance
      })) : []
    };
    
    return {
      success: true,
      details: {
        network: networkConfig,
        balance: serializableBalance
      }
    };
  } catch (error) {
    console.error('SPARK SERVICE: Connectivity test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        network: SPARK_NETWORK,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown'
      }
    };
  }
}

/**
 * Get LRC-20 token balances for a user using Telegram ID
 */
export async function getLRC20TokenBalancesByTelegramId(telegramId: number): Promise<TokenBalance[]> {
  console.log(`SPARK SERVICE: Getting LRC-20 token balances for Telegram ID: ${telegramId}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const lrc20Wallet = await getUserLRC20Wallet(walletInfo.userId, walletInfo.accountNumber);
    
    // Sync wallet to get latest balances
    await lrc20Wallet.syncWallet();
    
    // Get LRC-20 balances
    const balances = await lrc20Wallet.getLrc20Balances();
    
    // Convert bigint to number and format results
    const tokenBalances: TokenBalance[] = balances.map(balance => ({
      tokenPubkey: balance.tokenPubkey,
      balance: typeof balance.balance === 'bigint' ? Number(balance.balance) : balance.balance,
      name: balance.name,
      symbol: balance.symbol
    }));
    
    console.log(`SPARK SERVICE: Retrieved ${tokenBalances.length} LRC-20 token balances`);
    
    return tokenBalances;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting LRC-20 token balances for Telegram ID ${telegramId}:`, error);
    throw new Error(`Failed to get LRC-20 token balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get LRC-20 token balances for a user (legacy function for backward compatibility)
 */
export async function getLRC20TokenBalances(userId: string, accountNumber: number): Promise<TokenBalance[]> {
  console.log(`SPARK SERVICE: Getting LRC-20 token balances for user ${userId}, account ${accountNumber}`);
  
  try {
    const lrc20Wallet = await getUserLRC20Wallet(userId, accountNumber);
    
    // Sync wallet to get latest balances
    await lrc20Wallet.syncWallet();
    
    // Get LRC-20 balances
    const balances = await lrc20Wallet.getLrc20Balances();
    
    // Convert bigint to number and format results
    const tokenBalances: TokenBalance[] = balances.map(balance => ({
      tokenPubkey: balance.tokenPubkey,
      balance: typeof balance.balance === 'bigint' ? Number(balance.balance) : balance.balance,
      name: balance.name,
      symbol: balance.symbol
    }));
    
    console.log(`SPARK SERVICE: Retrieved ${tokenBalances.length} LRC-20 token balances`);
    
    return tokenBalances;
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting LRC-20 token balances for user ${userId}:`, error);
    throw new Error(`Failed to get LRC-20 token balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Transfer LRC-20 tokens using Telegram ID
 */
export async function transferLRC20TokensByTelegramId(
  telegramId: number,
  tokenPubkey: string,
  amount: number,
  recipientAddress: string,
  feeRateVb: number = 10
): Promise<TokenTransferResult> {
  console.log(`SPARK SERVICE: Transferring ${amount} tokens (${tokenPubkey}) from ${telegramId} to ${recipientAddress}`);
  
  try {
    const walletInfo = await getUserWalletInfo(telegramId);
    const lrc20Wallet = await getUserLRC20Wallet(walletInfo.userId, walletInfo.accountNumber);
    
    // Sync wallet to get latest balances
    await lrc20Wallet.syncWallet();
    
    // Check if user has sufficient token balance
    const balances = await lrc20Wallet.getLrc20Balances();
    const tokenBalance = balances.find(b => b.tokenPubkey === tokenPubkey);
    
    if (!tokenBalance || Number(tokenBalance.balance) < amount) {
      throw new Error(`Insufficient token balance. Required: ${amount}, Available: ${tokenBalance ? Number(tokenBalance.balance) : 0}`);
    }
    
    // Prepare transfer transaction
    const transferTx = await lrc20Wallet.prepareTransfer([
      {
        recipient: recipientAddress,
        amount: BigInt(amount),
        tokenPubkey: tokenPubkey
      }
    ], feeRateVb);
    
    // Convert to DTO and broadcast transaction
    const transferTxDto = Lrc20TransactionDto.fromLrc20Transaction(transferTx);
    const txId = await lrc20Wallet.broadcast(transferTxDto);
    
    console.log(`SPARK SERVICE: LRC-20 token transfer successful. TXID: ${txId}`);
    
    return {
      success: true,
      transactionId: txId,
      amount,
      tokenPubkey,
      recipient: recipientAddress
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error transferring LRC-20 tokens for Telegram ID ${telegramId}:`, error);
    return {
      success: false,
      amount,
      tokenPubkey,
      recipient: recipientAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Transfer LRC-20 tokens (legacy function for backward compatibility)
 */
export async function transferLRC20Tokens(
  userId: string,
  accountNumber: number,
  tokenPubkey: string,
  amount: number,
  recipientAddress: string,
  feeRateVb: number = 10
): Promise<TokenTransferResult> {
  console.log(`SPARK SERVICE: Transferring ${amount} tokens (${tokenPubkey}) from user ${userId} to ${recipientAddress}`);
  
  try {
    const lrc20Wallet = await getUserLRC20Wallet(userId, accountNumber);
    
    // Sync wallet to get latest balances
    await lrc20Wallet.syncWallet();
    
    // Check if user has sufficient token balance
    const balances = await lrc20Wallet.getLrc20Balances();
    const tokenBalance = balances.find(b => b.tokenPubkey === tokenPubkey);
    
    if (!tokenBalance || Number(tokenBalance.balance) < amount) {
      throw new Error(`Insufficient token balance. Required: ${amount}, Available: ${tokenBalance ? Number(tokenBalance.balance) : 0}`);
    }
    
    // Prepare transfer transaction
    const transferTx = await lrc20Wallet.prepareTransfer([
      {
        recipient: recipientAddress,
        amount: BigInt(amount),
        tokenPubkey: tokenPubkey
      }
    ], feeRateVb);
    
    // Convert to DTO and broadcast transaction
    const transferTxDto = Lrc20TransactionDto.fromLrc20Transaction(transferTx);
    const txId = await lrc20Wallet.broadcast(transferTxDto);
    
    console.log(`SPARK SERVICE: LRC-20 token transfer successful. TXID: ${txId}`);
    
    return {
      success: true,
      transactionId: txId,
      amount,
      tokenPubkey,
      recipient: recipientAddress
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error transferring LRC-20 tokens for user ${userId}:`, error);
    return {
      success: false,
      amount,
      tokenPubkey,
      recipient: recipientAddress,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get token information by token pubkey
 */
export async function getTokenInfo(tokenPubkey: string): Promise<{ name: string; symbol: string; totalSupply?: number }> {
  console.log(`SPARK SERVICE: Getting token info for ${tokenPubkey}`);
  
  try {
    // For now, return mock data since we don't have a specific user context
    // In production, this would query the LRC-20 node for token metadata
    return {
      name: 'Sample Token',
      symbol: 'SMPL',
      totalSupply: 1000000
    };
  } catch (error) {
    console.error(`SPARK SERVICE: Error getting token info for ${tokenPubkey}:`, error);
    throw new Error(`Failed to get token info: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear LRC-20 wallet cache
 */
export async function clearLRC20WalletCache(): Promise<void> {
  console.log(`SPARK SERVICE: Clearing LRC-20 wallet cache`);
  lrc20WalletCache.clear();
}

/**
 * Get LRC-20 wallet cache size
 */
export async function getLRC20WalletCacheSize(): Promise<number> {
  return lrc20WalletCache.size;
}