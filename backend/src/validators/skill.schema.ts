import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().min(1).max(80),
  category: z
    .enum([
      'FRONTEND',
      'BACKEND',
      'DATABASE',
      'CLOUD',
      'DEVOPS',
      'LANGUAGE',
      'FRAMEWORK',
      'LIBRARY',
      'AI_ML',
      'AI',
      'TOOL',
      'SOFT',
      'OTHER',
    ])
    .optional(),
  level: z.number().int().min(1).max(5).optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export const skillUpdateSchema = skillSchema.partial();
export type SkillInput = z.infer<typeof skillSchema>;
export type SkillUpdateInput = z.infer<typeof skillUpdateSchema>;
