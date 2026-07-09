import { z } from 'zod';

export const templateFilterSchema = z.object({
  category: z
    .enum(['MODERN', 'CLASSIC', 'MINIMAL', 'PROFESSIONAL', 'CREATIVE', 'ACADEMIC', 'CORPORATE'])
    .optional(),
  isPremium: z.coerce.boolean().optional(),
});
export type TemplateFilter = z.infer<typeof templateFilterSchema>;
