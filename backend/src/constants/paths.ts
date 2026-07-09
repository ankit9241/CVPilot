export const STORAGE_PATHS = {
  PROFILE_IMAGES: 'profile-images',
  UPLOADED_RESUMES: 'uploaded-resumes',
  GENERATED_PDFS: 'generated-pdfs',
  TEMPLATES: 'templates',
} as const;

export const ALLOWED_RESUME_MIME = ['application/pdf'] as const;
export const ALLOWED_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
