import { z } from 'zod';

export const benchmarkSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  role: z.string().optional(),
});

export type BenchmarkInput = z.infer<typeof benchmarkSchema>;
