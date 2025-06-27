# Guía Visual: Configuración de Supabase

## 📸 Capturas de Pantalla de Referencia

### 1. Dashboard Principal
```
┌─────────────────────────────────────────────────────────────┐
│ Supabase Dashboard                                          │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────┐ │
│ │ Projects    │ │                                         │ │
│ │             │ │  ┌─────────────────────────────────────┐ │ │
│ │ sparkchat-  │ │  │ New Project                         │ │ │
│ │ bot         │ │  │                                     │ │ │
│ │             │ │  │ Name: sparkchat-bot                 │ │ │
│ │             │ │  │ Database Password: [••••••••]       │ │ │
│ │             │ │  │ Region: US East (N. Virginia)       │ │ │
│ │             │ │  │                                     │ │ │
│ │             │ │  │ [Create new project]                │ │ │
│ │             │ │  └─────────────────────────────────────┘ │ │
│ └─────────────┘ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2. Settings → API
```
┌─────────────────────────────────────────────────────────────┐
│ Settings > API                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Project URL                                                 │
│ https://abcdefghijklmnop.supabase.co                       │
│                                                             │
│ Project API keys                                            │
│                                                             │
│ anon public                                                 │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz │
│ ZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6ImFu  │
│ b24iLCJpYXQiOjE2MzQ1NjI0MDAsImV4cCI6MTk1MDEzODQwMH0.Ej8Ej │
│ 8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8                         │
│                                                             │
│ service_role                                                │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz │
│ ZSIsInJlZiI6InhtdG5wdmJqY2JqY2JqY2JqY2JqIiwicm9sZSI6InNl  │
│ cnZpY2Vfcm9sZSIsImlhdCI6MTYzNDU2MjQwMCwiZXhwIjoxOTUwMTM4 │
│ NDAwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. SQL Editor
```
┌─────────────────────────────────────────────────────────────┐
│ SQL Editor                                                  │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ New query                                               │ │
│ │                                                         │ │
│ │ -- SparkChat Database Schema for Supabase              │ │
│ │ -- Run this in your Supabase SQL editor                │ │
│ │                                                         │ │
│ │ -- Enable Row Level Security                           │ │
│ │ ALTER DATABASE postgres SET "app.jwt_secret" TO 'your- │ │
│ │ jwt-secret';                                            │ │
│ │                                                         │ │
│ │ -- Create telegram_users table                         │ │
│ │ CREATE TABLE IF NOT EXISTS telegram_users (            │ │
│ │   telegram_id BIGINT PRIMARY KEY,                      │ │
│ │   spark_chat_user_id TEXT UNIQUE NOT NULL,             │ │
│ │   username TEXT,                                        │ │
│ │   first_name TEXT,                                      │ │
│ │   last_name TEXT,                                       │ │
│ │   is_active BOOLEAN DEFAULT true,                      │ │
│ │   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),   │ │
│ │   last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()     │ │
│ │ );                                                      │ │
│ │                                                         │ │
│ │ [Run] [Save] [Format]                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4. Table Editor (Después de crear las tablas)
```
┌─────────────────────────────────────────────────────────────┐
│ Table Editor                                                │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tables                                                   │ │
│ │                                                         │ │
│ │ ✅ telegram_users                                       │ │
│ │ ✅ telegram_sessions                                    │ │
│ │ ✅ user_lightspark_configs                              │ │
│ │ ✅ users                                                │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ telegram_users                                       │ │ │
│ │ │ ┌─────────┬─────────────┬─────────┬─────────────┐   │ │ │
│ │ │ │telegram_│spark_chat_  │username │first_name   │   │ │ │
│ │ │ │id      │user_id      │         │             │   │ │ │
│ │ │ ├─────────┼─────────────┼─────────┼─────────────┤   │ │ │
│ │ │ │999888777│telegram-    │supabase │Supabase     │   │ │ │
│ │ │ │         │999888777-   │user     │             │   │ │ │
│ │ │ │         │1750992345   │         │             │   │ │ │
│ │ │ └─────────┴─────────────┴─────────┴─────────────┘   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Dónde Encontrar Cada Elemento

### 1. Project URL
- **Ubicación**: Settings → API
- **Formato**: `https://[project-id].supabase.co`
- **Ejemplo**: `https://abcdefghijklmnop.supabase.co`

### 2. anon public key
- **Ubicación**: Settings → API → Project API keys
- **Formato**: JWT token largo que empieza con `eyJ`
- **Uso**: Para operaciones del cliente (frontend)

### 3. service_role key
- **Ubicación**: Settings → API → Project API keys
- **Formato**: JWT token largo que empieza con `eyJ`
- **Uso**: Para operaciones administrativas (backend)

## ⚠️ Notas Importantes

### Seguridad
- **Nunca compartas** las claves API
- **anon public** es segura para el frontend
- **service_role** solo para el backend
- **Guarda** la contraseña de la base de datos

### Regiones Disponibles
- **US East (N. Virginia)**: Mejor para América
- **Europe West (London)**: Mejor para Europa
- **Asia Pacific (Singapore)**: Mejor para Asia

### Límites del Plan Gratuito
- **Base de datos**: 500MB
- **Bandwidth**: 2GB/mes
- **Backups**: Diarios
- **Soporte**: Community

## 🚨 Troubleshooting

### Error: "Invalid API key"
- Verifica que copiaste la clave completa
- Asegúrate de que no hay espacios extra
- Confirma que estás usando la clave correcta (anon vs service_role)

### Error: "Connection failed"
- Verifica que el Project URL sea correcto
- Confirma que el proyecto esté activo
- Revisa que la región sea accesible

### Error: "Table not found"
- Ejecuta el script SQL completo
- Verifica que las tablas se crearon en Table Editor
- Confirma que tienes permisos para acceder a las tablas 