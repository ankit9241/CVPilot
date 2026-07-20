import { z } from 'zod';

export const startWorkflowSchema = z.object({
  resumeId: z.string().uuid().optional(),
  input: z
    .object({
      companyName: z.string().optional(),
      targetRole: z.string().optional(),
      jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
    })
    .optional(),
});
export type StartWorkflowInput = z.infer<typeof startWorkflowSchema>;
