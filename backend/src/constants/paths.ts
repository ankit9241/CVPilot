export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  UPLOADED_RESUMES: 'uploaded-resumes',
  GENERATED_RESUMES: 'generated-resumes',
  GENERATED_DOCX: 'generated-docx',
  GENERATED_LATEX: 'generated-latex',
  TEMPLATES: 'templates',
} as const;

export const ALLOWED_PROFILE_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const ALLOWED_UPLOADED_RESUME_MIME = ['application/pdf'] as const;
export const ALLOWED_TEMPLATE_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/x-tex',
  'application/zip',
] as const;
export const ALLOWED_GENERATED_MIME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/x-tex',
] as const;

export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_UPLOADED_RESUME_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_TEMPLATE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_GENERATED_BYTES = 25 * 1024 * 1024; // 25 MB
