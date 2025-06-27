# Lightspark createInvoice Error Report

## 🚨 **Error Report for Lightspark Support**

### **Issue Summary**
The `createInvoice` method in the Lightspark JavaScript SDK is failing with "Something went wrong" error, despite proper authentication and wallet deployment.

---

## 📋 **Technical Information**

### **Environment Details**
- **SDK Version:** `@lightsparkdev/wallet-sdk@0.12.15`
- **Node.js Version:** 18+
- **Platform:** macOS (darwin 24.5.0)
- **Network:** Testnet (`test: true` in JWT)

### **Account & Wallet Information**
- **Account ID:** `0197673c-b416-9af2-0000-e06272dd8c52`
- **Wallet ID:** `Wallet:0197afab-c27b-4f0e-0000-95f1096bfbbf`
- **Node ID:** `LightsparkNodeWithOSKLND:01976310-47be-f96b-0000-def73a50607e`
- **Wallet Status:** `DEPLOYED`

### **Authentication Status**
- ✅ **JWT Generation:** Working correctly
- ✅ **JWT Login:** Successful
- ✅ **Token Storage:** InMemoryTokenStorage working
- ✅ **Account Authentication:** Verified

### **Wallet Status**
- ✅ **Wallet Deployment:** Completed successfully
- ✅ **Wallet Access:** Can retrieve wallet information
- ✅ **Balances:** Accessible (0 BTC, 0 USD - new wallet)
- ✅ **Dashboard:** Working correctly
- ✅ **Transactions:** Can access transaction history

---

## 🐛 **Error Details**

### **Error Message**
```
LightsparkException [Error]: Request CreateInvoice failed. 
[{"message":"Something went wrong.","locations":[{"line":8,"column":5}],"path":["create_invoice"]}]
```

### **Error Code**
```
code: 'RequestFailed'
```

### **Code That Fails**
```typescript
// All these approaches fail with the same error:

// Approach 1: Minimal parameters
const invoice = await client.createInvoice(10000000); // 0.0001 BTC

// Approach 2: With memo
const invoice = await client.createInvoice(10000000, "Test invoice");

// Approach 3: With all parameters
const invoice = await client.createInvoice(
  10000000,
  "Test invoice",
  undefined, // InvoiceType.STANDARD
  86400 // 24 hours expiry
);
```

### **JWT Claims (Working)**
```json
{
  "aud": "https://api.lightspark.com",
  "sub": "0197673c-b416-9af2-0000-e06272dd8c52",
  "iat": 1751001303,
  "exp": 1751004903,
  "test": true
}
```

### **Wallet Information (Working)**
```json
{
  "id": "Wallet:0197afab-c27b-4f0e-0000-95f1096bfbbf",
  "status": "DEPLOYED",
  "type": "Wallet",
  "balances": {
    "ownedBalance": 0,
    "availableToSendBalance": 0,
    "availableToWithdrawBalance": 0
  }
}
```

---

## 🔍 **Investigation Results**

### **What Works**
1. ✅ JWT authentication and login
2. ✅ Wallet deployment and access
3. ✅ Balance retrieval
4. ✅ Transaction history access
5. ✅ Dashboard access
6. ✅ All other SDK methods tested

### **What Doesn't Work**
1. ❌ `client.createInvoice()` - fails with "Something went wrong"
2. ❌ All parameter combinations fail with the same error
3. ❌ No specific error details provided

### **Available Methods on Client**
```javascript
[
  'getCurrentWallet',
  'getWalletDashboard',
  'createInvoice', // ❌ This method fails
  'cancelInvoice',
  'payInvoice',
  'decodeInvoice',
  'createTestModeInvoice',
  'createTestModePayment',
  'isWalletUnlocked'
]
```

### **Available Methods on Wallet**
```javascript
[
  'id',
  'createdAt',
  'updatedAt',
  'status',
  'typename',
  'balances',
  'getTransactions',
  'getPaymentRequests',
  'getWithdrawalRequests',
  'toJson'
]
```

---

## 🛠️ **Attempted Solutions**

### **1. Different Parameter Combinations**
- ❌ `createInvoice(amountMsats)`
- ❌ `createInvoice(amountMsats, memo)`
- ❌ `createInvoice(amountMsats, memo, type, expiry)`

### **2. Node Configuration**
- ✅ Node ID is configured: `LightsparkNodeWithOSKLND:01976310-47be-f96b-0000-def73a50607e`
- ❌ Wallet doesn't have `nodeId` property
- ❌ No direct node access methods available

### **3. Authentication Verification**
- ✅ JWT is valid and not expired
- ✅ Login is successful
- ✅ Account has proper permissions for other operations

### **4. Network Configuration**
- ✅ Testnet is properly configured
- ✅ JWT includes `test: true`
- ✅ Account is on testnet

---

## 🤔 **Questions for Lightspark Support**

### **1. Permissions & Configuration**
- What specific permissions does a wallet need to create invoices?
- Is there a step missing in the wallet setup process?
- Does the wallet need to be "activated" or "verified" in the dashboard?

### **2. Node Requirements**
- Does the wallet need to be associated with a specific node?
- Is the node `LightsparkNodeWithOSKLND:01976310-47be-f96b-0000-def73a50607e` properly configured?
- Are there additional node activation steps required?

### **3. SDK Usage**
- Is the `createInvoice` method signature correct for version 0.12.15?
- Are there any missing initialization steps?
- Should we be using a different method or approach?

### **4. Error Details**
- How can we get more detailed error information?
- Is there a way to enable debug logging?
- What does "Something went wrong" specifically mean?

### **5. Alternative Approaches**
- Is there an alternative way to create invoices?
- Should we use a different SDK method?
- Are there any workarounds for this issue?

---

## 📊 **Debug Information**

### **Full Error Stack Trace**
```
LightsparkException [Error]: Request CreateInvoice failed. [{"message":"Something went wrong.","locations":[{"line":8,"column":5}],"path":["create_invoice"]}]
    at Requester.makeRawRequest (/Users/joxgallardo/Documents/sparkchat/node_modules/@lightsparkdev/core/dist/index.cjs:1617:13)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at async Requester.executeQuery (/Users/joxgallardo/Documents/sparkchat/node_modules/@lightsparkdev/core/dist/index.cjs:1508:18)
    at async LightsparkClient.createInvoice (/Users/joxgallardo/Documents/sparkchat/node_modules/@lightsparkdev/wallet-sdk/dist/index.cjs:3021:12)
```

### **Request Details**
- **Amount:** 10,000,000 msats (0.0001 BTC)
- **Memo:** "Test invoice" (when provided)
- **Expiry:** 86400 seconds (24 hours)
- **Network:** Testnet
- **Invoice Type:** STANDARD (default)

### **Environment Variables**
```bash
LIGHTSPARK_ACCOUNT_ID=0197673c-b416-9af2-0000-e06272dd8c52
LIGHTSPARK_PRIVATE_KEY=-----BEGIN EC PRIVATE KEY-----...
LIGHTSPARK_NODE_ID=LightsparkNodeWithOSKLND:01976310-47be-f96b-0000-def73a50607e
USE_MOCK_CLIENT=false
```

---

## 🎯 **Expected Behavior**

Based on the SDK documentation and tests, `createInvoice` should:
1. Accept the amount in millisatoshis
2. Create a lightning invoice
3. Return an `Invoice` object with `id` and `data.encodedPaymentRequest`
4. Work with a properly deployed and authenticated wallet

---

## 📞 **Contact Information**

- **SDK Version:** `@lightsparkdev/wallet-sdk@0.12.15`
- **Account ID:** `0197673c-b416-9af2-0000-e06272dd8c52`
- **Wallet ID:** `Wallet:0197afab-c27b-4f0e-0000-95f1096bfbbf`
- **Node ID:** `LightsparkNodeWithOSKLND:01976310-47be-f96b-0000-def73a50607e`
- **Network:** Testnet
- **Error Code:** `RequestFailed`

---

**Note:** This error is blocking the core functionality of our application. All other SDK methods work correctly, suggesting this is a specific issue with the `createInvoice` method or its prerequisites. 