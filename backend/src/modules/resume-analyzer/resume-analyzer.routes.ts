import { Router } from 'express';
import { resumeAnalyzerController } from './resume-analyzer.controller';
import { authenticate } from '../../middleware/authenticate';
import { safeUploadSingle } from '../../middleware/upload.middleware';
import { fileUploadRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { FeatureType } from '../../config/limits';

const router: Router = Router();
router.use(authenticate);

// Standalone ATS resume checker — upload PDF/DOCX, get full analysis (Consumes ATS_ANALYSIS quota)
router.post(
  '/analyze',
  fileUploadRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  safeUploadSingle('resumeFile'),
  resumeAnalyzerController.analyze,
);

router.post(
  '/analyze-stream',
  fileUploadRateLimiter,
  guardConcurrency(FeatureType.ATS_ANALYSIS),
  requireQuota(FeatureType.ATS_ANALYSIS),
  safeUploadSingle('resumeFile'),
  resumeAnalyzerController.analyzeStream,
);

export default router;
export { router as resumeAnalyzerRouter };
