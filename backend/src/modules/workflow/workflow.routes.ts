import { Router } from 'express';
import { workflowController } from './workflow.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { expensiveAiRateLimiter } from '../../middleware/rate-limiter';
import { guardConcurrency } from '../../middleware/concurrency-guard';
import { requireQuota } from '../../middleware/quota';
import { idempotency } from '../../middleware/idempotency';
import { FeatureType } from '../../config/limits';
import { startWorkflowSchema } from '../../validators/workflow.schema';

const router: Router = Router();
router.use(authenticate);

// Initiate a new generation session (Validates schema before DB insert)
router.post('/', validate(startWorkflowSchema), workflowController.initiate);

// Get an existing session (Free read)
router.get('/:id', workflowController.getSession);

// Get workflow logs for a session (Free read)
router.get('/:id/logs', workflowController.getLogs);

// Execute the LangGraph workflow (Consumes RESUME_GENERATION quota)
router.post(
  '/:id/execute',
  idempotency,
  expensiveAiRateLimiter,
  guardConcurrency(FeatureType.RESUME_GENERATION),
  requireQuota(FeatureType.RESUME_GENERATION),
  workflowController.execute,
);

export default router;
export { router as workflowRouter };
