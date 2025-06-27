# Configuración de Supabase para SparkChat

## 🚀 Configuración Rápida

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Haz clic en "Start your project"
3. Inicia sesión con GitHub o crea una cuenta
4. Haz clic en "New Project"
5. Completa la información:
   - **Name**: `sparkchat-bot`
   - **Database Password**: Genera una contraseña segura
   - **Region**: Elige la más cercana a ti
6. Haz clic en "Create new project"

### 2. Obtener Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia:
   - **Project URL** (ej: `https://your-project.supabase.co`)
   - **anon public** key
   - **service_role** key (para operaciones administrativas)

### 3. Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local`:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database Configuration
USE_MOCK_DATABASE=false
```

### 4. Crear Tablas en Supabase

1. Ve a **SQL Editor** en tu proyecto de Supabase
2. Copia y pega el contenido de `supabase-schema.sql`
3. Haz clic en "Run" para ejecutar el script

### 5. Verificar Configuración

Ejecuta el script de prueba:

```bash
npx tsx src/bot/test-supabase-integration.ts
```

## 📊 Estructura de la Base de Datos

### Tablas Creadas

1. **`telegram_users`** - Usuarios de Telegram
2. **`telegram_sessions`** - Sesiones de Telegram
3. **`user_lightspark_configs`** - Configuraciones de Lightspark
4. **`users`** - Usuarios generales de SparkChat

### Índices y Optimizaciones

- Índices en campos de búsqueda frecuente
- Triggers para actualizar timestamps automáticamente
- Row Level Security (RLS) habilitado
- Vista `user_stats` para consultas complejas

## 🔧 Configuración Avanzada

### Row Level Security (RLS)

Las políticas RLS están configuradas para permitir todas las operaciones. Para producción, considera políticas más restrictivas:

```sql
-- Ejemplo de política más restrictiva
CREATE POLICY "Users can only access their own data" ON telegram_users
  FOR ALL USING (telegram_id = auth.uid());
```

### Backups

Supabase realiza backups automáticos:
- **Plan gratuito**: Backups diarios
- **Plan Pro**: Backups cada hora

### Monitoreo

Ve a **Dashboard** → **Logs** para monitorear:
- Consultas lentas
- Errores de base de datos
- Uso de recursos

## 🧪 Testing

### Scripts de Prueba Disponibles

1. **Prueba básica de gestión de usuarios**:
   ```bash
   npx tsx src/bot/test-user-management.ts
   ```

2. **Prueba de integración con Supabase**:
   ```bash
   npx tsx src/bot/test-supabase-integration.ts
   ```

### Verificar en Supabase Dashboard

1. Ve a **Table Editor**
2. Verifica que las tablas se crearon correctamente
3. Revisa los datos insertados por los tests

## 🔄 Migración de Datos

### Desde Mock Database

Si tienes datos en el mock database que quieres migrar:

1. Exporta los datos del mock
2. Crea un script de migración
3. Ejecuta la migración en Supabase

### Ejemplo de Script de Migración

```typescript
// migrate-mock-to-supabase.ts
import { supabase } from '@/services/supabase';

async function migrateMockData() {
  // Exportar datos del mock
  const mockUsers = Array.from(MOCK_TELEGRAM_USER_DB.values());
  
  // Insertar en Supabase
  for (const user of mockUsers) {
    await supabase.from('telegram_users').insert({
      telegram_id: user.telegramId,
      spark_chat_user_id: user.sparkChatUserId,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      is_active: user.isActive,
      created_at: user.createdAt.toISOString(),
      last_seen: user.lastSeen.toISOString()
    });
  }
}
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión**:
   - Verifica que las credenciales sean correctas
   - Asegúrate de que el proyecto esté activo

2. **Error de permisos**:
   - Verifica que las políticas RLS estén configuradas
   - Usa la clave `service_role` para operaciones administrativas

3. **Error de esquema**:
   - Ejecuta el script SQL completo
   - Verifica que las tablas se crearon correctamente

### Logs de Debug

Habilita logs detallados agregando a `.env.local`:

```bash
DEBUG=supabase:*
```

## 📈 Monitoreo y Métricas

### Métricas Importantes

1. **Número de usuarios activos**
2. **Tiempo de respuesta de consultas**
3. **Uso de almacenamiento**
4. **Errores de base de datos**

### Alertas Recomendadas

Configura alertas para:
- Errores de conexión
- Consultas lentas (>1s)
- Uso de almacenamiento >80%

## 🔒 Seguridad

### Mejores Prácticas

1. **Nunca expongas la clave `service_role`** en el frontend
2. **Usa RLS** para controlar acceso a datos
3. **Valida datos** antes de insertar
4. **Monitorea logs** regularmente

### Configuración de Seguridad

```sql
-- Ejemplo: Política más restrictiva
CREATE POLICY "Users can only access their own data" ON telegram_users
  FOR SELECT USING (telegram_id = auth.uid());

CREATE POLICY "Users can only update their own data" ON telegram_users
  FOR UPDATE USING (telegram_id = auth.uid());
```

## 💰 Costos

### Plan Gratuito
- **Base de datos**: 500MB
- **Bandwidth**: 2GB/mes
- **Backups**: Diarios
- **Soporte**: Community

### Plan Pro ($25/mes)
- **Base de datos**: 8GB
- **Bandwidth**: 250GB/mes
- **Backups**: Cada hora
- **Soporte**: Priority

## 📞 Soporte

- **Documentación**: [docs.supabase.com](https://docs.supabase.com)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub**: [github.com/supabase/supabase](https://github.com/supabase/supabase) 