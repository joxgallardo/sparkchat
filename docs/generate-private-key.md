# Generar Clave Privada para JWT de Lightspark

## 🔑 ¿Por Qué Necesitamos una Clave Privada?

Según la documentación de Lightspark, necesitas generar un JWT en tu backend y firmarlo con tu clave privada. El JWT incluye claims específicos como:
- `aud` (audience): 'lightspark'
- `sub` (subject): tu Account ID
- `iat` (issued at): timestamp
- `exp` (expiration): timestamp
- `test`: flag para testnet/mainnet

## 🛠️ Generar Clave Privada

### Opción 1: Usando OpenSSL (Recomendado)

```bash
# Generar par de claves RSA
openssl genrsa -out lightspark_private.pem 2048
openssl rsa -in lightspark_private.pem -pubout -out lightspark_public.pem

# Ver la clave privada (para copiar a .env)
cat lightspark_private.pem
```

### Opción 2: Usando Node.js

```bash
# Crear script para generar claves
node -e "
const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});
console.log('Private Key:');
console.log(privateKey);
console.log('\nPublic Key:');
console.log(publicKey);
"
```

### Opción 3: Generador Online (Solo para desarrollo)

⚠️ **ADVERTENCIA**: Solo para desarrollo, nunca para producción

```bash
# Usar un generador online como https://cryptotools.net/rsagen
# Copiar la clave privada generada
```

## 📋 Configurar Variables de Entorno

### 1. Copiar Clave Privada
```bash
# En tu archivo .env.local
LIGHTSPARK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

### 2. Configurar Account ID
```bash
LIGHTSPARK_ACCOUNT_ID=0197673c-b416-9af2-0000-e06272dd8c52
```

### 3. Configurar Testnet/Mainnet
```bash
# Para testnet (recomendado para desarrollo)
LIGHTSPARK_TESTNET=true

# Para mainnet (producción)
LIGHTSPARK_TESTNET=false
```

## 🔒 Seguridad

### ✅ Buenas Prácticas
- **Guarda la clave privada** en variables de entorno
- **Nunca subas** la clave privada a GitHub
- **Usa testnet** para desarrollo
- **Rota las claves** regularmente

### ❌ Lo Que NO Hacer
- No compartir la clave privada
- No usar la misma clave en desarrollo y producción
- No subir claves a repositorios públicos

## 🧪 Probar la Configuración

### 1. Verificar JWT Generation
```bash
# Crear script de prueba
node -e "
const { generateLightsparkJWT } = require('./src/services/lightspark-jwt');
console.log('JWT:', generateLightsparkJWT());
"
```

### 2. Probar Integración Completa
```bash
npx tsx src/services/test-lightspark-integration.ts
```

## 📝 Ejemplo de JWT Generado

Un JWT válido se verá así:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJsaWdodHNwYXJrIiwic3ViIjoiMDE5NzY3M2MtYjQxNi05YWYyLTAwMDAtZTA2MjcyZGQ4YzUyIiwiaWF0IjoxNzM1MjM0NTY3LCJleHAiOjE3MzUyMzgxNjcsInRlc3QiOiJ0cnVlIn0.signature_here
```

## 🆘 Solución de Problemas

### Error: "Private key not configured"
- Verifica que `LIGHTSPARK_PRIVATE_KEY` esté en tu `.env.local`
- Asegúrate de que la clave esté en formato PEM correcto

### Error: "Invalid private key"
- Verifica que la clave sea RSA válida
- Asegúrate de que incluya los headers `-----BEGIN PRIVATE KEY-----`

### Error: "JWT generation failed"
- Verifica que `LIGHTSPARK_ACCOUNT_ID` esté configurado
- Revisa los logs para más detalles

## 📚 Recursos Adicionales

- [Documentación JWT](https://jwt.io/)
- [OpenSSL Documentation](https://www.openssl.org/docs/)
- [Lightspark JWT Guide](https://docs.lightspark.com) 