# Lightspark Authentication Research

## Current SDK Version
- `@lightsparkdev/wallet-sdk@0.12.15`

## Authentication Methods Found

### 1. JWT Authentication (Correct Method)
The SDK uses JWT-based authentication. Here's how to implement it:

```typescript
import { 
  LightsparkClient, 
  CustomJwtAuthProvider, 
  InMemoryTokenStorage,
  AccessTokenInfo 
} from '@lightsparkdev/wallet-sdk';

// Create token storage
const tokenStorage = new InMemoryTokenStorage();

// Create auth provider
const authProvider = new CustomJwtAuthProvider(tokenStorage);

// Create client
const client = new LightsparkClient(authProvider);

// Login with JWT
const loginResult = await client.loginWithJWT(
  process.env.LIGHTSPARK_ACCOUNT_ID!,
  process.env.LIGHTSPARK_JWT_TOKEN!,
  tokenStorage
);
```

### 2. Environment Variables Needed
- `LIGHTSPARK_ACCOUNT_ID`: Your Lightspark account ID
- `LIGHTSPARK_JWT_TOKEN`: Your JWT token for authentication
- `USE_MOCK_CLIENT`: Set to "false" to use real client

### 3. JWT Token Structure
The JWT token should contain:
- `accessToken`: The actual access token
- `validUntil`: Expiration date

### 4. Testnet vs Mainnet
- For development: Use testnet credentials
- For production: Use mainnet credentials

## Implementation Steps

1. Get Lightspark credentials from https://app.lightspark.com
2. Generate JWT token with your account ID
3. Update .env file with real credentials
4. Set USE_MOCK_CLIENT=false
5. Test with small amounts on testnet first

## Resources
- Lightspark Dashboard: https://app.lightspark.com
- API Documentation: https://docs.lightspark.com
- SDK Documentation: https://github.com/lightsparkdev/lightspark-js

## Notes
- The SDK requires JWT authentication, not API key authentication
- You need to generate a JWT token with your account ID
- The token has an expiration time that needs to be managed 