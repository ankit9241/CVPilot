import { z } from 'zod';
import { lenientUrl } from './common.schema';

export const upsertProfileSchema = z.object({
  fullName: z.string().min(1).max(120),
  headline: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  summary: z.string().max(2000).optional(),
  avatarUrl: lenientUrl.optional(),
});

export const patchProfileSchema = upsertProfileSchema.partial();

export const socialLinkSchema = z.object({
  platform: z.enum([
    'LINKEDIN',
    'GITHUB',
    'PORTFOLIO',
    'WEBSITE',
    'LEETCODE',
    'CODEFORCES',
    'CODECHEF',
    'HACKERRANK',
    'MEDIUM',
    'DEV',
    'TWITTER',
    'DRIBBBLE',
    'BEHANCE',
    'OTHER',
  ]),
  label: z.string().max(60).optional(),
  url: lenientUrl,
});

export const socialLinkUpdateSchema = socialLinkSchema
  .partial()
  .refine(
    (value) => Boolean(value.platform || value.label || value.url),
    'At least one field is required',
  );

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
export type PatchProfileInput = z.infer<typeof patchProfileSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
export type SocialLinkUpdateInput = z.infer<typeof socialLinkUpdateSchema>;
