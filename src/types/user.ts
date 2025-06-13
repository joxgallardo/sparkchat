
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
