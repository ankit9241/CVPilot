import type { Request, Response, NextFunction } from 'express';
import rateLimit, { type Options } from 'express-rate-limit';
import { SECURITY_LIMITS } from '../config/limits';
import { logger } from '../logger/logger';

function createLimiter(
  windowMs: number,
  max: number,
  category: string,
  userScoped = false,
  customMessage?: string,
) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      // If user-scoped and authenticated, prioritize verified server-side user ID
      if (userScoped && req.user?.sub) {
        return `user:${req.user.sub}:${category}`;
      }
      // Otherwise fall back to client IP
      const forwarded = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim();
      const ip = forwarded || req.ip || req.socket.remoteAddress || 'unknown-ip';
      return `ip:${ip}:${category}`;
    },
    handler: (req: Request, res: Response, _next: NextFunction, options: Options) => {
      const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
      res.set('Retry-After', String(retryAfterSeconds));

      const message =
        customMessage ||
        `Too many requests for ${category.replace(/_/g, ' ')}. Please wait ${retryAfterSeconds} seconds before trying again.`;

      logger.warn('Rate limit exceeded', {
        category,
        userId: req.user?.sub,
        ip: req.ip,
        retryAfterSeconds,
      });

      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message,
          details: {
            retryAfter: retryAfterSeconds,
            category,
          },
        },
      });
    },
    skip: () => process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT_TEST !== 'true',
  });
}

// 1. General Public API Rate Limiter (60 req / min / IP)
export const globalRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.publicGeneral.windowMs,
  SECURITY_LIMITS.rateLimit.publicGeneral.max,
  'public_general',
  false,
);

// 2. Auth Endpoints Rate Limiter (10 req / 15 min / IP)
export const authRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.auth.windowMs,
  SECURITY_LIMITS.rateLimit.auth.max,
  'auth',
  false,
  'Too many authentication attempts. Please try again later.',
);

// 3. Registration Rate Limiter (5 attempts / 1 hour / IP)
export const registrationRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.registration.windowMs,
  SECURITY_LIMITS.rateLimit.registration.max,
  'registration',
  false,
  'Too many accounts created from this IP. Please try again later.',
);

// 4. Login Rate Limiter (5 attempts / 15 min / IP)
export const loginRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.login.windowMs,
  SECURITY_LIMITS.rateLimit.login.max,
  'login',
  false,
  'Too many login attempts. Please try again in 15 minutes.',
);

// 5. Refresh Token Rate Limiter (20 req / 15 min / user/IP)
export const refreshRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.refresh.windowMs,
  SECURITY_LIMITS.rateLimit.refresh.max,
  'refresh',
  true,
);

// 6. Normal Authenticated API (120 req / min / user)
export const authenticatedApiRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.authenticatedApi.windowMs,
  SECURITY_LIMITS.rateLimit.authenticatedApi.max,
  'authenticated_api',
  true,
);

// 7. Expensive AI Operations (10 req / 10 min / user)
export const expensiveAiRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.expensiveAi.windowMs,
  SECURITY_LIMITS.rateLimit.expensiveAi.max,
  'expensive_ai',
  true,
  'Too many AI requests in a short period. Please wait a few minutes before submitting again.',
);

// 8. PDF Generation (10 req / 10 min / user)
export const pdfGenerationRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.pdfGeneration.windowMs,
  SECURITY_LIMITS.rateLimit.pdfGeneration.max,
  'pdf_generation',
  true,
  'Too many PDF generation requests. Please wait a few minutes before trying again.',
);

// 9. File Upload (20 req / 10 min / user)
export const fileUploadRateLimiter = createLimiter(
  SECURITY_LIMITS.rateLimit.fileUpload.windowMs,
  SECURITY_LIMITS.rateLimit.fileUpload.max,
  'file_upload',
  true,
  'Too many file upload requests. Please wait a few minutes before trying again.',
);
