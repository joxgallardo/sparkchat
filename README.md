# SparkChat

Bot de Telegram para gestionar Bitcoin y USD de forma inteligente usando Spark SDK (self-custodial).

## 🚀 Características

- 🤖 **Gestión de usuarios automática**: Registro automático de usuarios de Telegram
- 💰 **Operaciones de wallet**: Depósitos, retiros y conversiones BTC/USD
- 📊 **Seguimiento de transacciones**: Historial completo de operaciones
- 🤖 **IA de ahorro**: Consejos personalizados basados en patrones de gasto
- 💬 **Lenguaje natural**: Comandos en español natural
- 🔒 **Sesiones seguras**: Manejo automático de autenticación
- 🗄️ **Base de datos persistente**: Integración con Supabase
- ⚡ **Lightning Network**: Integración real con Spark SDK (self-custodial)

## 📋 Estado del Proyecto

### ✅ Completado
- [x] **Paso 1**: Crear Telegram Bot base
- [x] **Paso 2**: Migrar AI command processing
- [x] **Paso 3**: User management para Telegram
- [x] **Paso 4**: Migración completa a Spark SDK self-custodial
- [x] **Base de datos híbrida**: Supabase + Mock fallback

### 🔄 En Progreso
- [ ] **Paso 5**: Testing real Bitcoin operations

### 📅 Próximos Pasos
- [ ] **Paso 6**: UMA SDK setup
- [ ] **Paso 7**: USD spending implementation
- [ ] **Paso 8**: Security & error handling
- [ ] **Paso 9**: Deployment

## ⚡ Spark SDK Integration

### Características Implementadas

- ✅ **Gestión de wallets self-custodial**: Spark SDK
- ✅ **Gestión de balances**: Consulta de saldos BTC y tokens
- ✅ **Historial de transacciones**: Transacciones Lightning y on-chain
- ✅ **Creación de invoices**: Depósitos via Lightning Network
- ✅ **Modo mock**: Desarrollo sin credenciales reales

### Configuración de Spark SDK

1. **Configurar variables**: Ver `env.example`
2. **Probar integración**: `npm run dev` o scripts de prueba en `scripts/`

## 🗄️ Base de Datos

### Implementación Híbrida

El proyecto usa una implementación híbrida que permite:

- **Desarrollo**: Base de datos mock en memoria
- **Producción**: Supabase PostgreSQL real
- **Fallback automático**: Si Supabase no está configurado, usa mock

### Configuración de Supabase

1. **Crear proyecto**: [https://supabase.com](https://supabase.com)
2. **Ejecutar schema**: `supabase-schema.sql`
3. **Configurar variables**: Ver `env.example`
4. **Probar integración**: `npx tsx src/bot/test-supabase-integration.ts`

📖 **Guía completa**: [docs/supabase-setup.md](docs/supabase-setup.md)

## 🛠️ Configuración

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Copia `env.example` a `.env.local`:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Spark Configuration (Self-custodial wallet)
SPARK_NETWORK=TESTNET
SPARK_MASTER_MNEMONIC=your_master_mnemonic_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Environment
NODE_ENV=development
USE_MOCK_DATABASE=false
```

### 3. Crear Bot de Telegram

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Usa el comando `/newbot`
3. Sigue las instrucciones para crear tu bot
4. Copia el token y agrégalo a tu archivo `.env.local`

### 4. Configurar Spark SDK (Opcional)

Para usar operaciones reales de Bitcoin:

1. Genera o configura tu mnemónico maestro (`SPARK_MASTER_MNEMONIC`)
2. Establece la red (`SPARK_NETWORK=TESTNET` o `MAINNET`)
3. Si no configuras un mnemónico, se generará uno automáticamente

### 5. Configurar Supabase (Opcional)

Para usar base de datos real:

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script `supabase-schema.sql` en el SQL Editor
3. Copia las credenciales a `.env.local`
4. Establece `USE_MOCK_DATABASE=false`

## 🚀 Desarrollo

### Ejecutar en Desarrollo

```bash
# Desarrollo web
npm run dev

# Bot de Telegram
npm run bot:dev
```

### Scripts de Prueba

```bash
# Probar gestión de usuarios (mock)
npx tsx src/bot/test-user-management.ts

# Probar integración con Supabase
npx tsx src/bot/test-supabase-integration.ts
```

## 📱 Uso del Bot

### Comandos Básicos

- `/start` - Iniciar el bot y registro automático
- `/help` - Ver todos los comandos disponibles
- `/profile` - Ver tu perfil completo
- `/balance` - Ver saldos de BTC y tokens
- `/transactions` - Ver historial de transacciones

### Operaciones de Wallet

- `/deposit <cantidad>` - Depositar BTC
- `/withdraw <cantidad>` - Retirar BTC
- `/convert_btc <cantidad>` - Convertir BTC a tokens
- `/convert_token <cantidad>` - Convertir tokens a BTC

### Lenguaje Natural

También puedes escribir comandos en español natural:

- "Deposita 0.001 BTC"
- "Retira 50 USD"
- "Convierte 0.01 BTC a tokens"
- "¿Cuál es mi saldo?"
- "Muéstrame mis transacciones"

## 🏗️ Arquitectura

### Estructura de Archivos

```
src/
├── bot/                    # Bot de Telegram
│   ├── handlers/          # Handlers de comandos y mensajes
│   ├── middleware/        # Middleware de sesiones
│   ├── services/          # Servicios del bot
│   └── utils/             # Utilidades de Telegram
├── services/              # Servicios principales
│   ├── spark.ts           # Integración con Spark SDK
│   ├── database-hybrid.ts # Base de datos híbrida
│   ├── supabase.ts        # Cliente de Supabase
│   ├── userManager.ts     # Gestión de usuarios
├── ai/                    # Flows de IA
│   └── flows/            # Procesamiento de comandos
└── app/                   # Aplicación web
```

### Sistema de Gestión de Usuarios

```
Telegram User ID → SparkChat User ID → Spark SDK Wallet
```

- **Registro automático**: Los usuarios se registran al usar cualquier comando
- **IDs únicos**: Cada usuario tiene un SparkChat User ID único
- **Sesiones persistentes**: Manejo automático de autenticación
- **Aislamiento de datos**: Los datos están completamente aislados por usuario

## 🔒 Seguridad

- ✅ **Autenticación automática**: Sesiones manejadas por el sistema
- ✅ **Aislamiento de datos**: Cada usuario solo ve sus propios datos
- ✅ **Validación de entrada**: Todos los comandos se validan
- ✅ **Logs de auditoría**: Registro de todas las operaciones

## 📊 Monitoreo

### Métricas Importantes

- Número de usuarios activos
- Tiempo de respuesta de consultas
- Uso de almacenamiento
- Errores de base de datos

### Logs

El sistema registra:
- Creación y actualización de usuarios
- Operaciones de wallet
- Errores y excepciones
- Actividad de sesiones

## 🚨 Troubleshooting

### Problemas Comunes

1. **Bot no responde**:
   - Verifica que `TELEGRAM_BOT_TOKEN` esté configurado
   - Asegúrate de que el bot esté ejecutándose

2. **Error de base de datos**:
   - Verifica las credenciales de Supabase
   - Ejecuta `USE_MOCK_DATABASE=true` para usar mock

3. **Comandos no funcionan**:
   - Verifica que el middleware de sesión esté funcionando
   - Revisa los logs del bot

## 📈 Roadmap

### Fase 1: Telegram Bot Foundation ✅
- [x] Bot base con node-telegram-bot-api
- [x] Integración con AI flows existentes
- [x] Sistema de gestión de usuarios

### Fase 2: Real Spark SDK Integration 🔄
- [ ] Migración completa a Spark SDK self-custodial
- [ ] Testing con Bitcoin real en testnet

### Fase 3: UMA Integration para USD 📅
- [ ] UMA SDK setup
- [ ] USD spending implementation
- [ ] KYC flow para compliance

### Fase 4: Production & Polish 📅
- [ ] Security & error handling
- [ ] Deployment a producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

- **Documentación**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/sparkchat/issues)
- **Discord**: [SparkChat Community](https://discord.gg/sparkchat)
