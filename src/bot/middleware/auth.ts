import TelegramBot from 'node-telegram-bot-api';

// Simple in-memory mapping for now
// In production, this would be stored in a database
const telegramToUserIdMap = new Map<number, string>();

// Mock user ID for development
const MOCK_USER_ID = 'test-user-123';

export function authMiddleware(bot: TelegramBot) {
  return (msg: any, next: () => void) => {
    if (msg && msg.from) {
      const telegramId = msg.from.id;
      
      // For now, use mock user ID for all users
      // In Phase 3, this will be replaced with real user management
      if (!telegramToUserIdMap.has(telegramId)) {
        telegramToUserIdMap.set(telegramId, MOCK_USER_ID);
      }
      
      // Add user ID to message context
      msg.userId = telegramToUserIdMap.get(telegramId);
    }
    
    next();
  };
}

// Helper function to get user ID from Telegram ID
export function getUserIdFromTelegramId(telegramId: number): string {
  return telegramToUserIdMap.get(telegramId) || MOCK_USER_ID;
}

// Helper function to register a new user
export function registerUser(telegramId: number, userId: string): void {
  telegramToUserIdMap.set(telegramId, userId);
} 