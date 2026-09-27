import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { expensiveAiRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { idempotency } from '../../middleware/idempotency';
import { FeatureType } from '../../config/limits';
import { benchmarkController } from './benchmark.controller';
import { benchmarkSchema } from './benchmark.dto';

const router: Router = Router();
router.use(authenticate);

// Benchmark resume against hiring expectations for the target role and seniority (AI_OPTIMIZATION quota)
router.post(
  '/',
  validate(benchmarkSchema),
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.AI_OPTIMIZATION),
  requireQuota(FeatureType.AI_OPTIMIZATION),
  benchmarkController.benchmark,
);

export default router;
export { router as benchmarkRouter };
