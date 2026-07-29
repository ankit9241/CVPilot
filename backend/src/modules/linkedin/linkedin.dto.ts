import { z } from 'zod';

export const linkedInOptimizeSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  targetRole: z.string().optional(),
});

export type LinkedInOptimizeInput = z.infer<typeof linkedInOptimizeSchema>;
