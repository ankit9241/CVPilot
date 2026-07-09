import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  location: z.string().max(160).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  achievements: z.array(z.string().min(1).max(500)).max(20).optional(),
});
export type ExperienceInput = z.infer<typeof experienceSchema>;
