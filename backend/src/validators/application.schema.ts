import { z } from 'zod';
import { lenientUrl } from './common.schema';

export const applicationSchema = z.object({
  company: z.string().min(1).max(160),
  role: z.string().min(1).max(160),
  location: z.string().max(160).optional(),
  jobUrl: lenientUrl.optional(),
  salary: z.string().max(80).optional(),
  status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  notes: z.string().max(4000).optional(),
  resumeId: z.string().uuid().optional(),
  appliedAt: z.string().datetime().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN']),
  note: z.string().max(1000).optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
