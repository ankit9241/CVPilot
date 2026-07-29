import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { benchmarkController } from './benchmark.controller';
import { benchmarkSchema } from './benchmark.dto';

const router: Router = Router();
router.use(authenticate);

// Benchmark resume against hiring expectations for the target role and seniority
router.post('/', validate(benchmarkSchema), benchmarkController.benchmark);

export default router;
export { router as benchmarkRouter };
