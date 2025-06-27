export interface User {
  id: string;
  email?: string;
  // Add other user-specific fields as needed
}

export interface UserLightsparkConfig {
  userId: string;
  lightsparkWalletId: string; // The user's specific wallet ID from Lightspark
  // Potentially user-specific API keys if not using a platform-wide account:
  // lightsparkApiTokenClientId?: string;
  // lightsparkApiTokenClientSecret?: string;
  // lightsparkNodeId?: string; // This might also be user-specific
}

// Telegram user management types
export interface TelegramUser {
  telegramId: number;
  sparkChatUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: Date;
  lastSeen: Date;
}

export interface TelegramSession {
  telegramId: number;
  sparkChatUserId: string;
  isAuthenticated: boolean;
  lastActivity: Date;
  preferences?: {
    language?: string;
    notifications?: boolean;
  };
}
