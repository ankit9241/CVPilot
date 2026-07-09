import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().min(1).max(80),
  category: z
    .enum(['FRONTEND', 'BACKEND', 'DATABASE', 'CLOUD', 'DEVOPS', 'LANGUAGE', 'AI', 'TOOL', 'SOFT', 'OTHER'])
    .optional(),
  level: z.number().int().min(1).max(5).optional(),
});
export type SkillInput = z.infer<typeof skillSchema>;
