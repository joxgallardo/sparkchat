'use server';
/**
 * @fileOverview Placeholder service for database interactions.
 * In a real application, this would connect to a database like Firestore
 * to store and retrieve user data, including their Lightspark configurations.
 */

import type { User, UserLightsparkConfig, TelegramUser, TelegramSession } from '@/types/user';

// --- MOCK DATABASE ---
const MOCK_USER_DB = new Map<string, User>();
const MOCK_LIGHTSPARK_CONFIG_DB = new Map<string, UserLightsparkConfig>();
const MOCK_TELEGRAM_USER_DB = new Map<number, TelegramUser>();
const MOCK_TELEGRAM_SESSION_DB = new Map<number, TelegramSession>();

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

// Telegram User Management Functions
export async function getTelegramUser(telegramId: number): Promise<TelegramUser | null> {
  console.log(`DATABASE SERVICE: Fetching Telegram user by ID: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  return MOCK_TELEGRAM_USER_DB.get(telegramId) || null;
}

export async function createTelegramUser(telegramUser: Omit<TelegramUser, 'createdAt' | 'lastSeen'>): Promise<TelegramUser> {
  console.log(`DATABASE SERVICE: Creating Telegram user: ${telegramUser.telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  
  const newUser: TelegramUser = {
    ...telegramUser,
    createdAt: new Date(),
    lastSeen: new Date()
  };
  
  MOCK_TELEGRAM_USER_DB.set(telegramUser.telegramId, newUser);
  
  // Also create a SparkChat user if it doesn't exist
  if (!MOCK_USER_DB.has(telegramUser.sparkChatUserId)) {
    MOCK_USER_DB.set(telegramUser.sparkChatUserId, { 
      id: telegramUser.sparkChatUserId,
      email: telegramUser.username ? `${telegramUser.username}@telegram.local` : undefined
    });
  }
  
  console.log(`DATABASE SERVICE: Telegram user created:`, newUser);
  return newUser;
}

export async function updateTelegramUserLastSeen(telegramId: number): Promise<void> {
  console.log(`DATABASE SERVICE: Updating last seen for Telegram user: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  
  const user = MOCK_TELEGRAM_USER_DB.get(telegramId);
  if (user) {
    user.lastSeen = new Date();
    MOCK_TELEGRAM_USER_DB.set(telegramId, user);
  }
}

export async function getOrCreateTelegramUser(
  telegramId: number, 
  username?: string, 
  firstName?: string, 
  lastName?: string
): Promise<TelegramUser> {
  console.log(`DATABASE SERVICE: Get or create Telegram user: ${telegramId} (MOCK)`);
  
  let user = await getTelegramUser(telegramId);
  
  if (!user) {
    // Create new user with unique SparkChat ID
    const sparkChatUserId = `telegram-${telegramId}-${Date.now()}`;
    user = await createTelegramUser({
      telegramId,
      sparkChatUserId,
      username,
      firstName,
      lastName,
      isActive: true,
      accountNumber: 0, // Default account number
      umaAddress: `user${telegramId}@sparkchat.btc` // Generate UMA address
    });
  } else {
    // Update last seen
    await updateTelegramUserLastSeen(telegramId);
  }
  
  return user;
}

// Session Management Functions
export async function getTelegramSession(telegramId: number): Promise<TelegramSession | null> {
  console.log(`DATABASE SERVICE: Fetching Telegram session for ID: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  return MOCK_TELEGRAM_SESSION_DB.get(telegramId) || null;
}

export async function createTelegramSession(session: Omit<TelegramSession, 'lastActivity'>): Promise<TelegramSession> {
  console.log(`DATABASE SERVICE: Creating Telegram session for ID: ${session.telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  
  const newSession: TelegramSession = {
    ...session,
    lastActivity: new Date()
  };
  
  MOCK_TELEGRAM_SESSION_DB.set(session.telegramId, newSession);
  console.log(`DATABASE SERVICE: Telegram session created:`, newSession);
  return newSession;
}

export async function updateTelegramSessionActivity(telegramId: number): Promise<void> {
  console.log(`DATABASE SERVICE: Updating session activity for Telegram ID: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate DB delay
  
  const session = MOCK_TELEGRAM_SESSION_DB.get(telegramId);
  if (session) {
    session.lastActivity = new Date();
    MOCK_TELEGRAM_SESSION_DB.set(telegramId, session);
  }
}

// Original functions remain the same
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
