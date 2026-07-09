import { z } from 'zod';

export const upsertProfileSchema = z.object({
  fullName: z.string().min(1).max(120),
  headline: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  location: z.string().max(120).optional(),
  summary: z.string().max(2000).optional(),
  avatarUrl: z.string().url().optional(),
});

export const socialLinkSchema = z.object({
  platform: z.enum([
    'LINKEDIN',
    'GITHUB',
    'PORTFOLIO',
    'LEETCODE',
    'TWITTER',
    'DRIBBBLE',
    'BEHANCE',
    'OTHER',
  ]),
  label: z.string().max(60).optional(),
  url: z.string().url(),
});

export type UpsertProfileInput = z.infer<typeof upsertProfileSchema>;
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;
