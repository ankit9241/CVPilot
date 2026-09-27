import { Router } from 'express';
import { atsController } from './ats.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { expensiveAiRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { idempotency } from '../../middleware/idempotency';
import { FeatureType } from '../../config/limits';
import { analyzeAtsSchema, diffSchema, interviewPrepSchema, coverLetterSchema } from './ats.dto';

const router: Router = Router();
router.use(authenticate);

// Analyze a resume version against a job description (ATS_ANALYSIS quota)
router.post(
  '/analyze',
  validate(analyzeAtsSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.analyze,
);

// Get the latest ATS report for a saved resume (Free GET read, no quota consumed)
router.get('/latest/:resumeId', atsController.latest);

// Senior-recruiter persona review (ATS_ANALYSIS quota)
router.post(
  '/recruiter-review',
  validate(analyzeAtsSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.recruiterReview,
);

// Intelligent job tailoring — reorder, reword, emphasize by JD relevance (AI_OPTIMIZATION quota)
router.post(
  '/tailor',
  validate(analyzeAtsSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.AI_OPTIMIZATION),
  requireQuota(FeatureType.AI_OPTIMIZATION),
  atsController.tailor,
);

// Resume writing quality analysis (ATS_ANALYSIS quota)
router.post(
  '/quality',
  validate(analyzeAtsSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.quality,
);

// Compare two resume versions (ATS_ANALYSIS quota)
router.post(
  '/diff',
  validate(diffSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.diff,
);

// Health dashboard — aggregated quality signals (ATS_ANALYSIS quota)
router.post(
  '/health',
  validate(analyzeAtsSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.health,
);

// AI interview prep — grounded in resume content (ATS_ANALYSIS quota)
router.post(
  '/interview-prep',
  validate(interviewPrepSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.interviewPrep,
);

// Cover letter generation (AI_REWRITE quota)
router.post(
  '/cover-letter',
  validate(coverLetterSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.AI_REWRITE),
  requireQuota(FeatureType.AI_REWRITE),
  atsController.coverLetter,
);

export default router;
export { router as atsRouter };
