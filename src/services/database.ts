
'use server';
/**
 * @fileOverview Placeholder service for database interactions.
 * In a real application, this would connect to a database like Firestore
 * to store and retrieve user data, including their Lightspark configurations.
 */

import type { User, UserLightsparkConfig } from '@/types/user';

// --- MOCK DATABASE ---
const MOCK_USER_DB = new Map<string, User>();
const MOCK_LIGHTSPARK_CONFIG_DB = new Map<string, UserLightsparkConfig>();

// Initialize with a default user for testing
const DEFAULT_USER_ID = 'test-user-123';
const DEFAULT_WALLET_ID = 'default-mock-wallet-id-from-db';

if (!MOCK_USER_DB.has(DEFAULT_USER_ID)) {
  MOCK_USER_DB.set(DEFAULT_USER_ID, { id: DEFAULT_USER_ID, email: 'testuser@example.com' });
  MOCK_LIGHTSPARK_CONFIG_DB.set(DEFAULT_USER_ID, {
    userId: DEFAULT_USER_ID,
    lightsparkWalletId: DEFAULT_WALLET_ID,
  });
}
// --- END MOCK DATABASE ---


export async function getUserById(userId: string): Promise<User | null> {
  console.log(`DATABASE SERVICE: Fetching user by ID: ${userId} (MOCK)`);
  // TODO: Replace with actual database query
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  return MOCK_USER_DB.get(userId) || null;
}

export async function getUserLightsparkConfig(userId: string): Promise<UserLightsparkConfig | null> {
  console.log(`DATABASE SERVICE: Fetching Lightspark config for user ID: ${userId} (MOCK)`);
  // TODO: Replace with actual database query
  // This function would retrieve the user's specific Lightspark wallet ID,
  // and potentially their own API keys if your app supports that model.
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  const config = MOCK_LIGHTSPARK_CONFIG_DB.get(userId);
  if (config) return config;

  // Fallback for testing if no config is found for the user.
  // In a real app, you'd handle this more gracefully (e.g., onboarding flow).
  if (userId === DEFAULT_USER_ID) {
    console.warn(`DATABASE SERVICE: No specific config for ${userId}, returning default test config.`)
    return { userId: DEFAULT_USER_ID, lightsparkWalletId: DEFAULT_WALLET_ID };
  }
  return null;
}

export async function saveUserLightsparkConfig(config: UserLightsparkConfig): Promise<void> {
  console.log(`DATABASE SERVICE: Saving Lightspark config for user ID: ${config.userId} (MOCK)`);
  // TODO: Replace with actual database save operation
  MOCK_LIGHTSPARK_CONFIG_DB.set(config.userId, config);
  // Ensure user record exists too if creating new config
  if (!MOCK_USER_DB.has(config.userId)) {
    MOCK_USER_DB.set(config.userId, { id: config.userId });
  }
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  console.log(`DATABASE SERVICE: Config saved for ${config.userId}:`, config);
}

// Add other database functions as needed, e.g.,
// createUser, updateUser, etc.
