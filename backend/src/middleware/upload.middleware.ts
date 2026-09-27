import multer, { type FileFilterCallback } from 'multer';
import path from 'path';
import type { Request, Response, NextFunction } from 'express';
import { SECURITY_LIMITS } from '../config/limits';
import { PayloadTooLargeError, InvalidFileError } from '../utils/errors';

// Safe filename sanitizer
export function sanitizeFilename(rawName: string): string {
  const base = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 0 ? base : 'uploaded_document';
}

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype.toLowerCase();

  const isExtAllowed = (SECURITY_LIMITS.uploads.allowedExtensions as readonly string[]).includes(ext);
  const isMimeAllowed =
    (SECURITY_LIMITS.uploads.allowedMimeTypes as readonly string[]).includes(mime) ||
    mime === 'application/octet-stream'; // Some OS upload valid docs as octet-stream

  if (isExtAllowed && isMimeAllowed) {
    cb(null, true);
  } else {
    cb(
      new InvalidFileError(
        `Unsupported file format "${ext}". Allowed formats are: ${SECURITY_LIMITS.uploads.allowedExtensions.join(', ')}`,
      ),
    );
  }
};

export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: SECURITY_LIMITS.uploads.maxFileUploadBytes,
    files: 1,
  },
  fileFilter,
});

/**
 * Express middleware wrapper to catch Multer errors (e.g. LIMIT_FILE_SIZE)
 * and convert them into structured HTTP errors (413 / 400).
 */
export function safeUploadSingle(fieldName = 'file') {
  const uploadHandler = documentUpload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction): void => {
    uploadHandler(req, res, (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(
              new PayloadTooLargeError(
                `File size exceeds the maximum limit of ${SECURITY_LIMITS.uploads.maxFileUploadBytes / (1024 * 1024)}MB.`,
              ),
            );
          }
          return next(new InvalidFileError(`File upload error: ${err.message}`));
        }
        return next(err);
      }

      if (req.file) {
        req.file.originalname = sanitizeFilename(req.file.originalname);
      }

      return next();
    });
  };
}
