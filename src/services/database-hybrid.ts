'use server';

/**
 * @fileOverview Hybrid database service that uses Supabase when configured, mock otherwise
 */

import type { User, UserLightsparkConfig, TelegramUser, TelegramSession } from '@/types/user';
import { supabase, shouldUseRealDatabase } from './supabase';

// --- MOCK DATABASE (fallback) ---
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

// Mock account number counter
let MOCK_ACCOUNT_NUMBER_COUNTER = 1;

// --- END MOCK DATABASE ---

// Helper function to generate UMA address
function generateUMAAddress(username: string | undefined, accountNumber: number): string {
  const prefix = username && username.trim() !== '' ? username : 'user';
  return `${prefix}${accountNumber}@sparkchat.btc`;
}

// Helper function to get next available account number
async function getNextAccountNumber(): Promise<number> {
  if (shouldUseRealDatabase()) {
    try {
      // Get the maximum account_number from telegram_users
      const { data, error } = await supabase
        .from('telegram_users')
        .select('account_number')
        .order('account_number', { ascending: false })
        .limit(1)
        .single();
        
      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error getting next account number:', error);
        throw error;
      }
      
      // If no users exist, start with 1, otherwise increment the max
      return data ? data.account_number + 1 : 1;
    } catch (error) {
      console.error('Supabase error getting next account number:', error);
      console.log('Falling back to mock counter');
    }
  }
  
  // Mock implementation
  return ++MOCK_ACCOUNT_NUMBER_COUNTER;
}

// Telegram User Management Functions
export async function getTelegramUser(telegramId: number): Promise<TelegramUser | null> {
  if (shouldUseRealDatabase()) {
    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
        
      if (error) {
        console.error('Error fetching Telegram user:', error);
        return null;
      }
      
      if (data) {
        // Transform database format to our interface
        return {
          telegramId: data.telegram_id,
          sparkChatUserId: data.spark_chat_user_id,
          username: data.username,
          firstName: data.first_name,
          lastName: data.last_name,
          isActive: data.is_active,
          accountNumber: data.account_number,
          umaAddress: data.uma_address,
          createdAt: new Date(data.created_at),
          lastSeen: new Date(data.last_seen)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Supabase error:', error);
      // Fallback to mock
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Fetching Telegram user by ID: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_TELEGRAM_USER_DB.get(telegramId) || null;
}

export async function createTelegramUser(telegramUser: Omit<TelegramUser, 'createdAt' | 'lastSeen' | 'accountNumber' | 'umaAddress'>): Promise<TelegramUser> {
  if (shouldUseRealDatabase()) {
    try {
      // Get next available account number
      const accountNumber = await getNextAccountNumber();
      const umaAddress = generateUMAAddress(telegramUser.username, accountNumber);
      
      const { data, error } = await supabase
        .from('telegram_users')
        .insert({
          telegram_id: telegramUser.telegramId,
          spark_chat_user_id: telegramUser.sparkChatUserId,
          username: telegramUser.username,
          first_name: telegramUser.firstName,
          last_name: telegramUser.lastName,
          is_active: telegramUser.isActive,
          account_number: accountNumber,
          uma_address: umaAddress
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating Telegram user: ${error.message}`);
      }
      
      // Also create a SparkChat user
      await supabase
        .from('users')
        .upsert({
          id: telegramUser.sparkChatUserId,
          email: telegramUser.username ? `${telegramUser.username}@telegram.local` : null
        });
      
      return {
        telegramId: data.telegram_id,
        sparkChatUserId: data.spark_chat_user_id,
        username: data.username,
        firstName: data.first_name,
        lastName: data.last_name,
        isActive: data.is_active,
        accountNumber: data.account_number,
        umaAddress: data.uma_address,
        createdAt: new Date(data.created_at),
        lastSeen: new Date(data.last_seen)
      };
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Creating Telegram user: ${telegramUser.telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const accountNumber = await getNextAccountNumber();
  const umaAddress = generateUMAAddress(telegramUser.username, accountNumber);
  
  const newUser: TelegramUser = {
    ...telegramUser,
    accountNumber,
    umaAddress,
    createdAt: new Date(),
    lastSeen: new Date()
  };
  
  MOCK_TELEGRAM_USER_DB.set(telegramUser.telegramId, newUser);
  
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
  if (shouldUseRealDatabase()) {
    try {
      const { error } = await supabase
        .from('telegram_users')
        .update({ last_seen: new Date().toISOString() })
        .eq('telegram_id', telegramId);
        
      if (error) {
        console.error('Error updating last seen:', error);
      }
      return;
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Updating last seen for Telegram user: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const user = MOCK_TELEGRAM_USER_DB.get(telegramId);
  if (user) {
    user.lastSeen = new Date();
    MOCK_TELEGRAM_USER_DB.set(telegramId, user);
  }
}

export async function getTelegramUserByAccountNumber(accountNumber: number): Promise<TelegramUser | null> {
  if (shouldUseRealDatabase()) {
    try {
      const { data, error } = await supabase
        .from('telegram_users')
        .select('*')
        .eq('account_number', accountNumber)
        .single();
        
      if (error) {
        console.error('Error fetching Telegram user by account number:', error);
        return null;
      }
      
      if (data) {
        // Transform database format to our interface
        return {
          telegramId: data.telegram_id,
          sparkChatUserId: data.spark_chat_user_id,
          username: data.username,
          firstName: data.first_name,
          lastName: data.last_name,
          isActive: data.is_active,
          accountNumber: data.account_number,
          umaAddress: data.uma_address,
          createdAt: new Date(data.created_at),
          lastSeen: new Date(data.last_seen)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Supabase error:', error);
      // Fallback to mock
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Fetching Telegram user by account number: ${accountNumber} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Find user by account number in mock database
  for (const user of MOCK_TELEGRAM_USER_DB.values()) {
    if (user.accountNumber === accountNumber) {
      return user;
    }
  }
  
  return null;
}

export async function getOrCreateTelegramUser(
  telegramId: number, 
  username?: string, 
  firstName?: string, 
  lastName?: string
): Promise<TelegramUser> {
  console.log(`DATABASE SERVICE: Get or create Telegram user: ${telegramId}`);
  
  let user = await getTelegramUser(telegramId);
  
  if (!user) {
    const sparkChatUserId = `telegram-${telegramId}-${Date.now()}`;
    user = await createTelegramUser({
      telegramId,
      sparkChatUserId,
      username,
      firstName,
      lastName,
      isActive: true
    });
  } else {
    await updateTelegramUserLastSeen(telegramId);
  }
  
  return user;
}

// Session Management Functions
export async function getTelegramSession(telegramId: number): Promise<TelegramSession | null> {
  if (shouldUseRealDatabase()) {
    try {
      const { data, error } = await supabase
        .from('telegram_sessions')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();
        
      if (error) {
        console.error('Error fetching session:', error);
        return null;
      }
      
      if (data) {
        return {
          telegramId: data.telegram_id,
          sparkChatUserId: data.spark_chat_user_id,
          isAuthenticated: data.is_authenticated,
          lastActivity: new Date(data.last_activity),
          preferences: data.preferences
        };
      }
      
      return null;
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Fetching Telegram session for ID: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_TELEGRAM_SESSION_DB.get(telegramId) || null;
}

export async function createTelegramSession(session: Omit<TelegramSession, 'lastActivity'>): Promise<TelegramSession> {
  if (shouldUseRealDatabase()) {
    try {
      const { data, error } = await supabase
        .from('telegram_sessions')
        .insert({
          telegram_id: session.telegramId,
          spark_chat_user_id: session.sparkChatUserId,
          is_authenticated: session.isAuthenticated,
          preferences: session.preferences || {}
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Error creating session: ${error.message}`);
      }
      
      return {
        telegramId: data.telegram_id,
        sparkChatUserId: data.spark_chat_user_id,
        isAuthenticated: data.is_authenticated,
        lastActivity: new Date(data.last_activity),
        preferences: data.preferences
      };
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Creating Telegram session for ID: ${session.telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const newSession: TelegramSession = {
    ...session,
    lastActivity: new Date()
  };
  
  MOCK_TELEGRAM_SESSION_DB.set(session.telegramId, newSession);
  console.log(`DATABASE SERVICE: Telegram session created:`, newSession);
  return newSession;
}

export async function updateTelegramSessionActivity(telegramId: number): Promise<void> {
  if (shouldUseRealDatabase()) {
    try {
      const { error } = await supabase
        .from('telegram_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('telegram_id', telegramId);
        
      if (error) {
        console.error('Error updating session activity:', error);
      }
      return;
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Updating session activity for Telegram ID: ${telegramId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const session = MOCK_TELEGRAM_SESSION_DB.get(telegramId);
  if (session) {
    session.lastActivity = new Date();
    MOCK_TELEGRAM_SESSION_DB.set(telegramId, session);
  }
}

// Original functions with hybrid implementation
export async function getUserById(userId: string): Promise<User | null> {
  if (shouldUseRealDatabase()) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching user:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Fetching user by ID: ${userId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_USER_DB.get(userId) || null;
}

export async function getUserLightsparkConfig(userId: string): Promise<UserLightsparkConfig | null> {
  if (shouldUseRealDatabase()) {
    try {
      const { data, error } = await supabase
        .from('user_lightspark_configs')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching Lightspark config:', error);
        return null;
      }
      
      if (data) {
        return {
          userId: data.user_id,
          lightsparkWalletId: data.lightspark_wallet_id
        };
      }
      
      return null;
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Fetching Lightspark config for user ID: ${userId} (MOCK)`);
  await new Promise(resolve => setTimeout(resolve, 50));
  const config = MOCK_LIGHTSPARK_CONFIG_DB.get(userId);
  if (config) return config;

  if (userId === DEFAULT_USER_ID) {
    console.warn(`DATABASE SERVICE: No specific config for ${userId}, returning default test config.`)
    return { userId: DEFAULT_USER_ID, lightsparkWalletId: DEFAULT_WALLET_ID };
  }
  return null;
}

export async function saveUserLightsparkConfig(config: UserLightsparkConfig): Promise<void> {
  if (shouldUseRealDatabase()) {
    try {
      const { error } = await supabase
        .from('user_lightspark_configs')
        .upsert({
          user_id: config.userId,
          lightspark_wallet_id: config.lightsparkWalletId,
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        throw new Error(`Error saving Lightspark config: ${error.message}`);
      }
      
      // Ensure user record exists too
      await supabase
        .from('users')
        .upsert({ id: config.userId });
        
      return;
    } catch (error) {
      console.error('Supabase error:', error);
      console.log('Falling back to mock database');
    }
  }
  
  // Mock implementation
  console.log(`DATABASE SERVICE: Saving Lightspark config for user ID: ${config.userId} (MOCK)`);
  MOCK_LIGHTSPARK_CONFIG_DB.set(config.userId, config);
  if (!MOCK_USER_DB.has(config.userId)) {
    MOCK_USER_DB.set(config.userId, { id: config.userId });
  }
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log(`DATABASE SERVICE: Config saved for ${config.userId}:`, config);
} 