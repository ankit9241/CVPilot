import { z } from 'zod';

export const experienceSchema = z.object({
  company: z.string().max(160).optional(),
  companyName: z.string().min(1).max(160),
  position: z.string().max(160).optional(),
  role: z.string().min(1).max(160),
  employmentType: z.string().max(120).optional(),
  location: z.string().max(160).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
  currentCompany: z.boolean().optional(),
  description: z.string().max(2000).optional(),
  technologiesUsed: z.array(z.string().min(1).max(80)).max(40).optional(),
  achievements: z.array(z.string().min(1).max(500)).max(20).optional(),
});
export const experienceUpdateSchema = experienceSchema.partial();
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ExperienceUpdateInput = z.infer<typeof experienceUpdateSchema>;
