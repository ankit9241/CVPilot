import { z } from 'zod';
import { lenientUrl } from './common.schema';

export const achievementSchema = z.object({
  title: z.string().min(1).max(160),
  context: z.string().max(1000).optional(),
  description: z.string().max(1000).optional(),
  date: z.string().datetime().optional(),
  url: lenientUrl.optional(),
});

export const achievementUpdateSchema = achievementSchema.partial();

export type AchievementInput = z.infer<typeof achievementSchema>;
export type AchievementUpdateInput = z.infer<typeof achievementUpdateSchema>;
