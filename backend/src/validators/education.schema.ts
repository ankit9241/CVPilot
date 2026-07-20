import { z } from 'zod';

export const educationSchema = z.object({
  school: z.string().min(1).max(160),
  degree: z.string().min(1).max(160),
  field: z.string().max(160).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  gpa: z.string().max(20).optional(),
  description: z.string().max(1000).optional(),
});
export const educationUpdateSchema = educationSchema.partial();
export type EducationInput = z.infer<typeof educationSchema>;
export type EducationUpdateInput = z.infer<typeof educationUpdateSchema>;
