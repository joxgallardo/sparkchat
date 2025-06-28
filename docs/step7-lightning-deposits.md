# Step 7: Recepción de Pagos vía Lightning (Invoices)

## Resumen de Implementación

El **Paso 7** del plan de migración SparkChat implementa la funcionalidad completa para que los usuarios generen facturas Lightning (BOLT11 invoices) y reciban pagos a través de la Lightning Network en sus wallets Spark.

## Funcionalidades Implementadas

### 1. Generación de Facturas Lightning

**Comando:** `/deposit <cantidad>`

**Características:**
- Soporte para cantidades en BTC y satoshis
- Validación de cantidades mínimas (1 satoshi)
- Generación de facturas BOLT11 válidas
- Memo descriptivo automático
- Expiración de 24 horas por seguridad

**Ejemplos de uso:**
```
/deposit 0.001          # 0.001 BTC
/deposit 100000 sats    # 100,000 satoshis
/deposit 0.0001 BTC     # 0.0001 BTC
```

### 2. Sincronización Automática de Balance

**Comando:** `/balance`

**Mejoras implementadas:**
- Sincronización automática con Lightning Network
- Reclamo automático de pagos Lightning pendientes
- Actualización en tiempo real de saldos
- Información de tokens LRC-20 (si disponibles)

### 3. Mensajes de Usuario Mejorados

**Características:**
- Instrucciones claras para pagos Lightning
- Información sobre expiración de facturas
- Consejos de red (testnet/mainnet)
- Formato de factura optimizado para copiado

## Implementación Técnica

### Service Layer (`src/services/spark.ts`)

```typescript
// Create Lightning invoice
export async function createSparkLightningInvoiceByTelegramId(
  telegramId: number, 
  amountSats: number, 
  memo?: string
): Promise<string>

// Get balance with Lightning sync
export async function getSparkBalanceByTelegramId(
  telegramId: number, 
  forceRefetch: boolean = false
): Promise<{ balance: number; tokenBalances: Map<string, number> }>
```

### Bot Handlers (`src/bot/handlers/wallet.ts`)

```typescript
// Handle Lightning deposit
export async function handleBTCDeposit(
  bot: TelegramBot, 
  chatId: number, 
  amount: number, 
  telegramId?: number
): Promise<WalletOperationResult>

// Handle balance check with Lightning sync
export async function handleBalanceCheck(
  bot: TelegramBot, 
  chatId: number, 
  telegramId?: number
): Promise<WalletOperationResult>
```

### Command Integration (`src/bot/handlers/commands.ts`)

```typescript
// Enhanced deposit command with better parsing
bot.onText(/\/deposit (.+)/, withSession(async (sessionContext: SessionContext, match) => {
  // Parse amount - support both BTC and sats
  // Validate amount
  // Create Lightning invoice
}))

// Balance command with Lightning sync
bot.onText(/\/balance/, withSession(async (sessionContext: SessionContext) => {
  // Get balance with forceRefetch
  // Display synchronized balance
}))
```

## Flujo de Usuario

### 1. Generar Factura Lightning

```
Usuario: /deposit 0.001

Bot: ✅ Factura Lightning generada

💰 Cantidad: 0.001 BTC (100000 sats)
💳 Saldo actual: 0.00000000 BTC
⏰ Expira en: 24 horas

🔗 Factura Lightning:
lnbc1qyq...

💡 Instrucciones:
• Copia la factura y págala desde otra wallet Lightning
• El pago se acreditará automáticamente en tu wallet
• Usa /balance para verificar tu saldo después del pago
• Las facturas expiran en 24 horas por seguridad

🌐 Red: TESTNET
```

### 2. Verificar Saldo Sincronizado

```
Usuario: /balance

Bot: 💰 Saldos actualizados

🪙 Bitcoin (BTC): 0.00100000 BTC
💡 Sincronizado con Lightning Network

🌐 Red: TESTNET
⏰ Actualizado: 15/12/2024, 14:30:25

💡 Nota: Los pagos Lightning se sincronizan automáticamente al consultar el saldo
```

## Validaciones Implementadas

### 1. Cantidades Mínimas
- Mínimo: 1 satoshi (0.00000001 BTC)
- Validación de números negativos
- Validación de cero

### 2. Formato de Factura
- Validación BOLT11 básica
- Verificación de prefijo "ln"
- Longitud mínima de factura

### 3. Red de Spark
- Detección automática de red (TESTNET/MAINNET)
- Información de red en mensajes
- Consejos específicos por red

## Testing

### Script de Pruebas (`scripts/test-step7-lightning-deposits.js`)

```bash
# Ejecutar pruebas del Paso 7
node scripts/test-step7-lightning-deposits.js
```

**Pruebas incluidas:**
1. ✅ Creación de facturas Lightning
2. ✅ Sincronización de balance
3. ✅ Validación de cantidades inválidas
4. ✅ Validación de formato de factura
5. ✅ Conectividad con Spark

### Casos de Prueba

```javascript
// Test 1: Lightning invoice creation
const invoice = await createSparkLightningInvoiceByTelegramId(
  TEST_TELEGRAM_ID, 
  10000, // 0.0001 BTC
  'Test Lightning deposit'
);

// Test 2: Balance synchronization
const { balance, tokenBalances } = await getSparkBalanceByTelegramId(
  TEST_TELEGRAM_ID, 
  true // forceRefetch
);

// Test 3: Invalid amounts
await createSparkLightningInvoiceByTelegramId(TEST_TELEGRAM_ID, 0, 'Invalid');
await createSparkLightningInvoiceByTelegramId(TEST_TELEGRAM_ID, -1000, 'Invalid');
```

## Mejoras de UX

### 1. Parsing Inteligente de Cantidades
- Soporte para BTC y satoshis
- Detección automática de unidad
- Mensajes de error claros

### 2. Mensajes Informativos
- Instrucciones paso a paso
- Consejos de red
- Información de expiración
- Formato optimizado para copiado

### 3. Sincronización Automática
- Balance actualizado automáticamente
- No requiere comandos adicionales
- Feedback inmediato al usuario

## Integración con Otros Pasos

### Dependencias
- **Step 1**: SDK de Spark instalado
- **Step 3**: Gestión de usuarios con cuentas Spark
- **Step 4**: Operaciones básicas de Spark

### Preparación para Próximos Pasos
- **Step 8**: Pagos salientes Lightning
- **Step 9**: Integración UMA
- **Step 10**: Tokens LRC-20

## Configuración Requerida

### Variables de Entorno
```bash
SPARK_NETWORK=TESTNET  # o MAINNET
SPARK_MASTER_MNEMONIC=your_master_mnemonic_here
```

### Dependencias
```json
{
  "@buildonspark/spark-sdk": "latest",
  "bip39": "^3.1.0"
}
```

## Monitoreo y Logs

### Logs de Spark Service
```
SPARK SERVICE: Creating Lightning invoice for Telegram ID: 123456789, amount: 10000 sats
SPARK SERVICE: Lightning invoice created successfully
SPARK SERVICE: Getting balance for Telegram ID: 123456789, forceRefetch: true
SPARK SERVICE: Balance retrieved - 100000 sats (forceRefetch: true)
```

### Métricas de Uso
- Facturas Lightning generadas
- Pagos Lightning recibidos
- Tiempo de confirmación promedio
- Tasa de éxito de pagos

## Consideraciones de Seguridad

### 1. Expiración de Facturas
- Facturas expiran en 24 horas
- Previene reutilización de facturas
- Reduce riesgo de ataques

### 2. Validación de Cantidades
- Cantidades mínimas validadas
- Prevención de cantidades negativas
- Límites de seguridad

### 3. Red de Spark
- Detección automática de red
- Prevención de pagos cross-network
- Validación de conectividad

## Próximos Pasos

### Inmediatos
1. **Step 8**: Implementar pagos salientes Lightning
2. **Testing**: Pruebas con pagos Lightning reales
3. **Monitoreo**: Implementar métricas de uso

### Futuros
1. **Step 9**: Integración UMA para pagos cross-currency
2. **Step 10**: Soporte de tokens LRC-20
3. **Step 11**: Testing integral completo

## Conclusión

El **Paso 7** ha implementado exitosamente la funcionalidad completa de recepción de pagos Lightning en SparkChat. Los usuarios ahora pueden:

- ✅ Generar facturas Lightning para recibir BTC
- ✅ Recibir pagos automáticamente en sus wallets Spark
- ✅ Verificar saldos sincronizados con Lightning Network
- ✅ Usar comandos intuitivos con parsing inteligente

La implementación está lista para el **Paso 8** (pagos salientes Lightning) y proporciona una base sólida para la integración UMA en los pasos siguientes. 