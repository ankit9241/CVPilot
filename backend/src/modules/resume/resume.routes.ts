import { Router } from 'express';
import { atsController, resumeController } from './resume.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { expensiveAiRateLimiter, pdfGenerationRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { idempotency } from '../../middleware/idempotency';
import { FeatureType } from '../../config/limits';
import {
  createResumeSchema,
  createResumeVersionSchema,
  updateResumeSchema,
} from '../../validators/resume.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/dashboard-stats', resumeController.getDashboardStats);
router.get('/', resumeController.list);
router.post('/', validate(createResumeSchema), resumeController.create);
router.get('/:id', resumeController.get);
router.patch('/:id', validate(updateResumeSchema), resumeController.update);
router.delete('/:id', resumeController.remove);

router.get('/:id/versions', resumeController.listVersions);
router.post('/:id/versions', validate(createResumeVersionSchema), resumeController.createVersion);

// Render XeLaTeX PDF (Consumes PDF_GENERATION quota)
router.post(
  '/versions/:versionId/render',
  idempotency,
  pdfGenerationRateLimiter,
  guardConcurrency(FeatureType.PDF_GENERATION),
  requireQuota(FeatureType.PDF_GENERATION),
  resumeController.render,
);

// ATS analysis on a saved resume version (Consumes ATS_ANALYSIS quota)
router.get('/:resumeId/ats', atsController.latest);
router.post(
  '/:resumeId/ats',
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  atsController.analyze,
);

export default router;
export { router as resumeRouter };
