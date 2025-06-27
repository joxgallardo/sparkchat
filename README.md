# SparkChat

Bot de Telegram para gestionar Bitcoin y USD de forma inteligente usando Lightspark.

## 🚀 Características

- 🤖 **Gestión de usuarios automática**: Registro automático de usuarios de Telegram
- 💰 **Operaciones de wallet**: Depósitos, retiros y conversiones BTC/USD
- 📊 **Seguimiento de transacciones**: Historial completo de operaciones
- 🤖 **IA de ahorro**: Consejos personalizados basados en patrones de gasto
- 💬 **Lenguaje natural**: Comandos en español natural
- 🔒 **Sesiones seguras**: Manejo automático de autenticación
- 🗄️ **Base de datos persistente**: Integración con Supabase
- ⚡ **Lightning Network**: Integración real con Lightspark

## 📋 Estado del Proyecto

### ✅ Completado
- [x] **Paso 1**: Crear Telegram Bot base
- [x] **Paso 2**: Migrar AI command processing
- [x] **Paso 3**: User management para Telegram
- [x] **Paso 4**: Habilitar Lightspark real
- [x] **Base de datos híbrida**: Supabase + Mock fallback
- [x] **Autenticación JWT**: Integración completa con Lightspark SDK

### 🔄 En Progreso
- [ ] **Paso 5**: Testing real Bitcoin operations

### 📅 Próximos Pasos
- [ ] **Paso 6**: UMA SDK setup
- [ ] **Paso 7**: USD spending implementation
- [ ] **Paso 8**: Security & error handling
- [ ] **Paso 9**: Deployment

## ⚡ Lightspark Integration

### Características Implementadas

- ✅ **Autenticación JWT**: Integración segura con Lightspark
- ✅ **Gestión de balances**: Consulta de saldos BTC y USD
- ✅ **Historial de transacciones**: Transacciones Lightning Network
- ✅ **Creación de invoices**: Depósitos via Lightning Network
- ✅ **Modo mock**: Desarrollo sin credenciales reales

### Configuración de Lightspark

1. **Crear cuenta**: [https://app.lightspark.com](https://app.lightspark.com)
2. **Obtener credenciales**: Account ID y JWT Token
3. **Configurar variables**: Ver `env.example`
4. **Probar integración**: `npx tsx src/services/test-lightspark-integration.ts`

📖 **Guía completa**: [docs/lightspark-setup.md](docs/lightspark-setup.md)

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

# Lightspark Configuration (JWT Authentication)
LIGHTSPARK_ACCOUNT_ID=your_lightspark_account_id
LIGHTSPARK_JWT_TOKEN=your_lightspark_jwt_token
LIGHTSPARK_NODE_ID=your_node_id_optional

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Environment
NODE_ENV=development
USE_MOCK_CLIENT=true
USE_MOCK_DATABASE=false
```

### 3. Crear Bot de Telegram

1. Habla con [@BotFather](https://t.me/botfather) en Telegram
2. Usa el comando `/newbot`
3. Sigue las instrucciones para crear tu bot
4. Copia el token y agrégalo a tu archivo `.env.local`

### 4. Configurar Lightspark (Opcional)

Para usar operaciones reales de Bitcoin:

1. Crea una cuenta en [Lightspark](https://app.lightspark.com)
2. Obtén tu Account ID y JWT Token
3. Configura las variables en `.env.local`
4. Establece `USE_MOCK_CLIENT=false`

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

# Probar integración con Lightspark
npx tsx src/services/test-lightspark-integration.ts
```

## 📱 Uso del Bot

### Comandos Básicos

- `/start` - Iniciar el bot y registro automático
- `/help` - Ver todos los comandos disponibles
- `/profile` - Ver tu perfil completo
- `/balance` - Ver saldos de BTC y USD
- `/transactions` - Ver historial de transacciones

### Operaciones de Wallet

- `/deposit <cantidad>` - Depositar BTC
- `/withdraw <cantidad>` - Retirar USD
- `/convert_btc <cantidad>` - Convertir BTC a USD
- `/convert_usd <cantidad>` - Convertir USD a BTC

### Lenguaje Natural

También puedes escribir comandos en español natural:

- "Deposita 0.001 BTC"
- "Retira 50 USD"
- "Convierte 0.01 BTC a USD"
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
│   ├── database-hybrid.ts # Base de datos híbrida
│   ├── supabase.ts        # Cliente de Supabase
│   ├── userManager.ts     # Gestión de usuarios
│   └── lightspark.ts      # Integración con Lightspark
├── ai/                    # Flows de IA
│   └── flows/            # Procesamiento de comandos
└── app/                   # Aplicación web
    └── actions.ts         # Acciones del servidor
```

### Sistema de Gestión de Usuarios

```
Telegram User ID → SparkChat User ID → Lightspark Wallet
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

### Fase 2: Real Lightspark Integration 🔄
- [ ] Habilitar Lightspark real
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
