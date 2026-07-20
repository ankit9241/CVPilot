import { z } from 'zod';

export const createResumeSchema = z.object({
  title: z.string().min(1).max(160),
  company: z.string().max(160).optional(),
  role: z.string().max(160).optional(),
  templateId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
});

export const updateResumeSchema = createResumeSchema.partial().extend({
  isFavorite: z.boolean().optional(),
  status: z.enum(['DRAFT', 'GENERATING', 'READY', 'FAILED', 'ARCHIVED']).optional(),
});

export const createResumeVersionSchema = z.object({
  label: z.string().max(160).optional(),
  contentJson: z.record(z.unknown()),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type CreateResumeVersionInput = z.infer<typeof createResumeVersionSchema>;
