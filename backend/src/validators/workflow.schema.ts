import { z } from 'zod';

export const startWorkflowSchema = z.object({
  resumeId: z.string().uuid().optional(),
  input: z.record(z.unknown()).optional(),
});
export type StartWorkflowInput = z.infer<typeof startWorkflowSchema>;
