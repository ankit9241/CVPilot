import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { expensiveAiRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { idempotency } from '../../middleware/idempotency';
import { FeatureType } from '../../config/limits';
import { linkedInController } from './linkedin.controller';
import { linkedInOptimizeSchema } from './linkedin.dto';

const router: Router = Router();
router.use(authenticate);

// Optimize resume content for LinkedIn profile (AI_OPTIMIZATION quota)
router.post(
  '/optimize',
  validate(linkedInOptimizeSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.AI_OPTIMIZATION),
  requireQuota(FeatureType.AI_OPTIMIZATION),
  linkedInController.optimize,
);

export default router;
export { router as linkedInRouter };
