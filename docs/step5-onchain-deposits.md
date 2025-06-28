# Step 5: On-chain BTC Deposits Implementation

## Overview

This document describes the implementation of Step 5 from the SparkChat UMA Integration plan, which focuses on enabling on-chain Bitcoin deposits through address generation and claim functionality.

## Implementation Status

✅ **COMPLETED** - All required functionality has been implemented and tested.

## Features Implemented

### 1. Deposit Address Generation

**Command**: `/deposit` (without amount)
**Function**: `getSparkDepositAddressByTelegramId()`

- Generates a new Bitcoin on-chain deposit address for each user
- Uses Spark SDK's `getSingleUseDepositAddress()` method
- Returns a valid Bitcoin address (format: `bc1p...` for testnet)
- Each address is single-use for security

**User Experience**:
```
📍 Dirección de depósito on-chain

bc1p2sldkfjalsdkfjalsdkfjalsdkfjalsdkfjalsdkfjalsdkfjalsdkfj

💡 Instrucciones:
• Envía BTC a esta dirección
• Espera 3 confirmaciones
• Usa /claim <txid> para reclamar
```

### 2. Deposit Claiming

**Command**: `/claim <txid>`
**Function**: `claimSparkDepositByTelegramId()`

- Allows users to claim on-chain deposits after confirmation
- Validates TXID format and attempts to claim the deposit
- Uses Spark SDK's `claimDeposit(txId)` method
- Provides user feedback on success/failure

**User Experience**:
```
⏳ Reclamando depósito...

✅ Depósito reclamado exitosamente

🔗 TXID: abc123def456789abcdef123456789abcdef123456789abcdef123456789abc
💡 Usa /balance para ver tu saldo actualizado
```

### 3. Balance Checking

**Command**: `/balance`
**Function**: `getSparkBalanceByTelegramId()`

- Displays current BTC balance in satoshis and BTC
- Shows token balances (for future LRC-20 support)
- Integrates with Spark SDK for real-time balance
- Supports both regular and force-refetch modes

**User Experience**:
```
💰 *Saldos actuales*

🪙 Bitcoin: 0.00123456 BTC (123,456 sats)
💵 USD: $0.00 USD

💡 Usa /deposit para agregar fondos
```

### 4. Enhanced Help System

Updated `/help` command with clear instructions for on-chain deposits:

```
*💰 Operaciones Bitcoin:*
/deposit <cantidad> - Depositar BTC vía Lightning (invoice)
/deposit - Obtener dirección on-chain para depósito de BTC
/deposit_address - Obtener dirección on-chain (mismo que /deposit)
/claim <txid> - Reclamar depósito on-chain después de confirmaciones
```

## Technical Implementation

### Service Layer (`src/services/spark.ts`)

```typescript
// Generate deposit address
export async function getSparkDepositAddressByTelegramId(telegramId: number): Promise<string>

// Claim deposit
export async function claimSparkDepositByTelegramId(telegramId: number, txId: string): Promise<boolean>

// Get balance
export async function getSparkBalanceByTelegramId(telegramId: number): Promise<{ balance: number; tokenBalances: Map<string, number> }>
```

### Action Layer (`src/app/actions.ts`)

```typescript
// Get deposit address action
export async function getDepositAddressAction(telegramId: number): Promise<string>

// Claim deposit action
export async function claimDepositAction(txId: string, telegramId: number): Promise<boolean>
```

### Bot Handlers (`src/bot/handlers/wallet.ts`)

```typescript
// Handle deposit address request
export async function handleDepositAddress(bot: TelegramBot, chatId: number, telegramId?: number)

// Handle deposit claim
export async function handleClaimDeposit(bot: TelegramBot, chatId: number, txId: string, telegramId?: number)
```

### Command Integration (`src/bot/handlers/commands.ts`)

```typescript
// /deposit command without amount
bot.onText(/\/deposit$/, withSession(async (sessionContext: SessionContext) => {
  // Generate on-chain deposit address
}))

// /claim command
bot.onText(/\/claim (.+)/, withSession(async (sessionContext: SessionContext, match) => {
  // Claim deposit with TXID
}))
```

## Security Considerations

1. **Single-use Addresses**: Each deposit address is generated fresh and should only be used once
2. **TXID Validation**: Claim function validates TXID format before processing
3. **User Isolation**: Each user has their own wallet derived from master mnemonic
4. **Error Handling**: Comprehensive error handling prevents information leakage

## Testing

### Automated Tests

Run the validation script to test all functionality:

```bash
node scripts/test-step5-validation.js
```

### Manual Testing

1. **Generate Deposit Address**:
   ```
   /deposit
   ```
   Expected: Returns a valid Bitcoin address

2. **Claim Deposit** (with real TXID):
   ```
   /claim <real_txid>
   ```
   Expected: Claims the deposit and updates balance

3. **Check Balance**:
   ```
   /balance
   ```
   Expected: Shows updated balance after claiming

## Error Handling

The implementation includes comprehensive error handling:

- **Invalid TXID**: Clear error message for malformed transaction IDs
- **Network Issues**: Graceful handling of Spark SDK connection problems
- **User Not Found**: Proper error when user doesn't exist in database
- **Insufficient Confirmations**: Guidance on waiting for confirmations

## User Flow

1. **User wants to deposit BTC on-chain**:
   - Sends `/deposit` command
   - Bot generates and returns deposit address
   - User sends BTC to the address from external wallet

2. **User wants to claim deposit**:
   - Waits for 3+ confirmations on blockchain
   - Sends `/claim <txid>` command
   - Bot attempts to claim the deposit
   - User receives confirmation and updated balance

3. **User checks balance**:
   - Sends `/balance` command
   - Bot displays current BTC and token balances
   - Shows both satoshis and BTC amounts

## Integration with Spark SDK

The implementation leverages the official Spark SDK:

- **Wallet Initialization**: Uses master mnemonic and account numbers
- **Address Generation**: `wallet.getSingleUseDepositAddress()`
- **Deposit Claiming**: `wallet.claimDeposit(txId)`
- **Balance Checking**: `wallet.getBalance()`

## Next Steps

With Step 5 completed, the system is ready for:

1. **Step 6**: On-chain BTC withdrawals
2. **Step 7**: Lightning Network deposits
3. **Step 8**: Lightning Network payments
4. **Step 9**: UMA integration for cross-currency payments

## Files Modified

- `src/services/spark.ts` - Enhanced balance and deposit functions
- `src/app/actions.ts` - Added deposit address and claim actions
- `src/bot/handlers/wallet.ts` - Implemented deposit and claim handlers
- `src/bot/handlers/commands.ts` - Added command routing
- `src/bot/utils/telegram.ts` - Updated help messages
- `scripts/test-step5-validation.js` - Comprehensive testing script

## Dependencies

- `@buildonspark/spark-sdk` - Official Spark SDK
- `bip39` - Mnemonic handling
- `node-telegram-bot-api` - Telegram bot integration

## Configuration

Required environment variables:
- `SPARK_NETWORK` - Network to use (TESTNET/MAINNET)
- `SPARK_MASTER_MNEMONIC` - Master mnemonic for wallet derivation

## Conclusion

Step 5 has been successfully implemented with all required functionality for on-chain Bitcoin deposits. The system provides a complete user experience from address generation to deposit claiming, with proper error handling and user guidance throughout the process. 