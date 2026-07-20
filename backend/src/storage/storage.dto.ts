import { z } from 'zod';
import { storageFileTypeValues } from './storage.types';

export const storageFileTypeSchema = z.enum(storageFileTypeValues);

export const storageListQuerySchema = z.object({
  fileType: storageFileTypeSchema.optional(),
});

export const storageUploadSchema = z.object({
  fileType: storageFileTypeSchema,
  replaceFileId: z.string().uuid().optional(),
});

export const storagePresignSchema = z.object({
  fileType: storageFileTypeSchema,
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  size: z.coerce.number().int().positive(),
  checksum: z.string().min(32).max(128).optional(),
  replaceFileId: z.string().uuid().optional(),
  storageKey: z.string().min(1).max(512).optional(),
});

export const storageCompleteSchema = storagePresignSchema.extend({
  storageKey: z.string().min(1).max(512),
});

export type StorageFileTypeInput = z.infer<typeof storageFileTypeSchema>;
export type StorageListQueryInput = z.infer<typeof storageListQuerySchema>;
export type StorageUploadInput = z.infer<typeof storageUploadSchema>;
export type StoragePresignInput = z.infer<typeof storagePresignSchema>;
export type StorageCompleteInput = z.infer<typeof storageCompleteSchema>;
