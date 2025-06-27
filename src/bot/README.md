# SparkChat Telegram Bot

Bot de Telegram para gestionar Bitcoin y USD de forma inteligente usando Lightspark.

## Características

- 🤖 **Gestión de usuarios automática**: Registro automático de usuarios de Telegram
- 💰 **Operaciones de wallet**: Depósitos, retiros y conversiones BTC/USD
- 📊 **Seguimiento de transacciones**: Historial completo de operaciones
- 🤖 **IA de ahorro**: Consejos personalizados basados en patrones de gasto
- 💬 **Lenguaje natural**: Comandos en español natural
- 🔒 **Sesiones seguras**: Manejo automático de autenticación

## Sistema de Gestión de Usuarios

### Arquitectura

El bot utiliza un sistema de gestión de usuarios que mapea automáticamente los IDs de Telegram a IDs únicos de SparkChat:

```
Telegram User ID → SparkChat User ID → Lightspark Wallet
```

### Componentes

1. **UserManager** (`src/services/userManager.ts`)
   - Mapeo de Telegram ID → SparkChat User ID
   - Gestión de contexto de usuario
   - Validación de autenticación

2. **Session Middleware** (`src/bot/middleware/session.ts`)
   - Manejo automático de sesiones
   - Extracción de datos de usuario de Telegram
   - Wrapper para handlers con contexto de sesión

3. **Database Service** (`src/services/database.ts`)
   - Almacenamiento de usuarios de Telegram
   - Gestión de sesiones
   - Configuraciones de Lightspark por usuario

### Flujo de Registro

1. **Primera interacción**: Usuario envía `/start` o cualquier comando
2. **Extracción de datos**: Se extraen username, firstName, lastName de Telegram
3. **Creación automática**: Se crea un usuario único con ID `telegram-{id}-{timestamp}`
4. **Sesión activa**: Se crea una sesión autenticada automáticamente
5. **Configuración**: Se asigna configuración de Lightspark al usuario

### Comandos de Usuario

- `/start` - Bienvenida y registro automático
- `/register` - Ver información de registro
- `/profile` - Ver perfil completo del usuario
- `/status` - Estado del bot y sesión actual

## Configuración

### Variables de Entorno

```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
```

### Crear Bot en Telegram

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Usa el comando `/newbot`
3. Sigue las instrucciones para crear tu bot
4. Copia el token y agrégalo a tu archivo `.env`

## Estructura de Archivos

```
src/bot/
├── index.ts                 # Bot principal
├── handlers/
│   ├── commands.ts         # Handlers de comandos con sesiones
│   ├── messages.ts         # Handlers de mensajes con sesiones
│   └── wallet.ts           # Operaciones de wallet
├── middleware/
│   └── session.ts          # Middleware de sesiones
├── services/
│   ├── commandProcessor.ts # Procesamiento de comandos
│   └── simpleCommandProcessor.ts
└── utils/
    └── telegram.ts         # Utilidades de formateo
```

## Uso

### Comandos Básicos

```bash
# Ver saldos
/balance

# Ver transacciones
/transactions

# Depositar BTC
/deposit 0.001

# Retirar USD
/withdraw 50

# Convertir BTC a USD
/convert_btc 0.01

# Convertir USD a BTC
/convert_usd 100
```

### Lenguaje Natural

También puedes escribir comandos en español natural:

- "Deposita 0.001 BTC"
- "Retira 50 USD"
- "Convierte 0.01 BTC a USD"
- "¿Cuál es mi saldo?"
- "Muéstrame mis transacciones"

## Desarrollo

### Ejecutar en Desarrollo

```bash
npm run dev
```

### Estructura de Datos

```typescript
interface TelegramUser {
  telegramId: number;
  sparkChatUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  lastSeen: Date;
}

interface TelegramSession {
  telegramId: number;
  sparkChatUserId: string;
  isAuthenticated: boolean;
  lastActivity: Date;
  preferences?: {
    language?: string;
    notifications?: boolean;
  };
}
```

### Middleware de Sesión

Todos los handlers usan el middleware de sesión que:

1. Extrae el Telegram ID del mensaje
2. Obtiene o crea el contexto de usuario
3. Maneja la sesión automáticamente
4. Proporciona el SparkChat User ID a los handlers

```typescript
// Ejemplo de uso
bot.onText(/\/balance/, withSession(async (sessionContext: SessionContext) => {
  const sparkChatUserId = getSparkChatUserId(sessionContext);
  // Usar sparkChatUserId en lugar de MOCK_USER_ID
}));
```

## Seguridad

- ✅ Cada usuario tiene su propio ID único
- ✅ Las sesiones se manejan automáticamente
- ✅ Los datos están aislados por usuario
- ✅ No se comparten IDs entre usuarios

## Próximos Pasos

- [ ] Integración real con Lightspark
- [ ] UMA SDK para USD
- [ ] KYC y compliance
- [ ] Deployment a producción 