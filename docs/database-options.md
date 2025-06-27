# Opciones de Base de Datos para SparkChat

## Estado Actual
- **Almacenamiento**: Maps en memoria (temporal)
- **Persistencia**: ❌ No hay persistencia
- **Escalabilidad**: ❌ No escalable

## Opciones Recomendadas

### 1. 🟢 **Supabase (Recomendado para desarrollo rápido)**

**Ventajas:**
- ✅ Base de datos PostgreSQL completa
- ✅ API REST automática
- ✅ Autenticación integrada
- ✅ Dashboard web para administración
- ✅ Plan gratuito generoso
- ✅ Fácil integración con Next.js

**Implementación:**
```bash
npm install @supabase/supabase-js
```

**Estructura de tablas:**
```sql
-- Usuarios de Telegram
CREATE TABLE telegram_users (
  telegram_id BIGINT PRIMARY KEY,
  spark_chat_user_id TEXT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);

-- Sesiones de Telegram
CREATE TABLE telegram_sessions (
  telegram_id BIGINT PRIMARY KEY REFERENCES telegram_users(telegram_id),
  spark_chat_user_id TEXT NOT NULL,
  is_authenticated BOOLEAN DEFAULT true,
  last_activity TIMESTAMP DEFAULT NOW(),
  preferences JSONB
);

-- Configuraciones de Lightspark
CREATE TABLE user_lightspark_configs (
  user_id TEXT PRIMARY KEY,
  lightspark_wallet_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. 🟡 **PlanetScale (MySQL serverless)**

**Ventajas:**
- ✅ MySQL serverless
- ✅ Escalado automático
- ✅ Branching de base de datos
- ✅ Plan gratuito generoso
- ✅ Excelente para producción

**Implementación:**
```bash
npm install @planetscale/database
```

### 3. 🟡 **Neon (PostgreSQL serverless)**

**Ventajas:**
- ✅ PostgreSQL serverless
- ✅ Branching automático
- ✅ Compatible con Supabase
- ✅ Plan gratuito generoso

### 4. 🔴 **Firebase Firestore (NoSQL)**

**Ventajas:**
- ✅ NoSQL flexible
- ✅ Tiempo real
- ✅ Fácil integración
- ✅ Plan gratuito generoso

**Desventajas:**
- ❌ Menos estructura que SQL
- ❌ Consultas más complejas

## Implementación Recomendada: Supabase

### 1. Configuración

```bash
# Instalar dependencias
npm install @supabase/supabase-js

# Variables de entorno
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Cliente de Base de Datos

```typescript
// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### 3. Migración de Funciones

```typescript
// src/services/database.ts (versión con Supabase)
import { supabase } from './supabase';

export async function getTelegramUser(telegramId: number): Promise<TelegramUser | null> {
  const { data, error } = await supabase
    .from('telegram_users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();
    
  if (error) {
    console.error('Error fetching Telegram user:', error);
    return null;
  }
  
  return data;
}

export async function createTelegramUser(telegramUser: Omit<TelegramUser, 'createdAt' | 'lastSeen'>): Promise<TelegramUser> {
  const { data, error } = await supabase
    .from('telegram_users')
    .insert({
      telegram_id: telegramUser.telegramId,
      spark_chat_user_id: telegramUser.sparkChatUserId,
      username: telegramUser.username,
      first_name: telegramUser.firstName,
      last_name: telegramUser.lastName,
      is_active: telegramUser.isActive
    })
    .select()
    .single();
    
  if (error) {
    throw new Error(`Error creating Telegram user: ${error.message}`);
  }
  
  return data;
}
```

## Migración Gradual

### Fase 1: Configuración
1. Crear cuenta en Supabase
2. Configurar tablas
3. Instalar dependencias

### Fase 2: Implementación
1. Crear cliente de Supabase
2. Migrar funciones una por una
3. Mantener compatibilidad con mock

### Fase 3: Testing
1. Probar todas las funciones
2. Verificar integridad de datos
3. Optimizar consultas

### Fase 4: Producción
1. Remover código mock
2. Configurar backups
3. Monitoreo de performance

## Estructura de Archivos Propuesta

```
src/services/
├── database.ts          # Funciones principales (mock actual)
├── supabase.ts          # Cliente de Supabase
├── database-real.ts     # Implementación real
└── database-mock.ts     # Implementación mock (para testing)
```

## Variables de Entorno

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Para desarrollo
USE_MOCK_DATABASE=true
```

## Comandos de Migración

```bash
# Crear tablas en Supabase
npx supabase db push

# Generar tipos TypeScript
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts

# Ejecutar migraciones
npx supabase migration up
```

## Consideraciones de Seguridad

1. **RLS (Row Level Security)**: Configurar políticas de acceso
2. **API Keys**: Usar claves de servicio solo en servidor
3. **Validación**: Validar datos antes de insertar
4. **Backups**: Configurar backups automáticos

## Costos Estimados

- **Supabase**: $0/mes (plan gratuito hasta 500MB)
- **PlanetScale**: $0/mes (plan gratuito hasta 1GB)
- **Neon**: $0/mes (plan gratuito hasta 3GB)
- **Firebase**: $0/mes (plan gratuito hasta 1GB)

## Recomendación Final

**Para desarrollo y MVP**: Supabase
**Para producción escalable**: PlanetScale o Neon
**Para tiempo real**: Firebase Firestore 