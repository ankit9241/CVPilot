export interface SettingsDomain {
  id: string;
  userId: string;
  theme: string;
  language: string;
  emailNotifications: boolean;
  productUpdates: boolean;
  weeklyDigest: boolean;
  timezone: string;
  preferences?: string;
  createdAt: string;
  updatedAt: string;
}
