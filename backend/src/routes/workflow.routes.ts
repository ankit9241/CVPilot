import { Router } from 'express';
import { workflowController } from '../controllers/workflow.controller';
import { authenticate } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { startWorkflowSchema } from '../validators/workflow.schema';

const router: Router = Router();
router.use(authenticate);

router.get('/', workflowController.list);
router.post('/', validate(startWorkflowSchema), workflowController.start);
router.get('/:id', workflowController.get);
router.get('/:id/logs', workflowController.logs);
router.post('/:id/cancel', workflowController.cancel);

export default router;
