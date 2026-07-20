import { z } from 'zod';
import { lenientUrl } from './common.schema';

export const certificateSchema = z.object({
  name: z.string().min(1).max(160),
  issuer: z.string().min(1).max(160),
  issuedAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  credentialId: z.string().max(160).optional(),
  credentialUrl: lenientUrl.optional(),
});

export const certificateUpdateSchema = certificateSchema.partial();

export type CertificateInput = z.infer<typeof certificateSchema>;
export type CertificateUpdateInput = z.infer<typeof certificateUpdateSchema>;
