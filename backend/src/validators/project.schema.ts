import { z } from 'zod';
import { lenientUrl } from './common.schema';

export const projectSchema = z.object({
  title: z.string().max(160).optional(),
  name: z.string().min(1).max(160),
  description: z.string().max(2000).optional(),
  role: z.string().max(160).optional(),
  technologies: z.array(z.string().min(1).max(60)).max(40).optional(),
  stack: z.array(z.string().min(1).max(60)).max(40).optional(),
  githubUrl: lenientUrl.optional(),
  liveUrl: lenientUrl.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  featured: z.boolean().optional(),
  impact: z.string().max(500).optional(),
  achievements: z.array(z.string().min(1).max(500)).max(20).optional(),
});
export const projectUpdateSchema = projectSchema.partial();
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
