import type { Message } from 'node-telegram-bot-api';
import { getUserContext, UserContext } from '@/services/userManager';
import { rateLimitMiddleware, DEFAULT_RATE_LIMIT_CONFIG, type RateLimitConfig } from './rateLimit';

/**
 * Session Middleware for Telegram Bot
 * Handles user authentication and session management
 */

export interface SessionContext {
  telegramId: number;
  userContext: UserContext;
  message: Message;
}

/**
 * Session middleware function
 * Extracts user context and attaches it to the message
 */
export async function sessionMiddleware(message: Message): Promise<SessionContext> {
  const telegramId = message.from?.id;
  
  if (!telegramId) {
    throw new Error('No Telegram user ID found in message');
  }
  
  // Extract user data from Telegram message
  const telegramUserData = {
    username: message.from?.username,
    firstName: message.from?.first_name,
    lastName: message.from?.last_name
  };
  
  // Get or create user context
  const userContext = await getUserContext(telegramId, telegramUserData);
  
  const sessionContext: SessionContext = {
    telegramId,
    userContext,
    message
  };
  
  console.log(`SESSION MIDDLEWARE: Session context created for Telegram ID ${telegramId}`);
  
  return sessionContext;
}

/**
 * Higher-order function to wrap handlers with session middleware
 */
export function withSession<T extends any[]>(
  handler: (sessionContext: SessionContext, ...args: T) => Promise<void>
) {
  return async (message: Message, ...args: T) => {
    try {
      const sessionContext = await sessionMiddleware(message);
      await handler(sessionContext, ...args);
    } catch (error) {
      console.error('SESSION MIDDLEWARE ERROR:', error);
      // You might want to send an error message to the user here
      throw error;
    }
  };
}

/**
 * Combined middleware that applies both rate limiting and session management
 * This is the recommended middleware for production use
 */
export function withRateLimitAndSession<T extends any[]>(
  handler: (sessionContext: SessionContext, ...args: T) => Promise<void>,
  rateLimitConfig: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
) {
  return async (message: Message, ...args: T) => {
    try {
      // First, apply rate limiting
      const rateLimitResult = await rateLimitMiddleware(message, rateLimitConfig);
      
      if (!rateLimitResult.allowed) {
        // Send rate limit message to user
        const chatId = message.chat.id;
        const bot = (global as any).bot; // Access bot instance
        
        if (bot) {
          const rateLimitMessage = `🚫 *Rate Limit Exceeded*\n\n${rateLimitResult.reason}`;
          await bot.sendMessage(chatId, rateLimitMessage, { parse_mode: 'Markdown' });
        }
        
        console.log(`RATE LIMIT: Blocked message from user ${message.from?.id}: ${rateLimitResult.reason}`);
        return;
      }
      
      // Then, apply session middleware
      const sessionContext = await sessionMiddleware(message);
      
      // Finally, execute the handler
      await handler(sessionContext, ...args);
      
    } catch (error) {
      console.error('COMBINED MIDDLEWARE ERROR:', error);
      throw error;
    }
  };
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(sessionContext: SessionContext): Promise<void> {
  if (!sessionContext.userContext.isAuthenticated) {
    throw new Error('User not authenticated');
  }
}

/**
 * Get SparkChat user ID from session context
 */
export function getSparkChatUserId(sessionContext: SessionContext): string {
  return sessionContext.userContext.user.sparkChatUserId;
}

/**
 * Update user's last activity
 */
export async function updateUserActivity(sessionContext: SessionContext): Promise<void> {
  // This is handled automatically by getUserContext in sessionMiddleware
  // But you can add additional activity tracking here if needed
  console.log(`SESSION MIDDLEWARE: Updated activity for user ${sessionContext.telegramId}`);
} 