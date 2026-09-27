import { FeatureType } from '@prisma/client';

export { FeatureType };

/**
 * Fixed monthly limits for all authenticated users.
 * There are NO plans, tiers, or subscriptions.
 * Every user receives the exact same generous monthly allocation.
 */
export const MONTHLY_FEATURE_LIMITS: Record<FeatureType, number> = {
  [FeatureType.ATS_ANALYSIS]: 10,
  [FeatureType.RESUME_GENERATION]: 5,
  [FeatureType.AI_OPTIMIZATION]: 10,
  [FeatureType.RESUME_IMPORT]: 5,
  [FeatureType.AI_REWRITE]: 20,
  [FeatureType.PDF_GENERATION]: 10,
};

/**
 * Short-window rate limits, concurrency bounds, timeouts, and upload constraints.
 */
export const SECURITY_LIMITS = {
  // Rate limiting configurations (requests per window)
  rateLimit: {
    publicGeneral: {
      windowMs: 60 * 1000, // 1 minute
      max: 60,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10,
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 5,
    },
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5,
    },
    refresh: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20,
    },
    authenticatedApi: {
      windowMs: 60 * 1000, // 1 minute
      max: 120,
    },
    expensiveAi: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 10,
    },
    pdfGeneration: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 10,
    },
    fileUpload: {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 20,
    },
  },

  // Per-user and global active concurrency limits
  concurrency: {
    [FeatureType.ATS_ANALYSIS]: 2,
    [FeatureType.RESUME_GENERATION]: 2,
    [FeatureType.AI_OPTIMIZATION]: 2,
    [FeatureType.RESUME_IMPORT]: 2,
    [FeatureType.AI_REWRITE]: 2,
    [FeatureType.PDF_GENERATION]: 2,
    globalPdfMax: 4, // Max simultaneous LaTeX compilations on this instance
  },

  // Timeouts in milliseconds
  timeouts: {
    llm: 60 * 1000, // 60 seconds
    pdf: 30 * 1000, // 30 seconds
    standardRequest: 30 * 1000, // 30 seconds
    expensiveRequest: 90 * 1000, // 90 seconds
  },

  // Request & File upload constraints
  uploads: {
    maxJsonBodyBytes: 5 * 1024 * 1024, // 5MB
    maxFileUploadBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ],
    allowedExtensions: ['.pdf', '.docx', '.doc', '.txt'],
  },

  // Idempotency settings
  idempotency: {
    ttlSeconds: 24 * 60 * 60, // 24 hours
  },
} as const;
