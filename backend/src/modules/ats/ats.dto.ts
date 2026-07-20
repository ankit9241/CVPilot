import { z } from 'zod';

export const analyzeAtsSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  jobDescription: z.string().optional(),
});

export type AnalyzeAtsInput = z.infer<typeof analyzeAtsSchema>;
