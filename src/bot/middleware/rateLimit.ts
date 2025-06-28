import type { Message } from 'node-telegram-bot-api';

/**
 * Rate Limiting Middleware for Telegram Bot
 * Protects against spam and API abuse with configurable limits
 */

export interface RateLimitConfig {
  // General rate limits (per user)
  maxMessagesPerMinute: number;
  maxMessagesPerHour: number;
  maxMessagesPerDay: number;
  
  // Command-specific rate limits
  maxCommandsPerMinute: number;
  maxCommandsPerHour: number;
  
  // Financial operation rate limits (more restrictive)
  maxFinancialOpsPerMinute: number;
  maxFinancialOpsPerHour: number;
  maxFinancialOpsPerDay: number;
  
  // Cooldown periods (in milliseconds)
  cooldownPeriods: {
    [command: string]: number;
  };
}

// Default rate limit configuration
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  // General limits
  maxMessagesPerMinute: 30,
  maxMessagesPerHour: 300,
  maxMessagesPerDay: 1000,
  
  // Command limits
  maxCommandsPerMinute: 10,
  maxCommandsPerHour: 100,
  
  // Financial operation limits (more restrictive)
  maxFinancialOpsPerMinute: 3,
  maxFinancialOpsPerHour: 20,
  maxFinancialOpsPerDay: 50,
  
  // Cooldown periods for specific commands (in milliseconds)
  cooldownPeriods: {
    '/deposit': 30000,        // 30 seconds
    '/withdraw': 60000,       // 1 minute
    '/claim': 30000,          // 30 seconds
    '/pay': 30000,            // 30 seconds
    '/send_uma': 60000,       // 1 minute
    '/transfer': 30000,       // 30 seconds
    '/convert': 30000,        // 30 seconds
    '/savings_advice': 60000, // 1 minute (AI processing)
  }
};

// In-memory storage for rate limiting (in production, use Redis or database)
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lastCommandTime: number;
}

interface UserRateLimit {
  messages: RateLimitEntry;
  commands: RateLimitEntry;
  financialOps: RateLimitEntry;
  cooldowns: Map<string, number>;
}

const rateLimitStore = new Map<number, UserRateLimit>();

// Financial operation commands (more restrictive)
const FINANCIAL_COMMANDS = [
  '/deposit', '/withdraw', '/claim', '/pay', '/send_uma', 
  '/transfer', '/convert', '/withdraw_btc', '/withdraw_usd'
];

/**
 * Check if a command is a financial operation
 */
function isFinancialCommand(command: string): boolean {
  return FINANCIAL_COMMANDS.some(financialCmd => 
    command.toLowerCase().startsWith(financialCmd.toLowerCase())
  );
}

/**
 * Get current timestamp
 */
function getCurrentTime(): number {
  return Date.now();
}

/**
 * Initialize rate limit entry for a user
 */
function initializeUserRateLimit(telegramId: number): UserRateLimit {
  const now = getCurrentTime();
  
  const userRateLimit: UserRateLimit = {
    messages: { count: 0, resetTime: now + 60000, lastCommandTime: 0 },
    commands: { count: 0, resetTime: now + 60000, lastCommandTime: 0 },
    financialOps: { count: 0, resetTime: now + 60000, lastCommandTime: 0 },
    cooldowns: new Map()
  };
  
  rateLimitStore.set(telegramId, userRateLimit);
  return userRateLimit;
}

/**
 * Reset rate limit entry if time window has expired
 */
function resetIfExpired(entry: RateLimitEntry, windowMs: number): void {
  const now = getCurrentTime();
  if (now >= entry.resetTime) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }
}

/**
 * Check rate limit for a specific type
 */
function checkRateLimit(
  telegramId: number, 
  type: 'messages' | 'commands' | 'financialOps',
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  let userRateLimit = rateLimitStore.get(telegramId);
  
  if (!userRateLimit) {
    userRateLimit = initializeUserRateLimit(telegramId);
  }
  
  const entry = userRateLimit[type];
  resetIfExpired(entry, windowMs);
  
  const remaining = Math.max(0, limit - entry.count);
  const allowed = entry.count < limit;
  
  if (allowed) {
    entry.count++;
    entry.lastCommandTime = getCurrentTime();
  }
  
  return { allowed, remaining, resetTime: entry.resetTime };
}

/**
 * Check cooldown for a specific command
 */
function checkCooldown(telegramId: number, command: string, cooldownMs: number): { allowed: boolean; remainingMs: number } {
  let userRateLimit = rateLimitStore.get(telegramId);
  
  if (!userRateLimit) {
    userRateLimit = initializeUserRateLimit(telegramId);
  }
  
  const lastUsed = userRateLimit.cooldowns.get(command) || 0;
  const now = getCurrentTime();
  const timeSinceLastUse = now - lastUsed;
  const remainingMs = Math.max(0, cooldownMs - timeSinceLastUse);
  
  const allowed = timeSinceLastUse >= cooldownMs;
  
  if (allowed) {
    userRateLimit.cooldowns.set(command, now);
  }
  
  return { allowed, remainingMs };
}

/**
 * Rate limit middleware function
 */
export async function rateLimitMiddleware(
  message: Message, 
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): Promise<{ allowed: boolean; reason?: string; remaining?: number; resetTime?: number }> {
  const telegramId = message.from?.id;
  
  if (!telegramId) {
    return { allowed: false, reason: 'No Telegram user ID found' };
  }
  
  const text = message.text || '';
  const isCommand = text.startsWith('/');
  const command = isCommand ? text.split(' ')[0].toLowerCase() : '';
  const isFinancial = isFinancialCommand(command);
  
  // Check general message rate limit
  const messageLimit = checkRateLimit(telegramId, 'messages', config.maxMessagesPerMinute, 60000);
  if (!messageLimit.allowed) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: Too many messages. Try again in ${Math.ceil((messageLimit.resetTime - getCurrentTime()) / 1000)} seconds`,
      remaining: messageLimit.remaining,
      resetTime: messageLimit.resetTime
    };
  }
  
  // Check command rate limit if it's a command
  if (isCommand) {
    const commandLimit = checkRateLimit(telegramId, 'commands', config.maxCommandsPerMinute, 60000);
    if (!commandLimit.allowed) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: Too many commands. Try again in ${Math.ceil((commandLimit.resetTime - getCurrentTime()) / 1000)} seconds`,
        remaining: commandLimit.remaining,
        resetTime: commandLimit.resetTime
      };
    }
    
    // Check financial operation rate limit if it's a financial command
    if (isFinancial) {
      const financialLimit = checkRateLimit(telegramId, 'financialOps', config.maxFinancialOpsPerMinute, 60000);
      if (!financialLimit.allowed) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: Too many financial operations. Try again in ${Math.ceil((financialLimit.resetTime - getCurrentTime()) / 1000)} seconds`,
          remaining: financialLimit.remaining,
          resetTime: financialLimit.resetTime
        };
      }
    }
    
    // Check cooldown for specific command
    const cooldownMs = config.cooldownPeriods[command];
    if (cooldownMs) {
      const cooldown = checkCooldown(telegramId, command, cooldownMs);
      if (!cooldown.allowed) {
        return {
          allowed: false,
          reason: `Cooldown active: Please wait ${Math.ceil(cooldown.remainingMs / 1000)} seconds before using ${command} again`,
          remaining: Math.ceil(cooldown.remainingMs / 1000)
        };
      }
    }
  }
  
  return { allowed: true };
}

/**
 * Higher-order function to wrap handlers with rate limiting
 */
export function withRateLimit<T extends any[]>(
  handler: (message: Message, ...args: T) => Promise<void>,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
) {
  return async (message: Message, ...args: T) => {
    const rateLimitResult = await rateLimitMiddleware(message, config);
    
    if (!rateLimitResult.allowed) {
      // Send rate limit message to user
      const chatId = message.chat.id;
      const bot = (global as any).bot; // Access bot instance (you might need to adjust this)
      
      if (bot) {
        const rateLimitMessage = `🚫 *Rate Limit Exceeded*\n\n${rateLimitResult.reason}`;
        await bot.sendMessage(chatId, rateLimitMessage, { parse_mode: 'Markdown' });
      }
      
      console.log(`RATE LIMIT: Blocked message from user ${message.from?.id}: ${rateLimitResult.reason}`);
      return;
    }
    
    // Proceed with handler if rate limit check passes
    await handler(message, ...args);
  };
}

/**
 * Get rate limit statistics for a user
 */
export function getUserRateLimitStats(telegramId: number): {
  messages: { count: number; limit: number; remaining: number };
  commands: { count: number; limit: number; remaining: number };
  financialOps: { count: number; limit: number; remaining: number };
} | null {
  const userRateLimit = rateLimitStore.get(telegramId);
  
  if (!userRateLimit) {
    return null;
  }
  
  const config = DEFAULT_RATE_LIMIT_CONFIG;
  const now = getCurrentTime();
  
  // Reset expired entries
  resetIfExpired(userRateLimit.messages, 60000);
  resetIfExpired(userRateLimit.commands, 60000);
  resetIfExpired(userRateLimit.financialOps, 60000);
  
  return {
    messages: {
      count: userRateLimit.messages.count,
      limit: config.maxMessagesPerMinute,
      remaining: Math.max(0, config.maxMessagesPerMinute - userRateLimit.messages.count)
    },
    commands: {
      count: userRateLimit.commands.count,
      limit: config.maxCommandsPerMinute,
      remaining: Math.max(0, config.maxCommandsPerMinute - userRateLimit.commands.count)
    },
    financialOps: {
      count: userRateLimit.financialOps.count,
      limit: config.maxFinancialOpsPerMinute,
      remaining: Math.max(0, config.maxFinancialOpsPerMinute - userRateLimit.financialOps.count)
    }
  };
}

/**
 * Clear rate limit data for a user (useful for testing or admin operations)
 */
export function clearUserRateLimit(telegramId: number): void {
  rateLimitStore.delete(telegramId);
}

/**
 * Get all rate limit statistics (for monitoring)
 */
export function getAllRateLimitStats(): {
  totalUsers: number;
  activeUsers: number;
  blockedRequests: number;
} {
  const now = getCurrentTime();
  let activeUsers = 0;
  
  // Count active users (used in last 5 minutes)
  for (const [telegramId, userRateLimit] of rateLimitStore.entries()) {
    const lastActivity = Math.max(
      userRateLimit.messages.lastCommandTime,
      userRateLimit.commands.lastCommandTime,
      userRateLimit.financialOps.lastCommandTime
    );
    
    if (now - lastActivity < 300000) { // 5 minutes
      activeUsers++;
    }
  }
  
  return {
    totalUsers: rateLimitStore.size,
    activeUsers,
    blockedRequests: 0 // This would need to be tracked separately
  };
} 