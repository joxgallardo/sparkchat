import jwt from 'jsonwebtoken';

/**
 * Generate JWT token for Lightspark authentication
 * Based on Lightspark documentation: JWT should include:
 * - audience (aud)
 * - subject (sub) - your account ID
 * - test/prod environment flag
 * - issued at (iat)
 * - expiration (exp)
 */

interface LightsparkJWTClaims {
  aud: string; // audience - usually 'lightspark'
  sub: string; // subject - your account ID
  iat: number; // issued at
  exp: number; // expiration
  test?: boolean; // test/prod environment flag
}

export function generateLightsparkJWT(): string {
  const accountId = process.env.LIGHTSPARK_ACCOUNT_ID;
  const privateKey = process.env.LIGHTSPARK_PRIVATE_KEY;
  const isTestnet = process.env.LIGHTSPARK_TESTNET === 'true';
  
  if (!accountId) {
    throw new Error('LIGHTSPARK_ACCOUNT_ID not configured');
  }
  
  if (!privateKey) {
    throw new Error('LIGHTSPARK_PRIVATE_KEY not configured. You need to generate a private key for JWT signing.');
  }

  // Debug logging to diagnose the private key format
  console.log('LIGHTSPARK JWT DEBUG:', {
    privateKeyLength: privateKey.length,
    startsWith: privateKey.substring(0, 30),
    endsWith: privateKey.substring(privateKey.length - 30),
    containsNewlines: privateKey.includes('\n'),
    containsBegin: privateKey.includes('-----BEGIN EC PRIVATE KEY-----'),
    containsEnd: privateKey.includes('-----END EC PRIVATE KEY-----')
  });

  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  const claims: LightsparkJWTClaims = {
    aud: 'https://api.lightspark.com',
    sub: accountId.replace('Account:', ''), // Remove Account: prefix if present
    iat: now,
    exp: now + expiresIn,
    test: isTestnet
  };

  // Debug logging for JWT claims
  console.log('LIGHTSPARK JWT CLAIMS:', {
    aud: claims.aud,
    sub: claims.sub,
    iat: claims.iat,
    exp: claims.exp,
    test: claims.test,
    accountIdLength: accountId.length
  });

  try {
    const token = jwt.sign(claims, privateKey, { 
      algorithm: 'ES256',
      header: {
        typ: 'JWT',
        alg: 'ES256'
      }
    });
    
    // Debug logging for generated token (first 50 chars)
    console.log('LIGHTSPARK JWT TOKEN SAMPLE:', token.substring(0, 50) + '...');
    
    console.log('LIGHTSPARK JWT: Generated JWT token successfully');
    return token;
  } catch (error) {
    console.error('LIGHTSPARK JWT: Failed to generate JWT:', error);
    throw new Error(`Failed to generate JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate a new JWT token and return it with expiration info
 */
export function getFreshLightsparkJWT(): { token: string; expiresAt: Date } {
  const token = generateLightsparkJWT();
  const decoded = jwt.decode(token) as any;
  
  return {
    token,
    expiresAt: new Date(decoded.exp * 1000)
  };
} 