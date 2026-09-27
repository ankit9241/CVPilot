import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { expensiveAiRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { idempotency } from '../../middleware/idempotency';
import { FeatureType } from '../../config/limits';
import { portfolioController } from './portfolio.controller';
import { portfolioGenerateSchema } from './portfolio.dto';

const router: Router = Router();
router.use(authenticate);

// Generate portfolio website content from resume (AI_OPTIMIZATION quota)
router.post(
  '/generate',
  validate(portfolioGenerateSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.AI_OPTIMIZATION),
  requireQuota(FeatureType.AI_OPTIMIZATION),
  portfolioController.generate,
);

export default router;
export { router as portfolioRouter };
