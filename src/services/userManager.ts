'use server';

import { 
  getOrCreateTelegramUser, 
  getTelegramUser, 
  getTelegramSession, 
  createTelegramSession, 
  updateTelegramSessionActivity,
  getUserById,
  getUserLightsparkConfig
} from './database-hybrid';
import type { TelegramUser, TelegramSession } from '@/types/user';

/**
 * User Manager Service for Telegram Integration
 * Handles mapping between Telegram IDs and SparkChat User IDs
 */

export interface UserContext {
  telegramId: number;
  sparkChatUserId: string;
  isAuthenticated: boolean;
  user: TelegramUser;
  session: TelegramSession;
}

/**
 * Get or create user context for a Telegram user
 * This is the main function that replaces MOCK_USER_ID
 */
export async function getUserContext(telegramId: number, telegramUserData?: {
  username?: string;
  firstName?: string;
  lastName?: string;
}): Promise<UserContext> {
  console.log(`USER MANAGER: Getting user context for Telegram ID: ${telegramId}`);
  
  // Get or create Telegram user
  const user = await getOrCreateTelegramUser(
    telegramId,
    telegramUserData?.username,
    telegramUserData?.firstName,
    telegramUserData?.lastName
  );
  
  // Get or create session
  let session = await getTelegramSession(telegramId);
  if (!session) {
    session = await createTelegramSession({
      telegramId,
      sparkChatUserId: user.sparkChatUserId,
      isAuthenticated: true
    });
  } else {
    // Update session activity
    await updateTelegramSessionActivity(telegramId);
  }
  
  const context: UserContext = {
    telegramId,
    sparkChatUserId: user.sparkChatUserId,
    isAuthenticated: session.isAuthenticated,
    user,
    session
  };
  
  console.log(`USER MANAGER: User context created:`, {
    telegramId,
    sparkChatUserId: user.sparkChatUserId,
    isAuthenticated: session.isAuthenticated
  });
  
  return context;
}

/**
 * Get SparkChat User ID from Telegram ID
 * This replaces the hardcoded MOCK_USER_ID
 */
export async function getSparkChatUserId(telegramId: number): Promise<string> {
  const user = await getTelegramUser(telegramId);
  if (!user) {
    throw new Error(`No user found for Telegram ID: ${telegramId}`);
  }
  return user.sparkChatUserId;
}

/**
 * Validate if a Telegram user is authenticated
 */
export async function isUserAuthenticated(telegramId: number): Promise<boolean> {
  const session = await getTelegramSession(telegramId);
  return session?.isAuthenticated || false;
}

/**
 * Get user's Lightspark configuration using Telegram ID
 */
export async function getUserLightsparkConfigByTelegramId(telegramId: number) {
  const sparkChatUserId = await getSparkChatUserId(telegramId);
  return await getUserLightsparkConfig(sparkChatUserId);
}

/**
 * Get SparkChat user data using Telegram ID
 */
export async function getSparkChatUserByTelegramId(telegramId: number) {
  const sparkChatUserId = await getSparkChatUserId(telegramId);
  return await getUserById(sparkChatUserId);
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(telegramId: number, preferences: {
  language?: string;
  notifications?: boolean;
}): Promise<void> {
  const session = await getTelegramSession(telegramId);
  if (session) {
    session.preferences = { ...session.preferences, ...preferences };
    // In a real implementation, you would save this to the database
    console.log(`USER MANAGER: Updated preferences for Telegram ID ${telegramId}:`, preferences);
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(telegramId: number) {
  const user = await getTelegramUser(telegramId);
  const session = await getTelegramSession(telegramId);
  
  if (!user || !session) {
    return null;
  }
  
  return {
    telegramId: user.telegramId,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastSeen: user.lastSeen,
    lastActivity: session.lastActivity,
    isAuthenticated: session.isAuthenticated,
    preferences: session.preferences
  };
} 