import { z } from 'zod';

export const settingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(10).optional(),
  emailNotifications: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  timezone: z.string().max(60).optional(),
  preferences: z.record(z.unknown()).optional(),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
