import { z } from 'zod';

export const portfolioGenerateSchema = z.object({
  resumeVersionId: z.string().uuid('Invalid resumeVersionId format'),
  fullName: z.string().optional(),
  targetRole: z.string().optional(),
});

export type PortfolioGenerateInput = z.infer<typeof portfolioGenerateSchema>;
