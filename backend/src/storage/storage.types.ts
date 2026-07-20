import {
  STORAGE_PATHS,
  ALLOWED_PROFILE_IMAGE_MIME,
  ALLOWED_UPLOADED_RESUME_MIME,
  ALLOWED_TEMPLATE_MIME,
  ALLOWED_GENERATED_MIME,
  MAX_PROFILE_IMAGE_BYTES,
  MAX_UPLOADED_RESUME_BYTES,
  MAX_TEMPLATE_BYTES,
  MAX_GENERATED_BYTES,
} from '../constants/paths';

export const storageFileTypeValues = [
  'PROFILE_PICTURE',
  'UPLOADED_RESUME',
  'RESUME_TEMPLATE',
  'GENERATED_PDF',
  'GENERATED_DOCX',
  'GENERATED_LATEX',
] as const;

export type StorageFileType = (typeof storageFileTypeValues)[number];

export interface StorageFileRecord {
  id: string;
  userId: string;
  fileType: StorageFileType;
  originalName: string;
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  checksum?: string | null;
  createdAt: Date;
}

export interface StorageFileView extends StorageFileRecord {
  downloadUrl: string;
}

export interface StorageUploadRequest {
  fileType: StorageFileType;
  originalName: string;
  mimeType: string;
  size: number;
  checksum?: string;
  replaceFileId?: string;
  storageKey?: string;
}

export interface StorageUploadResponse extends StorageFileView {
  uploadUrl?: string;
  method?: 'PUT';
  headers?: Record<string, string>;
}

export const STORAGE_FOLDERS: Record<StorageFileType, string> = {
  PROFILE_PICTURE: STORAGE_PATHS.PROFILE_IMAGES,
  UPLOADED_RESUME: STORAGE_PATHS.UPLOADED_RESUMES,
  RESUME_TEMPLATE: STORAGE_PATHS.TEMPLATES,
  GENERATED_PDF: STORAGE_PATHS.GENERATED_RESUMES,
  GENERATED_DOCX: STORAGE_PATHS.GENERATED_DOCX,
  GENERATED_LATEX: STORAGE_PATHS.GENERATED_LATEX,
};

export const STORAGE_RULES: Record<
  StorageFileType,
  { maxBytes: number; mimeTypes: readonly string[] }
> = {
  PROFILE_PICTURE: { maxBytes: MAX_PROFILE_IMAGE_BYTES, mimeTypes: ALLOWED_PROFILE_IMAGE_MIME },
  UPLOADED_RESUME: { maxBytes: MAX_UPLOADED_RESUME_BYTES, mimeTypes: ALLOWED_UPLOADED_RESUME_MIME },
  RESUME_TEMPLATE: { maxBytes: MAX_TEMPLATE_BYTES, mimeTypes: ALLOWED_TEMPLATE_MIME },
  GENERATED_PDF: { maxBytes: MAX_GENERATED_BYTES, mimeTypes: ALLOWED_GENERATED_MIME },
  GENERATED_DOCX: { maxBytes: MAX_GENERATED_BYTES, mimeTypes: ALLOWED_GENERATED_MIME },
  GENERATED_LATEX: { maxBytes: MAX_GENERATED_BYTES, mimeTypes: ALLOWED_GENERATED_MIME },
};
