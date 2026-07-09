export interface UpdateSettingsDto {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  emailNotifications?: boolean;
  productUpdates?: boolean;
  weeklyDigest?: boolean;
  timezone?: string;
  preferences?: Record<string, unknown>;
}
