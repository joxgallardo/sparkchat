'use server';

/**
 * @fileOverview UMA (Universal Money Address) integration service
 * 
 * This module provides UMA functionality for cross-currency payments.
 * UMA allows users to send and receive payments using addresses like usuario@sparkchat.btc
 * 
 * UMA SDK: @uma-sdk/core
 */

import { getUserWalletInfo, getUserUMAAddress } from './userManager';
import { 
  createSparkLightningInvoiceByTelegramId,
  paySparkLightningInvoiceByTelegramId,
  getSparkBalanceByTelegramId
} from './spark';

// --- UMA Configuration ---
const UMA_DOMAIN = process.env.UMA_DOMAIN || 'sparkchat.btc';
const UMA_SIGNING_KEY = process.env.UMA_SIGNING_KEY || 'mock-signing-key-for-development';
const UMA_ENCRYPTION_KEY = process.env.UMA_ENCRYPTION_KEY || 'mock-encryption-key-for-development';

// --- Types ---
export interface UMAPaymentRequest {
  fromUserId: string;
  toUMAAddress: string;
  amount: number;
  currency: 'BTC' | 'USD' | 'EUR' | 'GBP';
  memo?: string;
}

export interface UMAQuote {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  exchangeRate: number;
  fees: number;
  estimatedTime: string;
}

export interface UMAPaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  fees: number;
  estimatedTime: string;
  error?: string;
}

// --- Helper Functions ---

/**
 * Validate UMA address format
 */
export async function validateUMAAddress(address: string): Promise<boolean> {
  // UMA address format: username@domain.btc
  // Username must be at least 1 character and contain only alphanumeric and underscore
  // Domain must be valid and end with .btc
  const umaRegex = /^[a-zA-Z0-9_]{1,}[@][a-zA-Z0-9.-]+\.[b][t][c]$/;
  return umaRegex.test(address);
}

/**
 * Parse UMA address to extract username and domain
 */
export async function parseUMAAddress(address: string): Promise<{ username: string; domain: string } | null> {
  const isValid = await validateUMAAddress(address);
  if (!isValid) {
    return null;
  }
  
  const [username, domain] = address.split('@');
  return { username, domain };
}

/**
 * Generate UMA address for a user
 */
export async function generateUMAAddress(telegramId: number): Promise<string> {
  const userInfo = await getUserWalletInfo(telegramId);
  return userInfo.umaAddress;
}

/**
 * Get UMA quote for currency conversion
 */
export async function getUMAQuote(
  fromCurrency: string, 
  toCurrency: string, 
  amount: number
): Promise<UMAQuote> {
  console.log(`UMA SERVICE: Getting quote for ${amount} ${fromCurrency} to ${toCurrency}`);
  
  // Mock exchange rates for development
  // In production, this would call UMA SDK or external exchange API
  const mockRates: Record<string, number> = {
    'BTC-USD': 45000, // 1 BTC = $45,000
    'USD-BTC': 1/45000, // 1 USD = 0.00002222 BTC
    'BTC-EUR': 42000, // 1 BTC = €42,000
    'EUR-BTC': 1/42000, // 1 EUR = 0.00002381 BTC
    'USD-EUR': 0.93, // 1 USD = €0.93
    'EUR-USD': 1.08, // 1 EUR = $1.08
  };
  
  const rateKey = `${fromCurrency}-${toCurrency}`;
  const exchangeRate = mockRates[rateKey] || 1; // Default to 1:1 if no rate found
  
  const convertedAmount = amount * exchangeRate;
  const fees = Math.max(0.001, convertedAmount * 0.001); // 0.1% fee, minimum 0.001
  
  return {
    fromCurrency,
    toCurrency,
    amount,
    convertedAmount,
    exchangeRate,
    fees,
    estimatedTime: '2-5 minutes'
  };
}

/**
 * Send UMA payment (cross-currency)
 */
export async function sendUMAPayment(
  fromTelegramId: number,
  toUMAAddress: string,
  amount: number,
  currency: 'BTC' | 'USD' | 'EUR' | 'GBP',
  memo?: string
): Promise<UMAPaymentResult> {
  console.log(`UMA SERVICE: Sending ${amount} ${currency} from ${fromTelegramId} to ${toUMAAddress}`);
  
  try {
    // Validate UMA address
    const isValid = await validateUMAAddress(toUMAAddress);
    if (!isValid) {
      throw new Error('Invalid UMA address format');
    }
    
    // Get sender's wallet info
    const senderInfo = await getUserWalletInfo(fromTelegramId);
    
    // Parse destination UMA address
    const parsedAddress = await parseUMAAddress(toUMAAddress);
    if (!parsedAddress) {
      throw new Error('Could not parse UMA address');
    }
    
    // Get quote for the conversion
    const quote = await getUMAQuote(currency, 'BTC', amount);
    
    // Check if sender has sufficient balance
    const { balance } = await getSparkBalanceByTelegramId(fromTelegramId);
    const requiredBTC = quote.convertedAmount + quote.fees;
    const currentBTC = balance / 100_000_000; // Convert sats to BTC
    
    if (currentBTC < requiredBTC) {
      throw new Error(`Insufficient balance. Required: ${requiredBTC.toFixed(8)} BTC, Available: ${currentBTC.toFixed(8)} BTC`);
    }
    
    // For now, we'll simulate the UMA payment
    // In production, this would:
    // 1. Create a Lightning invoice for the recipient
    // 2. Pay the invoice using Spark Lightning
    // 3. Handle the cross-currency conversion via UMA protocol
    
    const paymentId = `uma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`UMA SERVICE: Payment initiated - ID: ${paymentId}`);
    
    return {
      success: true,
      paymentId,
      transactionId: `tx_${paymentId}`,
      amount: quote.convertedAmount,
      currency: 'BTC',
      fees: quote.fees,
      estimatedTime: quote.estimatedTime
    };
    
  } catch (error) {
    console.error(`UMA SERVICE: Error sending UMA payment:`, error);
    
    return {
      success: false,
      amount,
      currency,
      fees: 0,
      estimatedTime: '0',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Receive UMA payment (handle incoming UMA payments)
 */
export async function receiveUMAPayment(
  umaAddress: string,
  paymentDetails: {
    amount: number;
    currency: string;
    fromAddress?: string;
    memo?: string;
  }
): Promise<UMAPaymentResult> {
  console.log(`UMA SERVICE: Receiving payment to ${umaAddress}: ${paymentDetails.amount} ${paymentDetails.currency}`);
  
  try {
    // Validate UMA address
    const isValid = await validateUMAAddress(umaAddress);
    if (!isValid) {
      throw new Error('Invalid UMA address format');
    }
    
    // Parse the UMA address to find the user
    const parsedAddress = await parseUMAAddress(umaAddress);
    if (!parsedAddress) {
      throw new Error('Could not parse UMA address');
    }
    
    // Extract account number from UMA address
    // Format: username{accountNumber}@sparkchat.btc
    const accountNumberMatch = parsedAddress.username.match(/(\d+)$/);
    if (!accountNumberMatch) {
      throw new Error('Could not extract account number from UMA address');
    }
    
    const accountNumber = parseInt(accountNumberMatch[1]);
    
    // For now, we'll simulate receiving the payment
    // In production, this would:
    // 1. Validate the incoming payment via UMA protocol
    // 2. Convert the currency to BTC if needed
    // 3. Credit the user's Spark wallet
    
    const paymentId = `uma_receive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`UMA SERVICE: Payment received - ID: ${paymentId}, Account: ${accountNumber}`);
    
    return {
      success: true,
      paymentId,
      transactionId: `tx_${paymentId}`,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      fees: 0,
      estimatedTime: 'instant'
    };
    
  } catch (error) {
    console.error(`UMA SERVICE: Error receiving UMA payment:`, error);
    
    return {
      success: false,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      fees: 0,
      estimatedTime: '0',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get UMA payment status
 */
export async function getUMAPaymentStatus(paymentId: string): Promise<{
  status: 'pending' | 'completed' | 'failed';
  details?: any;
}> {
  console.log(`UMA SERVICE: Getting status for payment ${paymentId}`);
  
  // Mock implementation - in production this would query UMA network
  return {
    status: 'completed',
    details: {
      paymentId,
      timestamp: new Date().toISOString(),
      network: 'UMA'
    }
  };
}

/**
 * List UMA payment history for a user
 */
export async function getUMAPaymentHistory(telegramId: number): Promise<Array<{
  id: string;
  type: 'sent' | 'received';
  amount: number;
  currency: string;
  counterparty: string;
  timestamp: Date;
  status: string;
}>> {
  console.log(`UMA SERVICE: Getting payment history for user ${telegramId}`);
  
  // Mock implementation - in production this would query UMA network
  return [
    {
      id: 'uma_123456',
      type: 'sent',
      amount: 0.001,
      currency: 'BTC',
      counterparty: 'user123@bitnob.btc',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      status: 'completed'
    },
    {
      id: 'uma_789012',
      type: 'received',
      amount: 50,
      currency: 'USD',
      counterparty: 'merchant@yellowcard.btc',
      timestamp: new Date(Date.now() - 172800000), // 2 days ago
      status: 'completed'
    }
  ];
}

/**
 * Test UMA connectivity and configuration
 */
export async function testUMAConnectivity(): Promise<{
  success: boolean;
  error?: string;
  details?: any;
}> {
  console.log('UMA SERVICE: Testing UMA connectivity...');
  
  try {
    // Test UMA address validation
    const testAddress = 'testuser123@sparkchat.btc';
    const isValid = await validateUMAAddress(testAddress);
    
    if (!isValid) {
      throw new Error('UMA address validation failed');
    }
    
    // Test UMA address parsing
    const parsed = await parseUMAAddress(testAddress);
    if (!parsed) {
      throw new Error('UMA address parsing failed');
    }
    
    // Test quote generation
    const quote = await getUMAQuote('USD', 'BTC', 100);
    if (!quote || quote.convertedAmount <= 0) {
      throw new Error('UMA quote generation failed');
    }
    
    return {
      success: true,
      details: {
        domain: UMA_DOMAIN,
        addressValidation: true,
        quoteGeneration: true,
        mockMode: true
      }
    };
    
  } catch (error) {
    console.error('UMA SERVICE: Connectivity test failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 