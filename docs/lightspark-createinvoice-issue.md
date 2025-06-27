# Lightspark createInvoice Issue Documentation

## 🚨 **Problema Principal**
El método `createInvoice` está fallando con el error "Something went wrong" en un wallet que está correctamente desplegado y autenticado.

## 📋 **Información Técnica Completa**

### **Versiones y Configuración**
- **SDK Version:** `@lightsparkdev/wallet-sdk@0.12.0`
- **Node.js Version:** 18+
- **Network:** Testnet (`test: true` en JWT)
- **Authentication:** JWT con clave privada EC256

### **Estado del Wallet**
- **Wallet ID:** `Wallet:0197afab-c27b-4f0e-0000-95f1096bfbbf`
- **Status:** `DEPLOYED`
- **Authentication:** ✅ Funcionando correctamente
- **Balances:** ✅ Accesibles (0 BTC, 0 USD - wallet nuevo)
- **Dashboard:** ✅ Funcionando correctamente

### **Error Específico**
```
LightsparkException [Error]: Request CreateInvoice failed. 
[{"message":"Something went wrong.","locations":[{"line":8,"column":5}],"path":["create_invoice"]}]
```

### **Código que Falla**
```typescript
// Opción 1: Con parámetros completos
const invoice = await client.createInvoice(
  amountMsats, // 10000000 msats (0.0001 BTC)
  `Deposit ${amountBTC} BTC for user ${userId}`,
  undefined, // type parameter
  86400 // 24 hours expiry
);

// Opción 2: Con parámetros mínimos
const invoice = await client.createInvoice(amountMsats);
```

## 🔍 **Investigación Realizada**

### **1. Verificación de Autenticación**
- ✅ JWT generado correctamente
- ✅ Login exitoso con Lightspark
- ✅ Token válido y no expirado
- ✅ Account ID correcto: `0197673c-b416-9af2-0000-e06272dd8c52`

### **2. Verificación del Wallet**
- ✅ Wallet desplegado correctamente
- ✅ Status: `DEPLOYED`
- ✅ Balances accesibles
- ✅ Dashboard funcionando
- ✅ Métodos disponibles: `getTransactions`, `getPaymentRequests`, `getWithdrawalRequests`

### **3. Métodos de Invoice Disponibles**
El wallet **NO tiene** métodos relacionados con invoices:
```javascript
// Métodos disponibles en el wallet:
[
  'getTransactions',
  'getPaymentRequests', 
  'getWithdrawalRequests',
  'toJson'
]

// Métodos de invoice NO disponibles:
// - createInvoice
// - createPaymentRequest
// - createLightningInvoice
```

### **4. Comparación con Documentación de Kotlin**
Según la documentación de Kotlin, el wallet necesita:
1. **Inicialización** con clave de firma
2. **Desbloqueo** con clave privada
3. **Permisos específicos** para crear invoices

**Problema:** El SDK de JavaScript no tiene los métodos `initializeWallet` y `unlockWallet`.

## 🛠️ **Soluciones Intentadas**

### **1. Verificación de Permisos**
- ✅ Wallet autenticado correctamente
- ✅ Wallet desplegado
- ❌ No se encontraron métodos de inicialización

### **2. Diferentes Parámetros de createInvoice**
- ❌ Con parámetros completos
- ❌ Con parámetros mínimos
- ❌ Con diferentes tipos de invoice

### **3. Verificación de Estado del Wallet**
- ✅ Wallet en estado `DEPLOYED`
- ✅ Balances accesibles
- ✅ Dashboard funcionando

### **4. Verificación de Red**
- ✅ Testnet configurado correctamente
- ✅ JWT con `test: true`
- ✅ Account en testnet

## 🤔 **Preguntas para el Asistente de Lightspark**

### **1. Diferencias entre SDKs**
- ¿Por qué el SDK de JavaScript no tiene los métodos `initializeWallet` y `unlockWallet`?
- ¿Hay una versión más reciente del SDK que incluya estos métodos?
- ¿La documentación de Kotlin aplica también al SDK de JavaScript?

### **2. Permisos y Configuración**
- ¿Qué permisos específicos necesita un wallet para crear invoices?
- ¿Hay algún paso de configuración adicional en el dashboard de Lightspark?
- ¿El wallet necesita estar "activated" o "verified" de alguna manera?

### **3. Métodos Alternativos**
- ¿Existe un método alternativo para crear invoices?
- ¿Se puede crear un invoice desde el dashboard web y luego usarlo?
- ¿Hay alguna API REST directa que se pueda usar?

### **4. Configuración de Red**
- ¿Hay alguna configuración específica para testnet que necesite activarse?
- ¿El wallet necesita estar "funded" antes de poder crear invoices?
- ¿Hay límites de rate o cuotas para testnet?

### **5. Debugging**
- ¿Cómo se puede obtener más información sobre el error "Something went wrong"?
- ¿Hay logs más detallados disponibles?
- ¿Se puede habilitar un modo debug en el SDK?

## 📊 **Información de Debug**

### **JWT Claims**
```json
{
  "aud": "https://api.lightspark.com",
  "sub": "0197673c-b416-9af2-0000-e06272dd8c52",
  "iat": 1751000118,
  "exp": 1751003718,
  "test": true
}
```

### **Wallet Info**
```json
{
  "id": "Wallet:0197afab-c27b-4f0e-0000-95f1096bfbbf",
  "status": "DEPLOYED",
  "hasBalances": true,
  "balances": {
    "ownedBalance": 0,
    "availableToSendBalance": 0,
    "availableToWithdrawBalance": 0
  }
}
```

### **Request Details**
- **Amount:** 10,000,000 msats (0.0001 BTC)
- **Memo:** "Deposit 0.0001 BTC for user test-user-123"
- **Expiry:** 86400 seconds (24 hours)
- **Network:** Testnet

## 🎯 **Estado Actual**

- ✅ **Autenticación:** Funcionando perfectamente
- ✅ **Wallet Deployment:** Completado exitosamente
- ✅ **Balances y Dashboard:** Accesibles
- ❌ **createInvoice:** Falla con "Something went wrong"
- 🔄 **Workaround:** Implementado con mock invoices

## 📞 **Información de Contacto**

- **SDK Version:** `@lightsparkdev/wallet-sdk@0.12.0`
- **Account ID:** `0197673c-b416-9af2-0000-e06272dd8c52`
- **Wallet ID:** `Wallet:0197afab-c27b-4f0e-0000-95f1096bfbbf`
- **Network:** Testnet
- **Error Code:** `RequestFailed`

---

**Nota:** Este documento contiene toda la información técnica necesaria para que el asistente de Lightspark pueda diagnosticar y resolver el problema del método `createInvoice`. 