import { z } from 'zod';

export const idParam = z.object({ id: z.string().uuid() });

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export const lenientUrl = z.preprocess((val) => {
  if (typeof val !== 'string') return val;
  const trimmed = val.trim();
  if (!trimmed) return undefined;
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}, z.string().url());

export type IdParam = z.infer<typeof idParam>;
export type PaginationQuery = z.infer<typeof paginationQuery>;
