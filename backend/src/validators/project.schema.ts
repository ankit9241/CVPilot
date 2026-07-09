import { z } from 'zod';

export const projectSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  role: z.string().max(160).optional(),
  stack: z.array(z.string().min(1).max(60)).max(40).optional(),
  githubUrl: z.string().url().optional(),
  liveUrl: z.string().url().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  impact: z.string().max(500).optional(),
  achievements: z.array(z.string().min(1).max(500)).max(20).optional(),
});
export type ProjectInput = z.infer<typeof projectSchema>;
